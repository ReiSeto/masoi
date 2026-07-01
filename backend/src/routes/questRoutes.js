const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { User, UserDailyQuest, sequelize } = require('../models');

// ============================================================
// QUEST DEFINITIONS
// ============================================================

// 5 Fixed quests — same for everyone every day
const FIXED_QUESTS = [
  {
    id: 'play_1_game',
    title: 'Chơi 1 ván game',
    description: 'Tham gia và hoàn thành 1 ván game',
    icon: '🎮',
    target: 1,
    reward_coins: 50,
    reward_gems: 0,
    reward_roses: 0,
  },
  {
    id: 'play_3_games',
    title: 'Chơi 3 ván hôm nay',
    description: 'Chơi tổng cộng 3 ván trong ngày',
    icon: '🎯',
    target: 3,
    reward_coins: 200,
    reward_gems: 2,
    reward_roses: 0,
  },
  {
    id: 'win_1_game',
    title: 'Thắng 1 ván',
    description: 'Giành chiến thắng trong 1 ván game',
    icon: '🏆',
    target: 1,
    reward_coins: 150,
    reward_gems: 0,
    reward_roses: 0,
  },
  {
    id: 'survive_1_game',
    title: 'Sống sót 1 ván',
    description: 'Sống sót đến cuối trận',
    icon: '🛡️',
    target: 1,
    reward_coins: 80,
    reward_gems: 0,
    reward_roses: 0,
  },
  {
    id: 'win_as_village',
    title: 'Dân Làng chiến thắng',
    description: 'Thắng 1 ván với phe Dân Làng',
    icon: '🏘️',
    target: 1,
    reward_coins: 120,
    reward_gems: 0,
    reward_roses: 1,
  },
];

// Village roles pool (random quest slot 1)
const VILLAGE_ROLE_QUESTS = [
  { id: 'play_as_villager', title: 'Chơi vai Dân Làng', description: 'Hoàn thành 1 ván với vai Dân Làng', icon: '🏘️', target: 1, reward_coins: 60, reward_gems: 0, reward_roses: 0, roleSlug: 'villager' },
  { id: 'play_as_doctor', title: 'Chơi vai Bác Sĩ', description: 'Hoàn thành 1 ván với vai Bác Sĩ', icon: '💊', target: 1, reward_coins: 0, reward_gems: 4, reward_roses: 0, roleSlug: 'doctor' },
  { id: 'play_as_seer', title: 'Chơi vai Tiên Tri', description: 'Hoàn thành 1 ván với vai Tiên Tri', icon: '🔮', target: 1, reward_coins: 0, reward_gems: 5, reward_roses: 0, roleSlug: 'seer' },
  { id: 'play_as_witch', title: 'Chơi vai Phù Thủy', description: 'Hoàn thành 1 ván với vai Phù Thủy', icon: '🧪', target: 1, reward_coins: 90, reward_gems: 0, reward_roses: 0, roleSlug: 'witch' },
  { id: 'play_as_hunter', title: 'Chơi vai Thợ Săn', description: 'Hoàn thành 1 ván với vai Thợ Săn', icon: '🏹', target: 1, reward_coins: 80, reward_gems: 0, reward_roses: 0, roleSlug: 'hunter' },
  { id: 'play_as_bodyguard', title: 'Chơi vai Vệ Sĩ', description: 'Hoàn thành 1 ván với vai Vệ Sĩ', icon: '🛡️', target: 1, reward_coins: 80, reward_gems: 0, reward_roses: 0, roleSlug: 'bodyguard' },
  { id: 'play_as_gunner', title: 'Chơi vai Xạ Thủ', description: 'Hoàn thành 1 ván với vai Xạ Thủ', icon: '🔫', target: 1, reward_coins: 70, reward_gems: 0, reward_roses: 0, roleSlug: 'gunner' },
  { id: 'play_as_detective', title: 'Chơi vai Thám Tử', description: 'Hoàn thành 1 ván với vai Thám Tử', icon: '🔍', target: 1, reward_coins: 0, reward_gems: 4, reward_roses: 0, roleSlug: 'detective' },
  { id: 'play_as_mayor', title: 'Chơi vai Thị Trưởng', description: 'Hoàn thành 1 ván với vai Thị Trưởng', icon: '👑', target: 1, reward_coins: 100, reward_gems: 0, reward_roses: 0, roleSlug: 'mayor' },
];

// Wolf/Solo roles pool (random quest slot 2)
const WOLF_SOLO_ROLE_QUESTS = [
  { id: 'play_as_wolf', title: 'Chơi vai Sói', description: 'Hoàn thành 1 ván với phe Sói', icon: '🐺', target: 1, reward_coins: 100, reward_gems: 0, reward_roses: 0, roleSlug: 'werewolf', teamCheck: 'werewolf' },
  { id: 'play_as_alpha_wolf', title: 'Chơi vai Alpha Sói', description: 'Hoàn thành 1 ván với vai Alpha Sói', icon: '🐺', target: 1, reward_coins: 120, reward_gems: 0, reward_roses: 0, roleSlug: 'alpha_wolf', teamCheck: 'werewolf' },
  { id: 'play_as_jester', title: 'Chơi vai Kẻ Hề', description: 'Hoàn thành 1 ván với vai Kẻ Hề', icon: '🃏', target: 1, reward_coins: 110, reward_gems: 0, reward_roses: 1, roleSlug: 'jester', teamCheck: 'solo' },
  { id: 'play_as_headhunter', title: 'Chơi vai Săn Đầu Người', description: 'Hoàn thành 1 ván với vai Săn Đầu Người', icon: '🎯', target: 1, reward_coins: 100, reward_gems: 0, reward_roses: 0, roleSlug: 'headhunter', teamCheck: 'solo' },
  { id: 'play_as_serial_killer', title: 'Chơi vai Sát Nhân', description: 'Hoàn thành 1 ván với vai Sát Nhân', icon: '🔪', target: 1, reward_coins: 130, reward_gems: 0, reward_roses: 0, roleSlug: 'serial_killer', teamCheck: 'solo' },
];

// Deterministic "random" based on userId + date (so same user gets same quest each day)
function dailyRandom(userId, date, poolLength) {
  const str = `${userId}:${date}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) % poolLength;
}

// Get the 2 random quests for a user on a given date
function getUserRandomQuests(userId, date) {
  const villageIdx = dailyRandom(userId, date + ':v', VILLAGE_ROLE_QUESTS.length);
  // Use a different seed for second quest
  const wolfSoloIdx = dailyRandom(userId, date + ':w', WOLF_SOLO_ROLE_QUESTS.length);
  return [
    VILLAGE_ROLE_QUESTS[villageIdx],
    WOLF_SOLO_ROLE_QUESTS[wolfSoloIdx],
  ];
}

// All quest IDs for a user on a given date
function getUserQuestDefs(userId, date) {
  const randomPair = getUserRandomQuests(userId, date);
  return [...FIXED_QUESTS, ...randomPair];
}

module.exports.QUEST_DEFINITIONS = FIXED_QUESTS; // backward compat
module.exports.getUserQuestDefs = getUserQuestDefs;

// ============================================================
// Helper: today as YYYY-MM-DD string (UTC+7 Vietnam time)
// ============================================================
function todayStr() {
  // Use Vietnam timezone (UTC+7) for consistent daily reset at 24:00 VN time
  const now = new Date();
  const vnOffset = 7 * 60; // minutes
  const vnTime = new Date(now.getTime() + vnOffset * 60 * 1000);
  return vnTime.toISOString().slice(0, 10);
}

// ============================================================
// GET /quests/daily — Lấy nhiệm vụ hàng ngày
// Lazy reset: when a new day is detected, old quests are ignored automatically
// (no cron needed — DB date is the source of truth)
// ============================================================
router.get('/daily', authenticate, async (req, res, next) => {
  try {
    const today = todayStr();
    const userId = req.user.id;

    // Get user-specific quest definitions (5 fixed + 2 random by userId+date)
    const questDefs = getUserQuestDefs(userId, today);

    // Get all existing progress rows for today only
    const existingRows = await UserDailyQuest.findAll({
      where: { user_id: userId, quest_date: today },
    });

    const existingMap = {};
    existingRows.forEach(r => { existingMap[r.quest_id] = r; });

    // Build quest list — create missing rows on-the-fly
    const quests = await Promise.all(questDefs.map(async (def) => {
      if (!existingMap[def.id]) {
        const [row] = await UserDailyQuest.findOrCreate({
          where: { user_id: userId, quest_date: today, quest_id: def.id },
          defaults: { user_id: userId, quest_date: today, quest_id: def.id, progress: 0, claimed: false },
        });
        existingMap[def.id] = row;
      }
      const row = existingMap[def.id];
      return {
        ...def,
        progress: row.progress || 0,
        claimed: !!row.claimed,
        completed: (row.progress || 0) >= def.target,
      };
    }));

    res.json({ success: true, data: { quests, date: today } });
  } catch (e) { next(e); }
});

// ============================================================
// POST /quests/:questId/claim — Nhận thưởng nhiệm vụ
// ============================================================
router.post('/:questId/claim', authenticate, async (req, res, next) => {
  try {
    const { questId } = req.params;
    const userId = req.user.id;
    const today = todayStr();

    // Find quest def from all possible quests (fixed + any random)
    const allPossibleDefs = [
      ...FIXED_QUESTS,
      ...VILLAGE_ROLE_QUESTS,
      ...WOLF_SOLO_ROLE_QUESTS,
    ];
    const def = allPossibleDefs.find(q => q.id === questId);
    if (!def) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });

    // Verify this quest is actually assigned to this user today
    const userQuestDefs = getUserQuestDefs(userId, today);
    if (!userQuestDefs.find(q => q.id === questId)) {
      return res.status(400).json({ success: false, message: 'Nhiệm vụ này không thuộc về bạn hôm nay' });
    }

    const row = await UserDailyQuest.findOne({
      where: { user_id: userId, quest_date: today, quest_id: questId },
    });

    if (!row) return res.status(400).json({ success: false, message: 'Chưa có tiến trình nhiệm vụ này hôm nay' });
    if (row.claimed) return res.status(400).json({ success: false, message: 'Đã nhận thưởng nhiệm vụ này rồi!' });
    if ((row.progress || 0) < def.target) {
      return res.status(400).json({ success: false, message: `Chưa hoàn thành! (${row.progress}/${def.target})` });
    }

    // Mark claimed + award currency (atomic transaction)
    await sequelize.transaction(async (t) => {
      await row.update({ claimed: true }, { transaction: t });

      const currencyUpdate = {};
      if (def.reward_coins > 0) currencyUpdate.coins = sequelize.literal(`coins + ${def.reward_coins}`);
      if (def.reward_gems > 0) currencyUpdate.gems = sequelize.literal(`gems + ${def.reward_gems}`);
      if (def.reward_roses > 0) currencyUpdate.roses = sequelize.literal(`roses + ${def.reward_roses}`);

      if (Object.keys(currencyUpdate).length > 0) {
        await User.update(currencyUpdate, { where: { id: userId }, transaction: t });
      }
    });

    // Reload updated currency
    const updatedUser = await User.findByPk(userId, {
      attributes: ['coins', 'gems', 'roses', 'xp', 'level'],
    });

    res.json({
      success: true,
      message: '🎉 Nhận thưởng thành công!',
      data: {
        reward: { coins: def.reward_coins, gems: def.reward_gems, roses: def.reward_roses },
        user: updatedUser,
      },
    });
  } catch (e) { next(e); }
});

module.exports = router;
