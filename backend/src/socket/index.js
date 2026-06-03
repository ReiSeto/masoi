const { Server } = require('socket.io');
const { authenticateSocket } = require('../middleware/auth');
const lobbyHandler = require('./lobbyHandler');
const chatHandler = require('./chatHandler');
const gameHandler = require('./gameHandler');
const { User } = require('../models');
const { getRedis, KEYS, TTL } = require('../config/redis');

let io;

function initSocket(server) {
  const allowedOrigins = [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        callback(null, true); // Allow all for now
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // ============================================================
  // AUTH MIDDLEWARE
  // ============================================================
  io.use(authenticateSocket);

  // ============================================================
  // CONNECTION HANDLER
  // ============================================================
  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    console.log(`🔌 Socket connected: ${username} (${socket.id})`);

    // Lưu socket_id vào Redis session
    try {
      const redis = getRedis();
      await redis.hset(KEYS.userSession(userId), {
        socket_id: socket.id,
        status: 'online',
        game_id: '',
        last_seen: Date.now(),
      });
      await redis.expire(KEYS.userSession(userId), TTL.userSession);
    } catch (err) {
      console.error('Redis session save error:', err.message);
    }

    // Gửi xác nhận connected
    socket.emit('connected', {
      message: `Chào mừng ${username}! 🐺`,
      socket_id: socket.id,
    });

    // ============================================================
    // REGISTER EVENT HANDLERS
    // ============================================================
    lobbyHandler(io, socket);
    chatHandler(io, socket);
    gameHandler(io, socket);

    // ============================================================
    // DISCONNECT
    // ============================================================
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 Socket disconnected: ${username} — Lý do: ${reason}`);

      try {
        const redis = getRedis();
        await redis.hset(KEYS.userSession(userId), {
          status: 'offline',
          last_seen: Date.now(),
        });
      } catch (err) {
        console.error('Redis disconnect update error:', err.message);
      }
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO chưa được khởi tạo');
  return io;
}

module.exports = { initSocket, getIO };
