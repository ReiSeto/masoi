const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
    validate: {
      len: [3, 30],
      is: /^[a-zA-Z0-9_]+$/,
    },
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  coins: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
    validate: { min: 0 },
  },
  roses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 },
  },
  gems: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 },
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 1 },
  },
  xp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  xp_next_level: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  avatar_item_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  frame_item_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  country_code: {
    type: DataTypes.CHAR(2),
    defaultValue: 'VN',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ban_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ban_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('player', 'moderator', 'admin'),
    defaultValue: 'player',
  },
  games_played: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  games_won: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reputation: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: { min: 0, max: 100 },
  },
  last_reputation_recovery: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  last_online: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['username'] },
    { fields: ['email'] },
    { fields: ['level'] },
  ],
});

module.exports = User;
