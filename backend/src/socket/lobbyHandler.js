const { Game, GamePlayer, Role, User } = require('../models');
const { getRedis, KEYS, TTL } = require('../config/redis');
const { GameEngine } = require('../game/GameEngine');
const { generateBotId, generateBotName } = require('../game/BotBrain');

/**
 * Lobby Socket Handler — Xử lý phòng chờ game
 */
function lobbyHandler(io, socket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  // CLIENT → SERVER: Tạo/Vào phòng
  socket.on('lobby:join', async ({ room_code }) => {
    console.log(`🔍 DEBUG lobby:join called by ${username} (${userId}) for room: ${room_code}`);
    try {
      const redis = getRedis();
      const game = await Game.findOne({
        where: { room_code: room_code?.toUpperCase(), status: 'waiting' },
        include: [{ model: GamePlayer, as: 'players' }],
      });

      if (!game) {
        return socket.emit('error', { message: 'Phòng không tồn tại hoặc đã bắt đầu', code: 'GAME_001' });
      }

      if (game.players.length >= game.max_players) {
        return socket.emit('error', { message: 'Phòng đã đầy', code: 'GAME_002' });
      }

      // Vào Socket.IO room
      socket.join(`game:${game.id}`);
      socket.data.gameId = game.id;

      // Cập nhật Redis lobby
      const lobbyKey = KEYS.lobby(game.id);
      const lobbyData = await redis.get(lobbyKey);
      const lobby = lobbyData ? JSON.parse(lobbyData) : { players: [], host_id: game.host_user_id };

      if (!lobby.players.find((p) => p.userId === userId)) {
        lobby.players.push({ userId, username, socket_id: socket.id });
      }
      await redis.set(lobbyKey, JSON.stringify(lobby), 'EX', TTL.gameState);

      // Thông báo cho phòng
      io.to(`game:${game.id}`).emit('lobby:updated', {
        game_id: game.id,
        room_code: game.room_code,
        players: lobby.players,
        host_id: lobby.host_id,
        max_players: game.max_players,
      });

      socket.emit('lobby:joined', {
        success: true,
        game_id: game.id,
        room_code: game.room_code,
        message: `Đã vào phòng ${game.room_code}`,
      });

      io.to(`game:${game.id}`).emit('lobby:player_joined', {
        player: { userId, username },
      });

    } catch (err) {
      console.error('lobby:join error:', err);
      socket.emit('error', { message: 'Lỗi khi vào phòng' });
    }
  });

  // CLIENT → SERVER: Thêm bot vào phòng
  socket.on('lobby:add_bot', async () => {
    try {
      const gameId = socket.data.gameId;
      if (!gameId) return socket.emit('error', { message: 'Bạn chưa ở trong phòng nào' });

      const redis = getRedis();
      const lobbyData = await redis.get(KEYS.lobby(gameId));
      const lobby = lobbyData ? JSON.parse(lobbyData) : null;
      if (!lobby) return socket.emit('error', { message: 'Phòng không tồn tại' });
      if (lobby.host_id !== userId) return socket.emit('error', { message: 'Chỉ host mới thêm bot' });
      if (lobby.players.length >= 12) return socket.emit('error', { message: 'Phòng đã đầy (12/12)' });

      // Generate bot identity
      const botId = generateBotId();
      const botName = generateBotName();

      lobby.players.push({ userId: botId, username: botName, isBot: true });
      await redis.set(KEYS.lobby(gameId), JSON.stringify(lobby), 'EX', TTL.gameState);

      io.to(`game:${gameId}`).emit('lobby:updated', {
        game_id: gameId,
        players: lobby.players,
        host_id: lobby.host_id,
      });

      io.to(`game:${gameId}`).emit('lobby:player_joined', {
        player: { userId: botId, username: botName, isBot: true },
      });

      console.log(`🤖 Bot ${botName} added to room ${gameId}`);
      socket.emit('lobby:bot_added', { botId, botName, playerCount: lobby.players.length });

    } catch (err) {
      console.error('lobby:add_bot error:', err);
      socket.emit('error', { message: 'Lỗi khi thêm bot' });
    }
  });

  // CLIENT → SERVER: Xóa bot khỏi phòng
  socket.on('lobby:remove_bot', async ({ botId }) => {
    try {
      const gameId = socket.data.gameId;
      if (!gameId) return;

      const redis = getRedis();
      const lobbyData = await redis.get(KEYS.lobby(gameId));
      const lobby = lobbyData ? JSON.parse(lobbyData) : null;
      if (!lobby) return;
      if (lobby.host_id !== userId) return socket.emit('error', { message: 'Chỉ host mới xóa bot' });

      const botPlayer = lobby.players.find(p => p.userId === botId && p.isBot);
      if (!botPlayer) return socket.emit('error', { message: 'Bot không tồn tại' });

      lobby.players = lobby.players.filter(p => p.userId !== botId);
      await redis.set(KEYS.lobby(gameId), JSON.stringify(lobby), 'EX', TTL.gameState);

      io.to(`game:${gameId}`).emit('lobby:updated', {
        game_id: gameId,
        players: lobby.players,
        host_id: lobby.host_id,
      });

      console.log(`🤖 Bot ${botPlayer.username} removed from room ${gameId}`);

    } catch (err) {
      console.error('lobby:remove_bot error:', err);
    }
  });

  // CLIENT → SERVER: Rời phòng
  socket.on('lobby:leave', async () => {
    await handleLeaveLobby(io, socket, userId, username);
  });

  // CLIENT → SERVER: Host bắt đầu game
  socket.on('lobby:start', async (data) => {
    try {
      const gameId = socket.data.gameId;
      if (!gameId) return socket.emit('error', { message: 'Bạn chưa ở trong phòng nào' });

      const customRoleConfig = data?.roleConfig;

      const redis = getRedis();
      const lobbyData = await redis.get(KEYS.lobby(gameId));
      const lobby = lobbyData ? JSON.parse(lobbyData) : null;

      if (!lobby) return socket.emit('error', { message: 'Phòng không tồn tại' });
      if (lobby.host_id !== userId) return socket.emit('error', { message: 'Chỉ host mới có thể bắt đầu' });
      if (lobby.players.length < 4) return socket.emit('error', { message: 'Cần ít nhất 4 người để bắt đầu', code: 'GAME_003' });

      // Countdown
      io.to(`game:${gameId}`).emit('lobby:countdown', { seconds: 3 });

      setTimeout(async () => {
        try {
          // Cập nhật DB
          await Game.update({ status: 'in_progress', started_at: new Date() }, { where: { id: gameId } });
          
          // Lấy role_config từ DB hoặc custom
          const game = await Game.findByPk(gameId);
          let roleConfig = {};

          if (customRoleConfig && Object.keys(customRoleConfig).length > 0) {
            roleConfig = customRoleConfig;
            await Game.update({ role_config: customRoleConfig }, { where: { id: gameId } });
          } else {
            await Game.update({ role_config: {} }, { where: { id: gameId } });
          }

          // Tạo GameEngine và bắt đầu
          const engine = new GameEngine(io, gameId, lobby.players, roleConfig);
          await engine.start();

          console.log(`🎮 Game Engine khởi động: ${gameId}`);
        } catch (err) {
          console.error('GameEngine start error:', err);
          io.to(`game:${gameId}`).emit('error', { message: 'Lỗi khi khởi tạo game engine' });
        }
      }, 3000);

    } catch (err) {
      console.error('lobby:start error:', err);
      socket.emit('error', { message: 'Lỗi khi bắt đầu game' });
    }
  });

  // Xử lý khi socket disconnect
  socket.on('disconnect', async () => {
    await handleLeaveLobby(io, socket, userId, username);
  });
}

async function handleLeaveLobby(io, socket, userId, username) {
  const gameId = socket.data.gameId;
  if (!gameId) return;

  try {
    const redis = getRedis();
    const lobbyData = await redis.get(KEYS.lobby(gameId));
    if (!lobbyData) return;

    const lobby = JSON.parse(lobbyData);
    lobby.players = lobby.players.filter((p) => p.userId !== userId);
    await redis.set(KEYS.lobby(gameId), JSON.stringify(lobby), 'EX', TTL.gameState);

    socket.leave(`game:${gameId}`);
    socket.data.gameId = null;

    io.to(`game:${gameId}`).emit('lobby:player_left', { player_id: userId });
    io.to(`game:${gameId}`).emit('lobby:updated', {
      game_id: gameId,
      players: lobby.players,
      host_id: lobby.host_id,
    });

    const engine = GameEngine.getActiveGame(gameId);
    if (engine && engine.isRunning) {
      const humans = engine.players.filter(p => !engine.isBot(p));
      if (humans.length > 1) {
        const user = await User.findByPk(userId);
        if (user) {
          const newRep = Math.max(0, (user.reputation !== undefined ? user.reputation : 100) - 10); // Deduct 10 points
          await user.update({ reputation: newRep });
        }
      }
      engine.handlePlayerLeave(userId);
    }
  } catch (err) {
    console.error('handleLeaveLobby error:', err);
  }
}

module.exports = lobbyHandler;
