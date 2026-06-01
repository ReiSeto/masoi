const Redis = require('ioredis');

let client = null;

async function initRedis() {
  client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || 'redis123',
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  client.on('connect', () => {
    console.log('🔴 Redis connected');
  });

  client.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  // Test connection
  await client.ping();
  return client;
}

function getRedis() {
  if (!client) {
    throw new Error('Redis chưa được khởi tạo');
  }
  return client;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Game State Keys
const KEYS = {
  gameState: (gameId) => `game:${gameId}:state`,
  gamePlayers: (gameId) => `game:${gameId}:players`,
  gameVotes: (gameId) => `game:${gameId}:votes`,
  gameNightActions: (gameId) => `game:${gameId}:night_actions`,
  gameChat: (gameId, channel) => `game:${gameId}:chat:${channel}`,
  gameTimer: (gameId) => `game:${gameId}:timer`,
  lobby: (gameId) => `lobby:${gameId}`,
  userSession: (userId) => `session:${userId}`,
  quickQueue: () => 'queue:quick',
  rankedQueue: () => 'queue:ranked',
  rateLimit: (userId, action) => `ratelimit:${userId}:${action}`,
  blacklistToken: (token) => `blacklist:${token}`,
};

const TTL = {
  gameState: 4 * 60 * 60,      // 4 giờ
  userSession: 24 * 60 * 60,   // 24 giờ
  queueEntry: 10 * 60,         // 10 phút
  blacklistToken: 7 * 24 * 60 * 60, // 7 ngày
};

module.exports = { initRedis, getRedis, KEYS, TTL };
