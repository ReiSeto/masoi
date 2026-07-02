/**
 * GameEngine — Vòng lặp game chính
 * 
 * Flow: lobby:start → gán vai → night → dawn → discuss → vote → (lặp lại)
 * Server-authoritative: client chỉ nhận thông tin cần thiết
 */
const GameState = require('./GameState');
const { assignRoles, ROLE_INFO } = require('./RoleAssigner');
const { resolveNight, NIGHT_DURATION } = require('./phases/NightPhase');
const { generateDawnMessages, DAY_DURATION } = require('./phases/DayPhase');
const { DISCUSS_DURATION } = require('./phases/DiscussPhase');
const { resolveVotes, VOTE_DURATION } = require('./phases/VotePhase');
const { decideNightAction, decideVote, decideHunterShot, decideGunnerShot } = require('./BotBrain');
const { User, UserStats, UserDailyQuest, sequelize } = require('../models');

// Lưu tham chiếu tới io cho từng game
const activeGames = new Map();

class GameEngine {
  static getActiveGame(gameId) {
    return activeGames.get(gameId);
  }

  handlePlayerLeave(userId) {
    const playerIndex = this.players.findIndex(p => p.userId === userId);
    if (playerIndex !== -1) {
      const player = this.players[playerIndex];
      this.players.splice(playerIndex, 1);

      if (this.isRunning) {
        this.gameState.getPlayer(userId).then(statePlayer => {
          if (statePlayer && statePlayer.isAlive) {
            this.gameState.updatePlayer(userId, { isAlive: false, deathCause: 'disconnected' });
            this.emitToGame('game:event', { message: `🚪 ${player.username} đã thoát khỏi trò chơi!` });
          }
        });
      }

      const humans = this.players.filter(p => !this.isBot(p));
      if (humans.length === 0 && this.isRunning) {
        this.endGame({ winningTeam: 'draw', reason: 'Tất cả người chơi đã thoát khỏi game.' });
      }
    }
  }

  constructor(io, gameId, players, roleConfig = {}, lobbyRules = {}) {
    this.io = io;
    this.gameId = gameId;
    this.players = players; // [{userId, username, socket_id}]
    this.roleConfig = roleConfig;
    this.lobbyRules = lobbyRules; // {forceVote, anonymousVote, clearChatDaily, hideRoleOnDeath, lastWill}
    // Track whether this game used the default role config (for quest validation)
    this.isDefaultConfig = !roleConfig || Object.keys(roleConfig).length === 0;
    this.gameState = new GameState(gameId);
    this.timer = null;
    this.isRunning = false;
    this.isEnding = false;
  }

  /**
   * Bắt đầu game
   */
  async start() {
    console.log(`🎮 Game ${this.gameId} bắt đầu với ${this.players.length} người chơi`);

    // Hủy game cũ nếu trùng gameId
    const oldEngine = activeGames.get(this.gameId);
    if (oldEngine) {
      console.log(`🧹 Đang dọn dẹp ván đấu cũ trùng ID: ${this.gameId}`);
      oldEngine.clearTimer();
      oldEngine.isRunning = false;
      if (oldEngine.cleanupTimeout) {
        clearTimeout(oldEngine.cleanupTimeout);
      }
    }

    // 1. Gán vai trò
    const assignments = assignRoles(this.players, this.roleConfig);

    // 1.5. Gán target cho Headhunter (chọn ngẫu nhiên 1 người phe village, không phải chính mình)
    const headhunterEntries = Object.entries(assignments).filter(([, d]) => d.roleSlug === 'headhunter');
    for (const [hhId, hhData] of headhunterEntries) {
      const villageTargets = Object.entries(assignments).filter(
        ([id, d]) => id !== hhId && d.team === 'village'
      );
      if (villageTargets.length > 0) {
        const randomTarget = villageTargets[Math.floor(Math.random() * villageTargets.length)];
        hhData.roleData = { ...hhData.roleData, target: randomTarget[0], targetUsername: randomTarget[1].username, targetSeat: randomTarget[1].seatNumber, won: false };
      }
    }

    // 2. Khởi tạo game state trong Redis
    const playerIds = Object.keys(assignments);
    await this.gameState.init({ playerIds });
    await this.gameState.setPlayers(assignments);

    // 3. Gửi thông tin vai trò cho từng người chơi (chỉ vai của mình)
    for (const [playerId, data] of Object.entries(assignments)) {
      const player = this.players.find(p => p.userId === playerId);
      if (player?.socket_id) {
        this.io.to(player.socket_id).emit('game:role_assigned', {
          gameId: this.gameId,
          role: {
            slug: data.roleSlug,
            team: data.team,
            aura: data.aura,
            hasNightAction: data.hasNightAction,
            seatNumber: data.seatNumber,
          },
          roleData: data.roleData,
        });
      }
    }

    // 4. Gửi thông tin ban đầu cho tất cả (danh sách ghế, không lộ vai, trừ khi đã chết)
    const publicPlayers = Object.values(assignments).map(p => ({
      userId: p.userId,
      username: p.username,
      seatNumber: p.seatNumber,
      isAlive: true,
      roleSlug: null,
    }));

    const roleList = Object.values(assignments).map(p => p.roleSlug);

    this.emitToGame('game:init', {
      gameId: this.gameId,
      players: publicPlayers,
      phase: 'night',
      round: 1,
      roleList: roleList,
    });

    // 5. Gửi danh sách sói cho phe Sói (chỉ biết ai là sói, KHÔNG biết vai trò cụ thể)
    const wolves = Object.entries(assignments)
      .filter(([, data]) => data.team === 'werewolf')
      .map(([id, data]) => ({
        userId: id,
        username: data.username,
        seatNumber: data.seatNumber,
        // Không gửi roleSlug — sói chỉ biết đồng đội là sói, không biết vai trò cụ thể
      }));

    for (const wolf of wolves) {
      const player = this.players.find(p => p.userId === wolf.userId);
      if (player?.socket_id) {
        this.io.to(player.socket_id).emit('game:wolf_team', {
          wolves: wolves.filter(w => w.userId !== wolf.userId),
        });
        // Join wolf chat room
        const socket = this.io.sockets.sockets.get(player.socket_id);
        if (socket) socket.join(`game:${this.gameId}:wolf`);
      }
    }

    // 6. Lưu vào activeGames
    activeGames.set(this.gameId, this);
    this.isRunning = true;

    // 7. Bắt đầu phase đầu tiên: ĐÊM
    await this.startNightPhase();
  }

  // ============================================================
  // PHASE MANAGEMENT
  // ============================================================

  async startNightPhase() {
    const state = await this.gameState.get();
    await this.gameState.update({ phase: 'night' });
    await this.gameState.clearNightActions();

    this.emitToGame('game:phase_change', {
      phase: 'night',
      round: state.round,
      duration: NIGHT_DURATION,
      message: `🌙 Đêm ${state.round} buông xuống... Mọi người nhắm mắt.`,
    });

    // Gửi danh sách target cho từng vai trò có night action
    await this.sendNightActionPrompts();

    // Notify jailed player and Jailer
    const players = await this.gameState.getAllPlayers();
    let jailedPlayerId = null;
    let jailerId = null;
    for (const [pid, p] of Object.entries(players)) {
      if (p.roleSlug === 'jailer') {
        if (p.isAlive) {
          jailerId = pid;
          jailedPlayerId = p.roleData?.nextJailed || null;
        } else if (p.roleData?.nextJailed) {
          // Xóa trạng thái giam nếu Cai Ngục đã chết
          await this.gameState.updatePlayer(pid, {
            roleData: { ...p.roleData, nextJailed: null }
          });
        }
      }
    }

    if (jailedPlayerId) {
      const targetSocketId = this.players.find(p => p.userId?.toString() === jailedPlayerId?.toString())?.socket_id;
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('game:you_are_jailed', {
          jailed: true,
          message: '⛓️ Bạn đã bị Cai Ngục giam giữ đêm nay! Mọi hành động đêm của bạn đã bị khóa và bạn có thể trò chuyện với Cai Ngục.',
        });
      }
      
      const jailerSocketId = this.players.find(p => p.userId?.toString() === jailerId?.toString())?.socket_id;
      if (jailerSocketId) {
        const jailedPlayer = players[jailedPlayerId];
        this.io.to(jailerSocketId).emit('game:you_are_jailed', {
          jailed: false,
          jailedUserId: jailedPlayerId,
          jailedUsername: jailedPlayer?.username,
          message: `⛓️ Bạn đang giam giữ ${jailedPlayer?.username || 'mục tiêu'}. Kênh chat giam ngục đã mở.`,
        });
      }
    }

    // Bot AI: auto-play night actions
    await this.scheduleBotNightActions();

    // Timer
    this.setTimer(NIGHT_DURATION, () => this.endNightPhase());
  }

  async sendNightActionPrompts() {
    const players = await this.gameState.getAllPlayers();
    for (const playerId of Object.keys(players)) {
      await this.sendNightActionPromptToPlayer(playerId);
    }
  }

  async sendNightActionPromptToPlayer(playerId, socketId = null) {
    const players = await this.gameState.getAllPlayers();
    const state = await this.gameState.get();
    const data = players[playerId];
    if (!data || !data.isAlive || !data.hasNightAction) return;

    const targetSocketId = socketId || this.players.find(p => p.userId === playerId)?.socket_id;
    if (!targetSocketId) return;

    const alivePlayers = Object.entries(players)
      .filter(([, p]) => p.isAlive)
      .map(([id, p]) => ({
        userId: id,
        username: p.username,
        seatNumber: p.seatNumber,
      }));

    let targets = alivePlayers.filter(p => p.userId !== playerId); // Mặc định không nhắm bản thân
    let actionType = '';
    let actionLabel = '';

    switch (data.roleSlug) {
      case 'werewolf':
      case 'alpha_wolf':
        actionType = 'wolf_kill';
        actionLabel = 'Chọn người để tiêu diệt';
        targets = alivePlayers.filter(p => {
          const pData = players[p.userId];
          return pData?.team !== 'werewolf';
        });
        break;
      case 'wolf_seer': {
        this.io.to(targetSocketId).emit('game:night_action_prompt', {
          roleSlug: 'wolf_seer',
          actions: [
            { type: 'wolf_seer_check', label: '🔮 Soi hào quang', targets: alivePlayers.filter(p => {
              const pData = players[p.userId];
              return pData?.team !== 'werewolf';
            }) },
            { type: 'wolf_seer_transform', label: '🐺 Hóa Sói thường', targets: [] },
          ],
        });
        return;
      }
      case 'seer':
        actionType = 'seer_check';
        actionLabel = 'Chọn người để xem hào quang';
        break;
      case 'doctor':
        actionType = 'doctor_save';
        actionLabel = 'Chọn người để bảo vệ';
        targets = alivePlayers;
        break;
      case 'witch': {
        actionType = 'witch_action';
        const rd = data.roleData || {};
        actionLabel = 'Phù Thủy: chọn hành động';
        this.io.to(targetSocketId).emit('game:night_action_prompt', {
          roleSlug: 'witch',
          actions: [
            ...(!rd.healUsed ? [{ type: 'witch_heal', label: '💊 Cứu người', targets: alivePlayers }] : []),
            ...(!rd.poisonUsed ? [{ type: 'witch_poison', label: '☠️ Đầu độc', targets }] : []),
            { type: 'witch_skip', label: '⏭️ Bỏ qua', targets: [] },
          ],
        });
        return;
      }
      case 'bodyguard':
        actionType = 'bodyguard_protect';
        actionLabel = 'Chọn người để bảo vệ';
        const lastProtected = data.roleData?.lastProtected;
        targets = alivePlayers.filter(p => p.userId !== playerId && p.userId !== lastProtected);
        break;
      case 'detective':
        actionType = 'detective_investigate';
        actionLabel = '🔍 Chọn 2 người để kiểm tra xem họ có cùng phe không';
        targets = alivePlayers.filter(p => p.userId !== playerId);
        break;
      case 'serial_killer':
        actionType = 'sk_kill';
        actionLabel = 'Chọn người để giết';
        break;
      case 'jailer': {
        const nextJailed = data.roleData?.nextJailed;
        const jailedPlayer = nextJailed ? alivePlayers.find(p => p.userId?.toString() === nextJailed?.toString()) : null;
        
        if (jailedPlayer && data.roleData?.canExecute) {
          this.io.to(targetSocketId).emit('game:night_action_prompt', {
            roleSlug: 'jailer',
            actionLabel: `⛓️ Đang giam giữ ${jailedPlayer.username}. Bạn có muốn xử tử họ?`,
            actions: [
              { type: 'jailer_execute', label: '☠️ Xử tử (1 viên đạn)', targets: [jailedPlayer] },
              { type: 'jailer_skip', label: '⏭️ Bỏ qua', targets: [] }
            ]
          });
        } else {
          // Không thể xử tử hoặc không có ai bị giam
          this.io.to(targetSocketId).emit('game:night_action_prompt', {
            roleSlug: 'jailer',
            actionLabel: nextJailed 
              ? `⛓️ Đang giam giữ ${jailedPlayer?.username || ''}. Bạn không còn đạn xử tử.`
              : '⛓️ Đêm nay không giam giữ ai.',
            targets: []
          });
        }
        return;
      }
      case 'arsonist': {
        const rd = data.roleData || {};
        const doused = rd.doused || [];
        this.io.to(targetSocketId).emit('game:night_action_prompt', {
          roleSlug: 'arsonist',
          actions: [
            { type: 'arsonist_douse', label: '🛢️ Đổ dầu (1-2 người)', targets: alivePlayers.filter(p => p.userId !== playerId && !doused.includes(p.userId)) },
            ...(doused.length > 0 ? [{ type: 'arsonist_ignite', label: `🔥 Châm lửa (${doused.length} mục tiêu)`, targets: [] }] : []),
            { type: 'arsonist_skip', label: '⏭️ Bỏ qua', targets: [] },
          ],
        });
        return;
      }
      case 'cupid': {
        if (state.round !== 1 || data.roleData?.linked) return;
        actionType = 'cupid_link';
        actionLabel = '💘 Chọn 2 người để ghép đôi yêu nhau';
        targets = alivePlayers;
        break;
      }
      default:
        return;
    }

    this.io.to(targetSocketId).emit('game:night_action_prompt', {
      roleSlug: data.roleSlug,
      actionType,
      actionLabel,
      targets,
    });
  }

  async endNightPhase() {
    this.clearTimer();
    
    // Giải quyết đêm
    const nightResults = await resolveNight(this.gameState);
    
    // Gửi thông báo cho cặp đôi yêu nhau (chỉ đêm 1) — hiển thị role của đối phương
    if (nightResults.lovers && nightResults.lovers.length > 0) {
      for (const lover of nightResults.lovers) {
        const allPlayers = await this.gameState.getAllPlayers();
        const p1 = allPlayers[lover.player1Id];
        const p2 = allPlayers[lover.player2Id];
        if (p1 && p2) {
          // Gửi cho player 1 biết role của player 2
          const sock1 = this.players.find(p => p.userId?.toString() === lover.player1Id?.toString())?.socket_id;
          if (sock1) {
            this.io.to(sock1).emit('game:lover_notify', {
              partnerId: lover.player2Id,
              partnerUsername: p2.username,
              partnerRole: p2.roleSlug,
              message: `💘 Bạn đã được ghép đôi với ${p2.username}! Vai trò của họ là: ${p2.roleSlug}. Hãy bảo vệ nhau!`,
            });
          }
          // Gửi cho player 2 biết role của player 1
          const sock2 = this.players.find(p => p.userId?.toString() === lover.player2Id?.toString())?.socket_id;
          if (sock2) {
            this.io.to(sock2).emit('game:lover_notify', {
              partnerId: lover.player1Id,
              partnerUsername: p1.username,
              partnerRole: p1.roleSlug,
              message: `💘 Bạn đã được ghép đôi với ${p1.username}! Vai trò của họ là: ${p1.roleSlug}. Hãy bảo vệ nhau!`,
            });
          }
        }
      }
    }

    // Kiểm tra thắng thua sau đêm
    const winCheck = await this.checkWinCondition();
    if (winCheck) {
      // Vẫn gửi thông tin rạng sáng để hiển thị lịch sử người chết
      const state = await this.gameState.get();
      const { generateDawnMessages } = require('./phases/DayPhase');
      const dawnMessages = generateDawnMessages(nightResults, state.round);
      
      this.emitToGame('game:phase_change', {
        phase: 'dawn',
        round: state.round,
        duration: 0,
        message: '☀️ Bình minh ló dạng... (Trò chơi kết thúc)',
        deaths: nightResults.deaths.map(d => ({
          playerId: d.playerId,
          username: d.username,
          cause: d.cause,
          roleSlug: d.roleSlug,
        })),
        saves: nightResults.saves.length,
        events: dawnMessages,
      });

      await this.triggerEndGame(winCheck, 4000);
      return;
    }

    // Chuyển sang giai đoạn Sáng (Dawn)
    await this.startDawnPhase(nightResults);
  }

  async startDawnPhase(nightResults) {
    const state = await this.gameState.get();
    await this.gameState.update({ phase: 'dawn' });

    const dawnMessages = generateDawnMessages(nightResults, state.round);

    // Gửi kết quả cho tất cả
    this.emitToGame('game:phase_change', {
      phase: 'dawn',
      round: state.round,
      duration: DAY_DURATION,
      message: '☀️ Bình minh ló dạng...',
      deaths: nightResults.deaths.map(d => ({
        playerId: d.playerId,
        username: d.username,
        cause: d.cause,
        roleSlug: d.roleSlug,
      })),
      saves: nightResults.saves.length,
      events: dawnMessages,
    });

    // Note: Kết quả check của Tiên Tri / Thám Tử được gửi trực tiếp, bảo mật và tức thời trong đêm qua handleNightAction.
    // Không gửi lại ở đây để tránh trùng lặp hiển thị / nhật ký trên màn hình người chơi.

    // Timer chuyển sang Discuss hoặc Hunter Revenge
    this.setTimer(DAY_DURATION, async () => {
      const state = await this.gameState.get();
      const players = await this.gameState.getAllPlayers();
      const deadHunter = Object.entries(players).find(([id, p]) => p.roleSlug === 'hunter' && !p.isAlive && !p.roleData?.shotUsed);
      
      if (deadHunter) {
        await this.triggerHunterRevenge(deadHunter[0], () => this.startDiscussPhase());
      } else {
        this.startDiscussPhase();
      }
    });
  }

  async startDiscussPhase() {
    this.clearTimer();
    const state = await this.gameState.get();
    await this.gameState.update({ phase: 'discuss' });

    // Custom rule: Xóa chat mỗi ngày
    const clearChat = this.lobbyRules.clearChatDaily || false;

    this.emitToGame('game:phase_change', {
      phase: 'discuss',
      round: state.round,
      duration: DISCUSS_DURATION,
      message: '💬 Giai đoạn thảo luận! Hãy tìm ra Sói!',
      clearChat,
    });

    // Send gunner prompt if alive
    // await this.sendGunnerPrompt();

    this.setTimer(DISCUSS_DURATION, () => this.startVotePhase());
  }

  async sendGunnerPrompt() {
    const players = await this.gameState.getAllPlayers();
    const state = await this.gameState.get();
    for (const [playerId, data] of Object.entries(players)) {
      if (!data.isAlive || data.roleSlug !== 'gunner') continue;
      if ((data.roleData?.bullets || 0) <= 0) continue;
      if (data.roleData?.lastShotRound === state.round) continue;
      const player = this.players.find(p => p.userId === playerId);
      if (!player?.socket_id) continue;
      const alivePlayers = Object.entries(players)
        .filter(([id, p]) => p.isAlive && id !== playerId)
        .map(([id, p]) => ({ userId: id, username: p.username, seatNumber: p.seatNumber }));
      this.io.to(player.socket_id).emit('game:gunner_prompt', {
        bullets: data.roleData.bullets,
        targets: alivePlayers,
        message: `🔫 Bạn có ${data.roleData.bullets} viên đạn. Bắn ai?`,
      });
    }
  }

  async handleGunnerShot(gunnerId, targetId) {
    const gunner = await this.gameState.getPlayer(gunnerId);
    if (!gunner || gunner.roleSlug !== 'gunner' || !gunner.isAlive) return { success: false };
    if ((gunner.roleData?.bullets || 0) <= 0) return { success: false, message: 'Hết đạn' };
    const state = await this.gameState.get();
    if (gunner.roleData?.lastShotRound && state.round - gunner.roleData.lastShotRound <= 1) {
      return { success: false, message: 'Sau khi bắn, bạn phải đợi cách 1 ngày mới có thể bắn tiếp!' };
    }
    const target = await this.gameState.getPlayer(targetId);
    if (!target || !target.isAlive) return { success: false };

    await this.gameState.updatePlayer(gunnerId, {
      roleData: { 
        ...gunner.roleData, 
        bullets: gunner.roleData.bullets - 1,
        lastShotRound: state.round,
        revealed: true
      }
    });
    await this.gameState.updatePlayer(targetId, { isAlive: false, deathRound: state.round, deathCause: 'gunner_shot' });
    const updatedPlayers = await this.gameState.getAllPlayers();
    const alivePlayers = Object.keys(updatedPlayers).filter(id => updatedPlayers[id].isAlive);
    const deadPlayers = Object.keys(updatedPlayers).filter(id => !updatedPlayers[id].isAlive);
    await this.gameState.update({ alivePlayers, deadPlayers });

    this.emitToGame('game:gunner_shot_result', {
      gunnerId, gunnerUsername: gunner.username,
      targetId, targetUsername: target.username, targetRole: target.roleSlug,
      bulletsLeft: gunner.roleData.bullets - 1,
      message: `🔫 ${gunner.username} (Xạ Thủ) đã bắn chết ${target.username}!`,
    });

    const winCheck = await this.checkWinCondition();
    if (winCheck) {
      await this.triggerEndGame(winCheck, 3000);
      return { success: true };
    }

    if (target.roleSlug === 'hunter' && !target.roleData?.shotUsed) {
      // Tạm dừng timer hiện tại của Discuss/Vote
      this.clearTimer();
      
      const currentPhase = state.phase;
      const nextCallback = currentPhase === 'discuss' 
        ? () => this.startVotePhase() 
        : () => this.endVotePhase();

      setTimeout(async () => {
        await this.triggerHunterRevenge(targetId, nextCallback);
      }, 2000);
    }

    return { success: true };
  }

  async startVotePhase() {
    this.clearTimer();
    const state = await this.gameState.get();
    await this.gameState.update({ phase: 'vote' });
    await this.gameState.clearVotes();

    const alivePlayers = await this.gameState.getAlivePlayers();
    const voteTargets = Object.entries(alivePlayers).map(([id, p]) => ({
      userId: id,
      username: p.username,
      seatNumber: p.seatNumber,
    }));

    this.emitToGame('game:phase_change', {
      phase: 'vote',
      round: state.round,
      duration: VOTE_DURATION,
      message: '🗳️ Bỏ phiếu! Chọn người bạn muốn treo cổ.',
      voteTargets,
    });

    // Bot AI: auto-vote
    await this.scheduleBotVotes();

    this.setTimer(VOTE_DURATION, () => this.endVotePhase());
  }

  async endVotePhase() {
    this.clearTimer();

    const voteResult = await resolveVotes(this.gameState);

    // Gửi kết quả vote
    this.emitToGame('game:vote_result', {
      voteCounts: voteResult.voteCounts,
      votedOutPlayer: voteResult.votedOutPlayer,
      isTie: voteResult.isTie,
      jesterWin: voteResult.jesterWin,
      events: voteResult.events,
    });

    // Jester thắng
    if (voteResult.jesterWin) {
      await this.triggerEndGame({
        winningTeam: 'solo',
        winnerRoleSlug: 'jester',
        reason: `🃏 Kẻ Hề (${voteResult.votedOutPlayer.username}) thắng cuộc!`,
      }, 3000);
      return;
    }

    // Kiểm tra Headhunter win độc lập: nếu người bị vote chết là target của HH
    // HH thắng ngay lập tức (solo win) bất kể phe nào thắng
    if (voteResult.votedOutPlayer) {
      const allPlayers = await this.gameState.getAllPlayers();
      const votedId = voteResult.votedOutPlayer.playerId?.toString();
      const headhunterWinners = [];
      for (const [pid, p] of Object.entries(allPlayers)) {
        if (p.roleSlug === 'headhunter' && p.roleData?.target?.toString() === votedId) {
          headhunterWinners.push(p.username);
        }
      }
      if (headhunterWinners.length > 0) {
        await this.triggerEndGame({
          winningTeam: 'solo',
          winnerRoleSlug: 'headhunter',
          headhunterWinners,
          reason: `🎯 Săn Đầu Người (${headhunterWinners.join(', ')}) thắng! Mục tiêu đã bị treo cổ!`,
        }, 3000);
        return;
      }
    }

    const nextPhase = async () => {
      const state = await this.gameState.get();
      await this.gameState.update({ round: state.round + 1 });
      await this.startNightPhase();
    };

    if (voteResult.hunterPending) {
      await this.triggerHunterRevenge(voteResult.votedOutPlayer.playerId, nextPhase);
    } else {
      const winCheck = await this.checkWinCondition();
      if (winCheck) {
        await this.triggerEndGame(winCheck, 3000);
      } else {
        await nextPhase();
      }
    }
  }

  // ============================================================
  // HUNTER SHOT
  // ============================================================
  async triggerHunterRevenge(hunterId, nextPhaseCallback) {
    const hunter = await this.gameState.getPlayer(hunterId);
    if (!hunter || hunter.roleSlug !== 'hunter' || hunter.roleData?.shotUsed) {
      return nextPhaseCallback();
    }

    // Check if hunter is a bot — auto-shoot
    const isBot = this.isBot({ userId: hunterId });
    if (isBot) {
      const botHandled = await this.handleBotHunterShot(hunterId);
      if (botHandled) {
        setTimeout(async () => {
          const winCheck = await this.checkWinCondition();
          if (winCheck) {
            await this.triggerEndGame(winCheck, 3000);
          } else {
            nextPhaseCallback();
          }
        }, 4000);
        return;
      }
    }

    // Set hunterPending in state
    await this.gameState.update({ hunterPending: hunterId, hunterTarget: null });

    const alivePlayers = await this.gameState.getAlivePlayers();
    const targets = Object.entries(alivePlayers).map(([id, p]) => ({
      userId: id,
      username: p.username,
      seatNumber: p.seatNumber,
    }));

    // Broadcast hunter revenge event to all players so they know they are waiting for Hunter
    this.emitToGame('game:phase_change', {
      phase: 'hunter_revenge',
      round: (await this.gameState.get())?.round,
      duration: 30,
      message: `🏹 ${hunter.username} (Thợ Săn) đã hy sinh! Họ có 30 giây để chọn mục tiêu trả thù!`,
    });

    const hunterPlayer = this.players.find(p => p.userId === hunterId);
    if (hunterPlayer?.socket_id) {
      this.io.to(hunterPlayer.socket_id).emit('game:hunter_shot_prompt', {
        targets,
        duration: 30,
        message: '🏹 Bạn là Thợ Săn! Chọn người để bắn (có thể thay đổi trong 30s)!',
      });
    }

    // Set a 30s timer
    this.setTimer(30, async () => {
      // Time is up, execute hunter shot on current hunterTarget if set
      const state = await this.gameState.get();
      const finalTargetId = state.hunterTarget;
      
      if (finalTargetId) {
        await this.executeHunterShot(hunterId, finalTargetId);
      } else {
        // Broadcast that Hunter did not choose a target
        this.emitToGame('game:hunter_shot_result', {
          hunterId,
          hunterUsername: hunter.username,
          targetId: null,
          message: `🏹 Thợ Săn ${hunter.username} đã không chọn mục tiêu trả thù.`,
        });
        await this.gameState.updatePlayer(hunterId, {
          roleData: { ...hunter.roleData, shotUsed: true }
        });
      }

      await this.gameState.update({ hunterPending: null, hunterTarget: null });

      // Check win condition after hunter shot
      const winCheck = await this.checkWinCondition();
      if (winCheck) {
        await this.triggerEndGame(winCheck, 3000);
      } else {
        nextPhaseCallback();
      }
    });
  }

  async executeHunterShot(hunterId, targetId) {
    await this.gameState.update({ hunterPending: null });
    const players = await this.gameState.getAllPlayers();
    const target = players[targetId];
    const hunter = players[hunterId];

    if (target?.isAlive) {
      const state = await this.gameState.get();
      await this.gameState.updatePlayer(targetId, {
        isAlive: false,
        deathRound: state.round,
        deathCause: 'hunter_shot',
      });

      // Cập nhật alive list
      const updatedPlayers = await this.gameState.getAllPlayers();
      const alivePlayers = Object.keys(updatedPlayers).filter(id => updatedPlayers[id].isAlive);
      const deadPlayers = Object.keys(updatedPlayers).filter(id => !updatedPlayers[id].isAlive);
      await this.gameState.update({ alivePlayers, deadPlayers });

      this.emitToGame('game:hunter_shot_result', {
        hunterId,
        hunterUsername: hunter?.username,
        targetId,
        targetUsername: target?.username,
        targetRole: target?.roleSlug,
        message: `🏹 ${hunter?.username} (Thợ Săn) đã bắn chết ${target?.username}!`,
      });
    }

    await this.gameState.updatePlayer(hunterId, {
      roleData: { ...hunter?.roleData, shotUsed: true }
    });
  }

  // ============================================================
  // WIN CONDITION
  // ============================================================
  async checkWinCondition() {
    const players = await this.gameState.getAllPlayers();
    
    // Bất kỳ khi nào Thợ Săn bị chết (isAlive = false) và chưa thực hiện kỹ năng (shotUsed != true)
    // thì KHÔNG tính điều kiện thắng thua (để anh ta thực hiện trả thù xong mới tính)
    const hasDeadHunterPendingShot = Object.values(players).some(
      p => p.roleSlug === 'hunter' && !p.isAlive && !p.roleData?.shotUsed
    );
    if (hasDeadHunterPendingShot) {
      return null;
    }

    const alive = Object.entries(players).filter(([, p]) => p.isAlive);

    // THÊM: Điều kiện hòa khi không còn ai sống sót
    if (alive.length === 0) {
      return {
        winningTeam: 'draw',
        winnerRoleSlug: null,
        reason: '⚖️ Trận đấu kết thúc với kết quả Hòa! Không còn bất kỳ ai sống sót!',
      };
    }

    const aliveWolves = alive.filter(([, p]) => p.team === 'werewolf');
    const aliveVillagers = alive.filter(([, p]) => p.team === 'village');
    const aliveSolo = alive.filter(([, p]) => p.team === 'solo');

    // THÊM: Nếu còn lại đúng 1 thị trưởng (đã lật bài show role) và 1 sói, thị trưởng sẽ thắng (vì vote x2 sói bị treo cổ)
    const hasRevealedMayor = alive.some(([, p]) => p.roleSlug === 'mayor' && p.roleData?.revealed);
    if (alive.length === 2 && hasRevealedMayor && aliveWolves.length === 1) {
      return {
        winningTeam: 'village',
        winnerRoleSlug: null,
        reason: '🏘️ Phe Dân Làng thắng! Thị Trưởng đã lật bài và treo cổ con Sói cuối cùng bằng quyền lực tối cao!',
      };
    }

    // Sói thắng: số sói >= số còn lại (không tính solo killers)
    const aliveSoloKillers = aliveSolo.filter(([, p]) => ['serial_killer', 'arsonist'].includes(p.roleSlug));

    // THÊM: Cupid / Lovers win condition (nếu chỉ còn lại 2 người yêu nhau, hoặc 2 người yêu nhau + Cupid)
    let loversWin = false;
    let loversNames = [];
    for (const [pid, p] of Object.entries(players)) {
      if (p.roleSlug === 'cupid' && p.roleData?.lovers?.length === 2) {
        const [l1, l2] = p.roleData.lovers;
        const l1Alive = players[l1]?.isAlive;
        const l2Alive = players[l2]?.isAlive;
        if (l1Alive && l2Alive) {
          const aliveIds = alive.map(([id]) => id);
          const others = aliveIds.filter(id => id !== l1 && id !== l2 && id !== pid);
          if (others.length === 0) {
            loversWin = true;
            loversNames = [players[l1]?.username, players[l2]?.username];
            break;
          }
        }
      }
    }

    if (loversWin) {
      return {
        winningTeam: 'solo',
        winnerRoleSlug: 'cupid',
        reason: `💘 Tình yêu chiến thắng! Cặp đôi ${loversNames.join(' và ')} đã sống sót đến cuối cùng!`,
      };
    }

    if (aliveWolves.length >= aliveVillagers.length + aliveSolo.length && aliveWolves.length > 0 && aliveSoloKillers.length === 0) {
      return {
        winningTeam: 'werewolf',
        winnerRoleSlug: null,
        reason: '🐺 Phe Sói thắng! Sói đã chiếm đa số!',
      };
    }

    // Dân thắng: sói chết hết + solo killers chết hết
    if (aliveWolves.length === 0 && aliveSoloKillers.length === 0) {
      // Kiểm tra Cupid có thắng cùng dân làng không
      let cupidAlsoWins = false;
      let cupidUsername = null;
      for (const [pid, p] of Object.entries(players)) {
        if (p.roleSlug === 'cupid') {
          cupidAlsoWins = true;
          cupidUsername = p.username;
          break;
        }
      }

      return {
        winningTeam: 'village',
        winnerRoleSlug: null,
        cupidAlsoWins,
        reason: cupidAlsoWins
          ? `🏘️💘 Phe Dân Làng thắng! Cupid (${cupidUsername}) cũng giành chiến thắng cùng dân làng!`
          : '🏘️ Phe Dân Làng thắng! Tất cả mối đe dọa đã bị tiêu diệt!',
      };
    }

    // Serial Killer thắng: chỉ còn SK
    if (alive.length === 1 && alive[0][1].roleSlug === 'serial_killer') {
      return {
        winningTeam: 'solo',
        winnerRoleSlug: 'serial_killer',
        reason: `🔪 ${alive[0][1].username} (Sát Nhân Hàng Loạt) thắng! Là người sống sót cuối cùng!`,
      };
    }

    // Arsonist thắng: chỉ còn Arsonist
    if (alive.length === 1 && alive[0][1].roleSlug === 'arsonist') {
      return {
        winningTeam: 'solo',
        winnerRoleSlug: 'arsonist',
        reason: `🔥 ${alive[0][1].username} (Hỏa Tặc) thắng! Thiêu cháy tất cả!`,
      };
    }


    return null; // Chưa có ai thắng
  }

  // ============================================================
  // END GAME
  // ============================================================
  async triggerEndGame(winData, delayMs = 3000) {
    if (this.isEnding) return;
    this.isEnding = true;
    this.clearTimer();

    if (delayMs > 0) {
      setTimeout(async () => {
        await this.endGame(winData);
      }, delayMs);
    } else {
      await this.endGame(winData);
    }
  }

  async endGame(winData) {
    this.clearTimer();
    this.isRunning = false;

    await this.gameState.update({
      phase: 'ended',
      winningTeam: winData.winningTeam,
      winnerRoleSlug: winData.winnerRoleSlug,
    });

    // Lấy tất cả role để reveal
    const allPlayers = await this.gameState.getAllPlayers();
    const roleReveal = Object.entries(allPlayers).map(([id, p]) => ({
      userId: id,
      username: p.username,
      roleSlug: p.roleSlug,
      team: p.team,
      isAlive: p.isAlive,
      seatNumber: p.seatNumber,
    }));

    // Kiểm tra Headhunter co-win: HH thắng cùng Phe Sói khi:
    // 1. Phe Sói thắng (winningTeam === 'werewolf')
    // 2. Target của HH đã chết (bất kỳ lý do nào — ban đêm hay treo cổ)
    // Lưu ý: nếu target bị vote chết THÌ game sẽ kết thúc ngay trong endVotePhase (solo win),
    //         nên phần này chỉ chạy khi target chết ban đêm và sau đó sói thắng.
    let headhunterAlsoWins = false;
    let headhunterNames = [];
    if (winData.winningTeam === 'werewolf') {
      for (const [pid, p] of Object.entries(allPlayers)) {
        if (p.roleSlug === 'headhunter' && p.roleData?.target) {
          const target = allPlayers[p.roleData.target];
          if (target && !target.isAlive) {
            headhunterAlsoWins = true;
            headhunterNames.push(p.username);
          }
        }
      }
    }

    this.emitToGame('game:ended', {
      winningTeam: winData.winningTeam,
      winnerRoleSlug: winData.winnerRoleSlug,
      cupidAlsoWins: winData.cupidAlsoWins || false,
      headhunterAlsoWins,
      headhunterNames,
      reason: winData.reason,
      roleReveal,
    });

    // Lưu stats vào DB (không blocking game client)
    this.saveGameStats(allPlayers, winData, headhunterAlsoWins).catch(err =>
      console.error('⚠️ saveGameStats error (non-fatal):', err)
    );

    // Cleanup sau 30 giây
    this.cleanupTimeout = setTimeout(() => {
      if (activeGames.get(this.gameId) === this) {
        activeGames.delete(this.gameId);
        this.gameState.destroy();
      }
    }, 30000);
  }

  // ============================================================
  // XP LEVEL SYSTEM — Arithmetic progression
  // Level N→N+1 requires: 500 + (N-1)*200 XP
  // (Lv1→2: 500, Lv2→3: 700, Lv3→4: 900, Lv4→5: 1100, ...)
  // ============================================================
  static xpForLevel(level) {
    return 500 + (level - 1) * 200;
  }

  // Check and apply level-up after XP gain
  static async checkAndLevelUp(userId) {
    try {
      const user = await User.findByPk(userId, { attributes: ['id', 'xp', 'level', 'xp_next_level'] });
      if (!user) return;
      let { xp, level } = user;
      let didLevel = false;
      while (xp >= GameEngine.xpForLevel(level)) {
        xp -= GameEngine.xpForLevel(level);
        level += 1;
        didLevel = true;
      }
      if (didLevel) {
        await User.update(
          { level, xp, xp_next_level: GameEngine.xpForLevel(level) },
          { where: { id: userId } }
        );
        console.log(`🎉 Level up! user:${userId} → Lv.${level}`);
      }
    } catch (e) {
      console.error('⚠️ checkAndLevelUp error:', e.message);
    }
  }

  // ============================================================
  // SAVE GAME STATS TO DATABASE
  // ============================================================
  async saveGameStats(allPlayers, winData, headhunterAlsoWins) {
    const ELO_K = 32; // K-factor cho Elo

    // Kiểm tra có phải game đủ 12 người không (bot + human)
    // Chỉ tính stats cho game đủ 12 người theo đúng cấu hình
    const totalPlayerCount = Object.keys(allPlayers).length;
    const isFullGame = totalPlayerCount >= 12;

    for (const [playerId, p] of Object.entries(allPlayers)) {
      // Bỏ qua bot (userId bắt đầu bằng 'bot-')
      if (playerId.startsWith('bot-')) continue;

      // Xác định người chơi này có thắng không
      let isWinner = false;
      if (winData.winningTeam === p.team) isWinner = true;
      if (winData.winningTeam === 'solo' && winData.winnerRoleSlug === p.roleSlug) isWinner = true;
      if (headhunterAlsoWins && p.roleSlug === 'headhunter') isWinner = true;

      const survived = p.isAlive ? 1 : 0;
      const kills = p.roleData?.kills || 0;
      const saves = p.roleData?.saveCount || 0;
      const correctChecks = p.roleData?.correctChecks || 0;
      const votedOut = (!p.isAlive && p.deathCause === 'voted') ? 1 : 0;

      // Coins reward
      const coinsEarned = isWinner ? 100 : 30;

      try {
        if (isFullGame) {
          // Chỉ cập nhật stats đầy đủ với game đủ 12 người
          const [stats] = await UserStats.findOrCreate({
            where: { user_id: playerId },
            defaults: {
              user_id: playerId,
              total_games: 0, total_wins: 0, total_losses: 0,
              win_rate: 0.00, elo_rating: 1000, elo_peak: 1000,
            }
          });

          const newTotal = stats.total_games + 1;
          const newWins = isWinner ? stats.total_wins + 1 : stats.total_wins;
          const newLosses = !isWinner ? stats.total_losses + 1 : stats.total_losses;
          const newWinRate = newTotal > 0 ? ((newWins / newTotal) * 100).toFixed(2) : 0;

          // Elo update
          const currentElo = stats.elo_rating || 1000;
          const expected = 1 / (1 + Math.pow(10, (1000 - currentElo) / 400));
          const score = isWinner ? 1 : 0;
          const newElo = Math.max(800, Math.round(currentElo + ELO_K * (score - expected)));
          const newPeak = Math.max(stats.elo_peak || 1000, newElo);

          const teamField = p.team === 'village' ? 'villager' : p.team === 'werewolf' ? 'werewolf' : 'solo';

          await sequelize.transaction(async (t) => {
            await stats.update({
              total_games: newTotal,
              total_wins: newWins,
              total_losses: newLosses,
              win_rate: newWinRate,
              [`games_as_${teamField}`]: stats[`games_as_${teamField}`] + 1,
              [`wins_as_${teamField}`]: isWinner ? stats[`wins_as_${teamField}`] + 1 : stats[`wins_as_${teamField}`],
              total_kills: stats.total_kills + kills,
              total_saves: stats.total_saves + saves,
              total_correct_checks: stats.total_correct_checks + correctChecks,
              times_voted_out: stats.times_voted_out + votedOut,
              times_survived: stats.times_survived + survived,
              elo_rating: newElo,
              elo_peak: newPeak,
            }, { transaction: t });

            await User.update(
              {
                games_played: sequelize.literal('games_played + 1'),
                ...(isWinner ? { games_won: sequelize.literal('games_won + 1') } : {}),
                xp: sequelize.literal(`xp + ${isWinner ? 150 : 50}`),
                coins: sequelize.literal(`coins + ${coinsEarned}`),
              },
              { where: { id: playerId }, transaction: t }
            );
          });

          console.log(`📊 Stats saved (full game): ${p.username} | win=${isWinner} | elo=${newElo} | coins+${coinsEarned}`);
        } else {
          // Game không đủ 12 người — chỉ award coins, không đếm stats/elo/games_played
          await User.update(
            { coins: sequelize.literal(`coins + ${coinsEarned}`) },
            { where: { id: playerId } }
          );
          console.log(`📊 Partial game (${totalPlayerCount} players): ${p.username} | coins+${coinsEarned} (no stats counted)`);
        }

        // Cập nhật tiến trình nhiệm vụ hàng ngày
        // Nhiệm vụ chỉ tiến khi: (1) game đủ 12 người, (2) dùng cấu hình vai trò mặc định
        await this.updateQuestProgress(playerId, p, isWinner, survived, isFullGame);

        // Kiểm tra và thực hiện level up sau khi XP được cộng
        if (isFullGame) {
          await GameEngine.checkAndLevelUp(playerId);
        }
      } catch (err) {
        console.error(`⚠️ Stats update failed for ${p.username}:`, err.message);
      }
    }
  }

  // ============================================================
  // UPDATE DAILY QUEST PROGRESS
  // ============================================================
  async updateQuestProgress(playerId, playerData, isWinner, survived, isFullGame) {
    // Nhiệm vụ chỉ được tính khi:
    // 1. Game có đủ 12 người (isFullGame)
    // 2. Cấu hình vai trò mặc định (isDefaultConfig)
    if (!isFullGame || !this.isDefaultConfig) {
      if (!isFullGame) console.log(`⏭️ Quest skip (không đủ 12 người): ${playerData.username}`);
      if (!this.isDefaultConfig) console.log(`⏭️ Quest skip (tùy chỉnh vai): ${playerData.username}`);
      return;
    }

    // Use Vietnam UTC+7 date for consistent daily reset
    const vnOffset = 7 * 60;
    const vnTime = new Date(Date.now() + vnOffset * 60 * 1000);
    const today = vnTime.toISOString().slice(0, 10);

    const role = playerData.roleSlug;
    const team = playerData.team;

    // Map roleSlug → quest_id (covers all possible role quests from pool)
    const ROLE_TO_QUEST = {
      villager: 'play_as_villager',
      doctor: 'play_as_doctor',
      seer: 'play_as_seer',
      witch: 'play_as_witch',
      hunter: 'play_as_hunter',
      bodyguard: 'play_as_bodyguard',
      gunner: 'play_as_gunner',
      detective: 'play_as_detective',
      mayor: 'play_as_mayor',
      werewolf: 'play_as_wolf',
      alpha_wolf: 'play_as_alpha_wolf',
      wolf_seer: 'play_as_wolf', // wolf_seer counts as wolf quest
      jester: 'play_as_jester',
      headhunter: 'play_as_headhunter',
      serial_killer: 'play_as_serial_killer',
      arsonist: 'play_as_serial_killer', // fallback
    };

    const roleQuestId = ROLE_TO_QUEST[role] || null;

    // Base quest increments (always apply)
    const questIncrements = [
      { questId: 'play_1_game',    inc: 1,                                              max: 1 },
      { questId: 'play_3_games',   inc: 1,                                              max: 3 },
      { questId: 'win_1_game',     inc: isWinner ? 1 : 0,                              max: 1 },
      { questId: 'survive_1_game', inc: survived ? 1 : 0,                              max: 1 },
      { questId: 'win_as_village', inc: (team === 'village' && isWinner) ? 1 : 0,      max: 1 },
    ];

    // Add role-specific quest increment if applicable
    if (roleQuestId) {
      questIncrements.push({ questId: roleQuestId, inc: 1, max: 1 });
    }

    try {
      for (const { questId, inc, max } of questIncrements) {
        if (inc === 0) continue;

        // Only update rows that belong to today (auto lazy-reset: old days are untouched)
        const [row, created] = await UserDailyQuest.findOrCreate({
          where: { user_id: playerId, quest_date: today, quest_id: questId },
          defaults: { user_id: playerId, quest_date: today, quest_id: questId, progress: 0, claimed: false },
        });

        if (!created && !row.claimed) {
          const newProgress = Math.min(row.progress + inc, max);
          await row.update({ progress: newProgress });
        } else if (created) {
          await row.update({ progress: Math.min(inc, max) });
        }
      }
      console.log(`✅ Quest progress updated: ${playerData.username} (role: ${role}, today: ${today})`);
    } catch (err) {
      console.error(`⚠️ Quest progress update failed for ${playerData.username}:`, err.message);
    }
  }


  // ============================================================
  // PLAYER ACTIONS (nhận từ socket events)
  // ============================================================
  async handleNightAction(playerId, actionType, targetId) {
    const state = await this.gameState.get();
    if (state?.phase !== 'night') return { success: false, message: 'Không phải giai đoạn đêm' };

    const player = await this.gameState.getPlayer(playerId);
    if (!player?.isAlive) return { success: false, message: 'Bạn đã chết' };

    // Hóa Sói tiên tri thành Sói thường
    if (actionType === 'wolf_seer_transform') {
      if (player.roleSlug !== 'wolf_seer') {
        return { success: false, message: 'Bạn không phải Sói Tiên Tri' };
      }

      await this.gameState.updatePlayer(playerId, {
        roleSlug: 'werewolf',
      });

      const updatedPlayer = await this.gameState.getPlayer(playerId);
      const playerSocket = this.players.find(p => p.userId === playerId);
      if (playerSocket?.socket_id) {
        this.io.to(playerSocket.socket_id).emit('game:role_assigned', {
          gameId: this.gameId,
          role: {
            slug: 'werewolf',
            team: updatedPlayer.team,
            aura: updatedPlayer.aura,
            hasNightAction: updatedPlayer.hasNightAction,
            seatNumber: updatedPlayer.seatNumber,
          },
          roleData: updatedPlayer.roleData,
        });
      }

      await this.sendNightActionPromptToPlayer(playerId);
      await this.broadcastWolfVotes();

      return { success: true, message: 'Bạn đã từ bỏ vai trò Tiên Tri và trở thành Sói thường!' };
    }

    if (!player.hasNightAction) return { success: false, message: 'Vai trò của bạn không có hành động đêm' };

    // Xử tử của Cai Ngục (jailer_execute) lập tức giết mục tiêu
    if (actionType === 'jailer_execute') {
      const jailer = player;
      if (!jailer?.roleData?.canExecute) {
        return { success: false, message: 'Bạn không còn lượt xử tử.' };
      }
      const target = await this.gameState.getPlayer(targetId);
      if (!target || !target.isAlive) {
        return { success: false, message: 'Mục tiêu không hợp lệ hoặc đã chết.' };
      }

      // 1. Cập nhật lượt của Cai Ngục
      await this.gameState.updatePlayer(playerId, {
        roleData: { ...jailer.roleData, canExecute: false }
      });

      // 2. Cập nhật trạng thái của mục tiêu (chết ngay lập tức)
      await this.gameState.updatePlayer(targetId, {
        isAlive: false,
        deathRound: state.round,
        deathCause: 'jailer_execute'
      });

      // 3. Cập nhật danh sách sống/chết
      const updatedPlayers = await this.gameState.getAllPlayers();
      const alivePlayers = Object.keys(updatedPlayers).filter(id => updatedPlayers[id].isAlive);
      const deadPlayers = Object.keys(updatedPlayers).filter(id => !updatedPlayers[id].isAlive);
      await this.gameState.update({ alivePlayers, deadPlayers });

      // 4. Phát thông báo xử tử tức thì giống như bắn súng
      this.emitToGame('game:jailer_execute_result', {
        jailerId: playerId,
        jailerUsername: jailer.username,
        targetId,
        targetUsername: target.username,
        targetRole: target.roleSlug,
        message: `☠️ Cai Ngục ${jailer.username} đã xử tử ${target.username} (Giam Ngục) ngay lập tức!`,
      });

      // 5. Kiểm tra điều kiện thắng
      const winCheck = await this.checkWinCondition();
      if (winCheck) {
        await this.triggerEndGame(winCheck, 3000);
      }

      return { success: true, message: `Đã xử tử ${target.username} thành công.` };
    }

    // Phóng hỏa của Hỏa Tặc (arsonist_ignite) lập tức thiêu cháy tất cả doused
    if (actionType === 'arsonist_ignite') {
      const arsonist = player;
      const doused = arsonist.roleData?.doused || [];
      if (doused.length === 0) {
        return { success: false, message: 'Bạn chưa đổ dầu lên mục tiêu nào để phóng hỏa.' };
      }

      const ignitedTargets = [];
      const roleReveals = {};

      for (const dousedId of doused) {
        const target = await this.gameState.getPlayer(dousedId);
        if (target && target.isAlive) {
          ignitedTargets.push(target);
          roleReveals[dousedId] = target.roleSlug;

          await this.gameState.updatePlayer(dousedId, {
            isAlive: false,
            deathRound: state.round,
            deathCause: 'arson'
          });
        }
      }

      // Reset danh sách doused của Hỏa Tặc
      await this.gameState.updatePlayer(playerId, {
        roleData: { ...arsonist.roleData, doused: [], ignited: true }
      });

      // Cập nhật danh sách sống/chết
      const updatedPlayers = await this.gameState.getAllPlayers();
      const alivePlayers = Object.keys(updatedPlayers).filter(id => updatedPlayers[id].isAlive);
      const deadPlayers = Object.keys(updatedPlayers).filter(id => !updatedPlayers[id].isAlive);
      await this.gameState.update({ alivePlayers, deadPlayers });

      const targetIds = ignitedTargets.map(t => t.userId);
      const targetCount = ignitedTargets.length;

      // Phát thông tin phóng hỏa tức thì — KHÔNG hiển thị tên Hỏa Tặc và nạn nhân (ẩn danh)
      this.emitToGame('game:arsonist_ignite_result', {
        arsonistId: playerId,
        targetIds,
        roleReveals,
        message: targetCount > 0
          ? `🔥 Hỏa Tặc đã châm lửa! ${targetCount} người bị thiêu cháy!`
          : `🔥 Hỏa Tặc châm lửa đốt nhưng không ai bị thiêu cháy!`,
      });

      // Kiểm tra điều kiện thắng
      const winCheck = await this.checkWinCondition();
      if (winCheck) {
        await this.triggerEndGame(winCheck, 3000);
      }

      return { success: true, message: `Đã phóng hỏa châm ngòi thành công.` };
    }

    if (['seer_check', 'wolf_seer_check', 'detective_investigate'].includes(actionType)) {
      if (player.roleData?.checkedRound === state.round) {
        return { success: false, message: 'Bạn đã thực hiện kỹ năng trong đêm nay rồi' };
      }
    }

    await this.gameState.setNightAction(playerId, { actionType, targetId, playerId });

    // Nếu là wolf_kill → broadcast wolf vote update cho tất cả sói
    if (actionType === 'wolf_kill') {
      await this.broadcastWolfVotes();
    }

    // Kết quả ngay lập tức cho Tiên Tri / Sói Tiên Tri / Thám Tử
    if (['seer_check', 'wolf_seer_check'].includes(actionType)) {
      const target = await this.gameState.getPlayer(targetId);
      if (target) {
        const shownAura = target.roleSlug === 'alpha_wolf' && actionType === 'seer_check' ? 'good' : target.aura;
        const playerSocket = this.players.find(p => p.userId === playerId);
        if (playerSocket?.socket_id) {
          const emitData = {
            targetId: targetId,
            targetUsername: target.username,
            aura: shownAura,
          };
          if (actionType === 'seer_check') {
            emitData.roleSlug = target.roleSlug;
          }
          this.io.to(playerSocket.socket_id).emit('game:seer_result', emitData);
        }

        // Lưu lịch sử check vào roleData.checks của player
        const newChecks = [...(player.roleData?.checks || [])];
        if (!newChecks.some(c => c.round === state.round)) {
          newChecks.push({
            targetId: targetId,
            targetUsername: target.username,
            aura: shownAura,
            roleSlug: actionType === 'seer_check' ? target.roleSlug : undefined,
            round: state.round,
          });
        }

        await this.gameState.updatePlayer(playerId, { 
          roleData: { 
            ...player.roleData, 
            checkedRound: state.round,
            checks: newChecks
          } 
        });
      }
    } else if (actionType === 'detective_investigate') {
      let targetIds = [];
      if (Array.isArray(targetId)) {
        targetIds = targetId;
      } else if (typeof targetId === 'string') {
        targetIds = targetId.split(',').filter(Boolean);
      }
      
      if (targetIds.length === 2) {
        const t1 = await this.gameState.getPlayer(targetIds[0]);
        const t2 = await this.gameState.getPlayer(targetIds[1]);
        if (t1 && t2) {
          const sameTeam = t1.team === t2.team;
          const message = sameTeam 
            ? `🔍 ${t1.username} và ${t2.username} CÙNG một phe!`
            : `🔍 ${t1.username} và ${t2.username} KHÔNG cùng một phe!`;
            
          const playerSocket = this.players.find(p => p.userId === playerId);
          if (playerSocket?.socket_id) {
            this.io.to(playerSocket.socket_id).emit('game:seer_result', {
              targetId: targetIds.join(','),
              targetUsername: `${t1.username} & ${t2.username}`,
              aura: sameTeam ? 'good' : 'evil',
              message,
            });
          }

          // Lưu lịch sử check vào roleData.investigations của player
          const newInvestigations = [...(player.roleData?.investigations || [])];
          if (!newInvestigations.some(inv => inv.round === state.round)) {
            newInvestigations.push({
              targetId: targetIds.join(','),
              targetUsername: `${t1.username} & ${t2.username}`,
              aura: sameTeam ? 'good' : 'evil',
              message,
              round: state.round,
            });
          }

          await this.gameState.updatePlayer(playerId, { 
            roleData: { 
              ...player.roleData, 
              checkedRound: state.round,
              investigations: newInvestigations
            } 
          });
        }
      }
    }

    return { success: true, message: 'Đã cập nhật mục tiêu đêm' };
  }

  /**
   * Broadcast wolf kill votes cho tất cả sói (để sói thấy đồng đội vote ai)
   */
  async broadcastWolfVotes() {
    const actions = await this.gameState.getAllNightActions();
    const players = await this.gameState.getAllPlayers();

    // Thu thập tất cả wolf_kill votes
    const wolfVotes = {}; // wolfPlayerId -> targetId
    const wolfVoteCounts = {}; // targetId -> count
    for (const [pid, action] of Object.entries(actions)) {
      if (action.actionType === 'wolf_kill' && action.targetId) {
        wolfVotes[pid] = action.targetId;
        wolfVoteCounts[action.targetId] = (wolfVoteCounts[action.targetId] || 0) + 1;
      }
    }

    // Gửi cho tất cả sói trong room
    this.io.to(`game:${this.gameId}:wolf`).emit('game:wolf_vote_update', {
      wolfVotes,       // ai vote ai
      wolfVoteCounts,  // target -> số phiếu
      totalWolfAlive: Object.entries(players).filter(([, p]) => p.team === 'werewolf' && p.isAlive).length,
    });
  }

  async handleVote(voterId, targetId) {
    const state = await this.gameState.get();
    if (state?.phase !== 'vote') return { success: false, message: 'Không phải giai đoạn bỏ phiếu' };

    const voter = await this.gameState.getPlayer(voterId);
    if (!voter?.isAlive) return { success: false, message: 'Bạn đã chết' };

    // Kiểm tra xem đây có phải thay đổi phiếu không
    const previousVote = await this.gameState.getVote(voterId);

    // Nếu click vào chính người đang vote -> Bỏ vote (phiếu trắng)
    if (previousVote === targetId) {
      await this.gameState.setVote(voterId, null);
      const allVotes = await this.gameState.getAllVotes();
      this.emitToGame('game:vote_update', {
        votes: allVotes,
        totalVotes: Object.keys(allVotes).length,
      });
      return { success: true, message: 'Đã hủy bỏ phiếu' };
    }

    const isChange = !!previousVote && previousVote !== targetId;

    await this.gameState.setVote(voterId, targetId);

    // Broadcast full vote map (ai vote ai) - minh bạch như Wolvesville gốc
    const allVotes = await this.gameState.getAllVotes();
    this.emitToGame('game:vote_update', {
      votes: allVotes,
      totalVotes: Object.keys(allVotes).length,
    });

    return { success: true, message: isChange ? 'Đã thay đổi phiếu' : 'Đã bỏ phiếu' };
  }

  async handleHunterShotAction(hunterId, targetId) {
    const state = await this.gameState.get();
    if (state?.hunterPending !== hunterId) return { success: false };
    
    await this.gameState.update({ hunterTarget: targetId });
    
    const playerSocket = this.players.find(p => p.userId === hunterId);
    if (playerSocket?.socket_id) {
      this.io.to(playerSocket.socket_id).emit('game:hunter_shot_confirmed', { targetId });
    }
    return { success: true };
  }

  async handleMayorReveal(mayorId) {
    const state = await this.gameState.get();
    if (state?.phase !== 'discuss' && state?.phase !== 'vote') return { success: false };
    
    const mayor = await this.gameState.getPlayer(mayorId);
    if (!mayor || !mayor.isAlive || mayor.roleSlug !== 'mayor') return { success: false };
    if (mayor.roleData?.revealed) return { success: false };

    await this.gameState.updatePlayer(mayorId, {
      roleData: { ...mayor.roleData, revealed: true }
    });

    this.emitToGame('game:mayor_revealed', {
      mayorId
    });

    this.emitToGame('game:phase_change', {
      phase: state.phase,
      round: state.round,
      events: [{ type: 'mayor_reveal', message: `👑 QUAN TRỌNG: ${mayor.username} đã tiết lộ mình là Thị Trưởng! Phiếu bầu của họ bây giờ tính là 2 phiếu!` }]
    });

    return { success: true };
  }

  async handleJailerJail(jailerId, targetId) {
    const state = await this.gameState.get();
    if (state?.phase !== 'discuss' && state?.phase !== 'vote') {
      return { success: false, message: 'Chỉ có thể chọn giam vào ban ngày' };
    }
    
    const jailer = await this.gameState.getPlayer(jailerId);
    if (!jailer || !jailer.isAlive || jailer.roleSlug !== 'jailer') {
      return { success: false, message: 'Bạn không phải Cai Ngục hoặc đã chết' };
    }

    const target = await this.gameState.getPlayer(targetId);
    if (!target || !target.isAlive || targetId?.toString() === jailerId?.toString()) {
      return { success: false, message: 'Mục tiêu không hợp lệ' };
    }

    if (jailer.roleData?.lastJailed?.toString() === targetId?.toString()) {
      return { success: false, message: 'Không thể giam cùng một người hai đêm liên tiếp' };
    }

    await this.gameState.updatePlayer(jailerId, {
      roleData: { ...jailer.roleData, nextJailed: targetId }
    });

    const playerSocket = this.players.find(p => p.userId?.toString() === jailerId?.toString());
    if (playerSocket?.socket_id) {
      this.io.to(playerSocket.socket_id).emit('game:jailer_target', {
        targetId,
        targetUsername: target.username,
        message: `⛓️ Bạn đã chọn giam giữ ${target.username} đêm nay.`,
      });
    }

    return { success: true };
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  emitToGame(event, data) {
    this.io.to(`game:${this.gameId}`).emit(event, data);
  }

  setTimer(seconds, callback) {
    this.clearTimer();
    // Emit timer để client đếm ngược
    this.emitToGame('game:timer', {
      duration: seconds,
      endAt: Date.now() + seconds * 1000,
    });
    this.timer = setTimeout(callback, seconds * 1000);
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // ============================================================
  // BOT AI — Auto-play for bot players
  // ============================================================
  
  /**
   * Check if a player is a bot (virtual, no real socket)
   */
  isBot(player) {
    return player.userId?.startsWith('bot_') || player.isBot;
  }

  /**
   * Schedule bot night actions with realistic delays
   */
  async scheduleBotNightActions() {
    const players = await this.gameState.getAllPlayers();
    const state = await this.gameState.get();

    for (const [playerId, data] of Object.entries(players)) {
      if (!data.isAlive || !data.hasNightAction) continue;
      if (!this.isBot({ userId: playerId })) continue; // Only bots

      const delay = 3000 + Math.random() * 10000; // 3-13s (spread across 30s night phase)
      setTimeout(async () => {
        try {
          if (!this.isRunning) return;
          const currentState = await this.gameState.get();
          if (currentState?.phase !== 'night') return;

          const currentPlayers = await this.gameState.getAllPlayers();
          const botPlayer = currentPlayers[playerId];
          if (!botPlayer?.isAlive) return;

          const action = decideNightAction({
            ...botPlayer,
            userId: playerId,
          }, currentPlayers, currentState);

          if (action) {
            await this.handleNightAction(playerId, action.actionType, action.targetId);
            const targetName = currentPlayers[action.targetId]?.username || 'unknown';
            console.log(`🤖 Bot ${botPlayer.username}: ${action.actionType} → ${targetName}`);
          }
        } catch (err) {
          console.error(`Bot night action error for ${playerId}:`, err.message);
        }
      }, delay);
    }
  }

  /**
   * Schedule bot votes with realistic delays
   */
  async scheduleBotVotes() {
    const players = await this.gameState.getAllPlayers();

    for (const [playerId, data] of Object.entries(players)) {
      if (!data.isAlive) continue;
      if (!this.isBot({ userId: playerId })) continue;

      const delay = 3000 + Math.random() * 15000; // 3-18s (spread across 30s vote phase)
      setTimeout(async () => {
        try {
          if (!this.isRunning) return;
          const currentState = await this.gameState.get();
          if (currentState?.phase !== 'vote') return;

          const currentPlayers = await this.gameState.getAllPlayers();
          const botPlayer = currentPlayers[playerId];
          if (!botPlayer?.isAlive) return;

          const targetId = decideVote({
            ...botPlayer,
            userId: playerId,
          }, currentPlayers);

          if (targetId && targetId !== 'skip') {
            await this.gameState.setVote(playerId, targetId);
            // Broadcast vote update cho mỗi bot vote
            const allVotes = await this.gameState.getAllVotes();
            this.emitToGame('game:vote_update', {
              votes: allVotes,
              totalVotes: Object.keys(allVotes).length,
            });
            const targetName = currentPlayers[targetId]?.username || 'skip';
            console.log(`🤖 Bot ${botPlayer.username}: vote → ${targetName}`);
          }
        } catch (err) {
          console.error(`Bot vote error for ${playerId}:`, err.message);
        }
      }, delay);
    }
  }

  /**
   * Handle bot hunter shot
   */
  async handleBotHunterShot(hunterId) {
    const players = await this.gameState.getAllPlayers();
    const hunter = players[hunterId];
    if (!hunter || !this.isBot({ userId: hunterId })) return false;

    const targetId = decideHunterShot(
      { ...hunter, userId: hunterId },
      players
    );

    if (targetId) {
      setTimeout(async () => {
        await this.executeHunterShot(hunterId, targetId);
        const targetName = players[targetId]?.username || 'unknown';
        console.log(`🤖 Bot ${hunter.username}: hunter shot → ${targetName}`);
      }, 1000 + Math.random() * 2000);
      return true;
    }
    return false;
  }
}

// ============================================================
// STATIC METHODS (để socket handler truy cập)
// ============================================================

function getActiveGame(gameId) {
  return activeGames.get(gameId);
}

function getAllActiveGames() {
  return activeGames;
}

module.exports = { GameEngine, getActiveGame, getAllActiveGames };
