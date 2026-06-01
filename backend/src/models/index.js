// src/models/index.js — Centralized model registry & associations

const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Game = require('./Game');
const { DataTypes } = require('sequelize');

// ============================================================
// DEFINE ADDITIONAL MODELS INLINE
// ============================================================

const Item = sequelize.define('Item', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  name_vi: { type: DataTypes.STRING(200), allowNull: false },
  description_vi: { type: DataTypes.TEXT },
  category: { type: DataTypes.ENUM('hat', 'outfit', 'accessory', 'frame', 'emoji', 'role_skin', 'effect', 'bundle'), allowNull: false },
  price_coins: { type: DataTypes.INTEGER, defaultValue: 0 },
  price_gems: { type: DataTypes.INTEGER, defaultValue: 0 },
  price_roses: { type: DataTypes.INTEGER, defaultValue: 0 },
  rarity: { type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'), defaultValue: 'common' },
  is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_premium: { type: DataTypes.BOOLEAN, defaultValue: false },
  image_url: { type: DataTypes.STRING(500) },
  preview_url: { type: DataTypes.STRING(500) },
}, { tableName: 'items', timestamps: true, createdAt: 'created_at', updatedAt: false });

const UserStats = sequelize.define('UserStats', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  total_games: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_wins: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_losses: { type: DataTypes.INTEGER, defaultValue: 0 },
  win_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.00 },
  games_as_villager: { type: DataTypes.INTEGER, defaultValue: 0 },
  wins_as_villager: { type: DataTypes.INTEGER, defaultValue: 0 },
  games_as_werewolf: { type: DataTypes.INTEGER, defaultValue: 0 },
  wins_as_werewolf: { type: DataTypes.INTEGER, defaultValue: 0 },
  games_as_solo: { type: DataTypes.INTEGER, defaultValue: 0 },
  wins_as_solo: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_kills: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_saves: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_correct_checks: { type: DataTypes.INTEGER, defaultValue: 0 },
  times_voted_out: { type: DataTypes.INTEGER, defaultValue: 0 },
  times_survived: { type: DataTypes.INTEGER, defaultValue: 0 },
  elo_rating: { type: DataTypes.INTEGER, defaultValue: 1000 },
  elo_peak: { type: DataTypes.INTEGER, defaultValue: 1000 },
  ranked_season: { type: DataTypes.INTEGER, defaultValue: 1 },
  favorite_role_id: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'user_stats', timestamps: true, createdAt: false, updatedAt: 'updated_at' });

const GamePlayer = sequelize.define('GamePlayer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  game_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  role_id: { type: DataTypes.UUID, allowNull: false },
  is_alive: { type: DataTypes.BOOLEAN, defaultValue: true },
  death_round: { type: DataTypes.INTEGER, allowNull: true },
  death_cause: { type: DataTypes.ENUM('voted', 'wolf_kill', 'hunter_shot', 'poison', 'lovers_death', 'disconnect'), allowNull: true },
  seat_number: { type: DataTypes.INTEGER, allowNull: true },
  is_winner: { type: DataTypes.BOOLEAN, defaultValue: false },
  xp_earned: { type: DataTypes.INTEGER, defaultValue: 0 },
  coins_earned: { type: DataTypes.INTEGER, defaultValue: 0 },
  role_data: { type: DataTypes.JSONB, defaultValue: {} },
}, { tableName: 'game_players', timestamps: true, createdAt: 'joined_at', updatedAt: false });

const GameMessage = sequelize.define('GameMessage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  game_id: { type: DataTypes.UUID, allowNull: false },
  sender_id: { type: DataTypes.UUID, allowNull: true },
  channel: { type: DataTypes.ENUM('public', 'wolf', 'dead', 'system', 'whisper'), defaultValue: 'public' },
  content: { type: DataTypes.TEXT, allowNull: false },
  round_number: { type: DataTypes.INTEGER, allowNull: true },
  phase: { type: DataTypes.STRING(10), allowNull: true },
  is_system: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'game_messages', timestamps: true, createdAt: 'created_at', updatedAt: false });

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.STRING(50), allowNull: false },
  title_vi: { type: DataTypes.STRING(200), allowNull: false },
  body_vi: { type: DataTypes.TEXT },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  action_url: { type: DataTypes.STRING(500) },
}, { tableName: 'notifications', timestamps: true, createdAt: 'created_at', updatedAt: false });

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('earn_coins', 'spend_coins', 'earn_roses', 'spend_roses', 'earn_gems', 'spend_gems'), allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  currency: { type: DataTypes.ENUM('coins', 'roses', 'gems'), allowNull: false },
  balance_after: { type: DataTypes.INTEGER, allowNull: false },
  description_vi: { type: DataTypes.STRING(500) },
  reference_id: { type: DataTypes.UUID },
}, { tableName: 'transactions', timestamps: true, createdAt: 'created_at', updatedAt: false });

const UserInventory = sequelize.define('UserInventory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  item_id: { type: DataTypes.UUID, allowNull: false },
  is_equipped: { type: DataTypes.BOOLEAN, defaultValue: false },
  source: { type: DataTypes.ENUM('purchase', 'battle_pass', 'gift', 'event', 'starter'), defaultValue: 'purchase' },
}, { tableName: 'user_inventory', timestamps: true, createdAt: 'acquired_at', updatedAt: false });

// ============================================================
// ASSOCIATIONS
// ============================================================

// User associations
User.hasOne(UserStats, { foreignKey: 'user_id', as: 'stats' });
UserStats.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(UserInventory, { foreignKey: 'user_id', as: 'inventory' });
UserInventory.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

// Item associations
Item.hasMany(UserInventory, { foreignKey: 'item_id' });
UserInventory.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

// Game associations
Game.hasMany(GamePlayer, { foreignKey: 'game_id', as: 'players' });
GamePlayer.belongsTo(Game, { foreignKey: 'game_id' });

Game.hasMany(GameMessage, { foreignKey: 'game_id', as: 'messages' });
GameMessage.belongsTo(Game, { foreignKey: 'game_id' });

User.hasMany(GamePlayer, { foreignKey: 'user_id' });
GamePlayer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Role.hasMany(GamePlayer, { foreignKey: 'role_id' });
GamePlayer.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

module.exports = {
  sequelize,
  User,
  Role,
  Game,
  GamePlayer,
  GameMessage,
  Item,
  UserStats,
  UserInventory,
  Notification,
  Transaction,
};
