const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  game_mode: {
    type: DataTypes.ENUM('quick', 'ranked', 'custom', 'friends', 'sandbox'),
    allowNull: false,
    defaultValue: 'quick',
  },
  status: {
    type: DataTypes.ENUM('waiting', 'in_progress', 'finished', 'cancelled'),
    allowNull: false,
    defaultValue: 'waiting',
  },
  max_players: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
    validate: { min: 4, max: 20 },
  },
  min_players: {
    type: DataTypes.INTEGER,
    defaultValue: 6,
    validate: { min: 4 },
  },
  language: {
    type: DataTypes.CHAR(2),
    defaultValue: 'vi',
  },
  role_config: {
    type: DataTypes.JSONB,
    defaultValue: {},
    // VD: { "werewolf": 2, "seer": 1, "doctor": 1, "villager": 8 }
  },
  winning_team: {
    type: DataTypes.ENUM('village', 'werewolf', 'solo'),
    allowNull: true,
  },
  winner_role_slug: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  total_rounds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  host_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  room_code: {
    type: DataTypes.CHAR(6),
    allowNull: true,
    unique: true,
  },
}, {
  tableName: 'games',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['game_mode'] },
    { fields: ['room_code'], where: { room_code: { [require('sequelize').Op.ne]: null } } },
    { fields: ['created_at'] },
  ],
});

module.exports = Game;
