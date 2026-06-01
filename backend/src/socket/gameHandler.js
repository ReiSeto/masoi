/**
 * gameHandler — Socket events cho game (night actions, vote, hunter shot)
 */
const { getActiveGame } = require('../game/GameEngine');

module.exports = function gameHandler(io, socket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  // ============================================================
  // NIGHT ACTION (seer_check, doctor_save, wolf_kill, etc.)
  // ============================================================
  socket.on('game:night_action', async ({ action_type, target_id }) => {
    const gameId = socket.data.gameId;
    if (!gameId) return socket.emit('error', { message: 'Bạn không trong ván đấu' });

    const game = getActiveGame(gameId);
    if (!game) return socket.emit('error', { message: 'Ván đấu không tồn tại' });

    const result = await game.handleNightAction(userId, action_type, target_id);
    
    if (result.success) {
      socket.emit('game:action_confirmed', {
        action_type,
        target_id,
        message: result.message,
      });
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // ============================================================
  // VOTE (cho phép thay đổi phiếu - minh bạch như Wolvesville gốc)
  // ============================================================
  socket.on('game:vote', async ({ target_id }) => {
    const gameId = socket.data.gameId;
    if (!gameId) return socket.emit('error', { message: 'Bạn không trong ván đấu' });

    const game = getActiveGame(gameId);
    if (!game) return socket.emit('error', { message: 'Ván đấu không tồn tại' });

    const result = await game.handleVote(userId, target_id);
    
    if (result.success) {
      socket.emit('game:vote_confirmed', {
        target_id,
        message: result.message,
      });
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // ============================================================
  // HUNTER SHOT
  // ============================================================
  socket.on('game:hunter_shot', async ({ target_id }) => {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    const game = getActiveGame(gameId);
    if (!game) return;

    await game.handleHunterShotAction(userId, target_id);
  });

  // ============================================================
  // GUNNER SHOT (day phase)
  // ============================================================
  socket.on('game:gunner_shot', async ({ target_id }) => {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    const game = getActiveGame(gameId);
    if (!game) return;

    const result = await game.handleGunnerShot(userId, target_id);
    if (result.success) {
      socket.emit('game:action_confirmed', { action_type: 'gunner_shot', target_id });
    } else {
      socket.emit('error', { message: result.message || 'Không thể bắn' });
    }
  });

  // ============================================================
  // MAYOR REVEAL (lật bài Thị Trưởng)
  // ============================================================
  socket.on('game:mayor_reveal', async () => {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    const game = getActiveGame(gameId);
    if (!game) return;

    await game.handleMayorReveal(userId);
  });

  // ============================================================
  // JAILER JAIL (chọn giam ban ngày)
  // ============================================================
  socket.on('game:jailer_jail', async ({ target_id }) => {
    const gameId = socket.data.gameId;
    if (!gameId) return;

    const game = getActiveGame(gameId);
    if (!game) return;

    const result = await game.handleJailerJail(userId, target_id);
    if (result.success) {
      socket.emit('game:action_confirmed', { action_type: 'jailer_jail', target_id });
    } else {
      socket.emit('error', { message: result.message || 'Không thể giam' });
    }
  });

  // ============================================================
  // REQUEST GAME STATE (reconnect)
  // ============================================================
  socket.on('game:request_state', async (payload) => {
    const reqGameId = payload?.gameId;
    const gameId = socket.data.gameId || reqGameId;
    if (!gameId) return;

    // Restore socket state if reconnected/refreshed
    if (gameId) {
      socket.data.gameId = gameId;
      socket.join(`game:${gameId}`);
    }

    const game = getActiveGame(gameId);
    if (!game) return;

    const state = await game.gameState.get();
    const player = await game.gameState.getPlayer(userId);
    const allPlayers = await game.gameState.getAllPlayers();

    if (!state || !player) return;

    // Gửi state hiện tại cho client reconnect
    const publicPlayers = Object.entries(allPlayers).map(([id, p]) => ({
      userId: id,
      username: p.username,
      seatNumber: p.seatNumber,
      isAlive: p.isAlive,
      roleSlug: (!p.isAlive || (p.roleSlug === 'mayor' && p.roleData?.revealed)) ? p.roleSlug : null,
    }));

    const roleList = Object.values(allPlayers).map(p => p.roleSlug);

    socket.emit('game:state_sync', {
      gameId,
      phase: state.phase,
      round: state.round,
      players: publicPlayers,
      role: {
        slug: player.roleSlug,
        team: player.team,
        aura: player.aura,
        hasNightAction: player.hasNightAction,
        seatNumber: player.seatNumber,
      },
      roleData: player.roleData,
      isAlive: player.isAlive,
      roleList: roleList,
    });

    // Nếu là sói → gửi lại danh sách đồng đội sói & join wolf room
    if (player.team === 'werewolf') {
      const wolves = Object.entries(allPlayers)
        .filter(([, p]) => p.team === 'werewolf')
        .map(([id, p]) => ({
          userId: id,
          username: p.username,
          seatNumber: p.seatNumber,
        }));

      socket.emit('game:wolf_team', {
        wolves: wolves.filter(w => w.userId !== userId),
      });

      // Rejoin wolf chat room
      socket.join(`game:${gameId}:wolf`);
    }

    // Khôi phục night action prompt nếu đang ở phase đêm
    if (state.phase === 'night') {
      await game.sendNightActionPromptToPlayer(userId, socket.id);
      if (player.team === 'werewolf') {
        await game.broadcastWolfVotes();
      }

      // Khôi phục trạng thái giam giữ nếu đang ở phase đêm
      let jailedPlayerId = null;
      let jailerId = null;
      for (const [pid, p] of Object.entries(allPlayers)) {
        if (p.roleSlug === 'jailer' && p.isAlive) {
          jailerId = pid;
          jailedPlayerId = p.roleData?.nextJailed || null;
          break;
        }
      }

      if (jailedPlayerId) {
        if (userId?.toString() === jailedPlayerId?.toString()) {
          socket.emit('game:you_are_jailed', {
            jailed: true,
            message: '⛓️ Bạn đã bị Cai Ngục giam giữ đêm nay! Mọi hành động đêm của bạn đã bị khóa và bạn có thể trò chuyện với Cai Ngục.',
          });
        } else if (userId?.toString() === jailerId?.toString()) {
          socket.emit('game:you_are_jailed', {
            jailed: false,
            jailedUserId: jailedPlayerId,
            jailedUsername: allPlayers[jailedPlayerId]?.username,
            message: `⛓️ Bạn đang giam giữ ${allPlayers[jailedPlayerId]?.username || 'mục tiêu'}. Kênh chat giam ngục đã mở.`,
          });
        }
      }
    }

    // Khôi phục hunter shot prompt nếu đang trả thù
    if (state.hunterPending === userId) {
      const alivePlayers = await game.gameState.getAlivePlayers();
      const targets = Object.entries(alivePlayers).map(([id, p]) => ({
        userId: id,
        username: p.username,
        seatNumber: p.seatNumber,
      }));
      socket.emit('game:hunter_shot_prompt', {
        targets,
        duration: 30,
        message: '🏹 Bạn là Thợ Săn! Chọn người để bắn (có thể thay đổi trong 30s)!',
      });
    }
  });
};
