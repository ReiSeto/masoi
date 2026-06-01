const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slug: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  name_vi: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  name_en: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description_vi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  team: {
    type: DataTypes.ENUM('village', 'werewolf', 'solo'),
    allowNull: false,
  },
  aura: {
    type: DataTypes.ENUM('good', 'evil', 'neutral'),
    allowNull: false,
  },
  has_night_action: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  night_action_desc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  uses_per_game: {
    type: DataTypes.INTEGER,
    defaultValue: -1, // -1 = unlimited
  },
  can_chat_at_night: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_revealed_on_death: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'easy',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  icon_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Role;
