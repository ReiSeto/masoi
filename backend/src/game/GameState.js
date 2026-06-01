/**
 * GameState — Quản lý state game trong Redis
 * Mỗi ván game có: state, players, votes, night_actions
 */
const { getRedis, KEYS, TTL } = require('../config/redis');

class GameState {
  constructor(gameId) {
    this.gameId = gameId;
    this.redis = getRedis();
  }

  // ============================================================
  // GAME STATE (JSON object lưu phase, round, timer...)
  // ============================================================

  async init(data) {
    const state = {
      gameId: this.gameId,
      phase: 'night',        // night | dawn | day | discuss | vote
      round: 1,
      timerEnd: null,
      alivePlayers: data.playerIds || [],
      deadPlayers: [],
      winningTeam: null,
      winnerRoleSlug: null,
      nightKillTarget: null,
      lastSaved: null,       // id của người Doctor cứu lần trước
      witchHealUsed: false,
      witchPoisonUsed: false,
      witchPoisonTarget: null,
      hunterPending: null,   // hunter cần chọn bắn ai
      jesterWin: false,
      ...data,
    };
    await this.redis.set(
      KEYS.gameState(this.gameId),
      JSON.stringify(state),
      'EX', TTL.gameState
    );
    return state;
  }

  async get() {
    const raw = await this.redis.get(KEYS.gameState(this.gameId));
    return raw ? JSON.parse(raw) : null;
  }

  async update(partial) {
    const state = await this.get();
    if (!state) return null;
    const updated = { ...state, ...partial };
    await this.redis.set(
      KEYS.gameState(this.gameId),
      JSON.stringify(updated),
      'EX', TTL.gameState
    );
    return updated;
  }

  // ============================================================
  // PLAYERS (Hash: playerId -> JSON {role, team, aura, isAlive, seatNumber...})
  // ============================================================

  async setPlayers(playersMap) {
    const key = KEYS.gamePlayers(this.gameId);
    const pipeline = this.redis.pipeline();
    for (const [playerId, data] of Object.entries(playersMap)) {
      pipeline.hset(key, playerId, JSON.stringify(data));
    }
    pipeline.expire(key, TTL.gameState);
    await pipeline.exec();
  }

  async getPlayer(playerId) {
    const raw = await this.redis.hget(KEYS.gamePlayers(this.gameId), playerId);
    return raw ? JSON.parse(raw) : null;
  }

  async getAllPlayers() {
    const raw = await this.redis.hgetall(KEYS.gamePlayers(this.gameId));
    const result = {};
    for (const [id, data] of Object.entries(raw)) {
      result[id] = JSON.parse(data);
    }
    return result;
  }

  async updatePlayer(playerId, partial) {
    const player = await this.getPlayer(playerId);
    if (!player) return null;
    const updated = { ...player, ...partial };
    await this.redis.hset(
      KEYS.gamePlayers(this.gameId), playerId, JSON.stringify(updated)
    );
    return updated;
  }

  // ============================================================
  // NIGHT ACTIONS (Hash: playerId -> JSON {actionType, targetId, ...})
  // ============================================================

  async setNightAction(playerId, action) {
    await this.redis.hset(
      KEYS.gameNightActions(this.gameId),
      playerId,
      JSON.stringify(action)
    );
  }

  async getNightAction(playerId) {
    const raw = await this.redis.hget(KEYS.gameNightActions(this.gameId), playerId);
    return raw ? JSON.parse(raw) : null;
  }

  async getAllNightActions() {
    const raw = await this.redis.hgetall(KEYS.gameNightActions(this.gameId));
    const result = {};
    for (const [id, data] of Object.entries(raw)) {
      result[id] = JSON.parse(data);
    }
    return result;
  }

  async clearNightActions() {
    await this.redis.del(KEYS.gameNightActions(this.gameId));
  }

  // ============================================================
  // VOTES (Hash: voterId -> targetId)
  // ============================================================

  async setVote(voterId, targetId) {
    if (!targetId || targetId === 'none') {
      await this.redis.hdel(KEYS.gameVotes(this.gameId), voterId);
    } else {
      await this.redis.hset(KEYS.gameVotes(this.gameId), voterId, targetId);
    }
  }

  async getVote(voterId) {
    return await this.redis.hget(KEYS.gameVotes(this.gameId), voterId);
  }

  async getAllVotes() {
    return await this.redis.hgetall(KEYS.gameVotes(this.gameId));
  }

  async clearVotes() {
    await this.redis.del(KEYS.gameVotes(this.gameId));
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  async getAlivePlayers() {
    const players = await this.getAllPlayers();
    return Object.entries(players)
      .filter(([, p]) => p.isAlive)
      .reduce((acc, [id, p]) => { acc[id] = p; return acc; }, {});
  }

  async getAliveByTeam(team) {
    const alive = await this.getAlivePlayers();
    return Object.entries(alive)
      .filter(([, p]) => p.team === team)
      .reduce((acc, [id, p]) => { acc[id] = p; return acc; }, {});
  }

  async getAliveWolves() {
    return this.getAliveByTeam('werewolf');
  }

  async getAliveVillagers() {
    return this.getAliveByTeam('village');
  }

  async destroy() {
    const pipeline = this.redis.pipeline();
    pipeline.del(KEYS.gameState(this.gameId));
    pipeline.del(KEYS.gamePlayers(this.gameId));
    pipeline.del(KEYS.gameNightActions(this.gameId));
    pipeline.del(KEYS.gameVotes(this.gameId));
    await pipeline.exec();
  }
}

module.exports = GameState;
