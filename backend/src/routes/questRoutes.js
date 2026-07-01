const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { User, UserDailyQuest, sequelize } = require('../models');

// ============================================================
// QUEST DEFINITIONS (master list)
// ============================================================
const QUEST_DEFINITIONS = [
  {
    id: 'play_1_game',
    title: 'Chơi 1 ván game',
    description: 'Tham gia và hoàn thành 1 ván game',
    icon: '🎮',
    target: 1,
    reward_coins: 50,
    reward_gems: 0,
    reward_roses: 0,
    track_field: 'games_played_today',
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
    track_field: 'wins_today',
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
    track_field: 'survived_today',
  },
  {
    id: 'play_as_seer',
    title: 'Chơi vai Tiên Tri',
    description: 'Hoàn thành 1 ván với vai Tiên Tri',
    icon: '🔮',
    target: 1,
    reward_coins: 0,
    reward_gems: 5,
    reward_roses: 0,
    track_field: 'seer_games_today',
  },
  {
    id: 'play_as_wolf',
    title: 'Chơi vai Sói',
    description: 'Hoàn thành 1 ván với phe Sói',
    icon: '🐺',
    target: 1,
    reward_coins: 100,
    reward_gems: 0,
    reward_roses: 0,
    track_field: 'wolf_games_today',
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
    track_field: 'games_played_today',
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
    track_field: 'village_wins_today',
  },
];

module.exports.QUEST_DEFINITIONS = QUEST_DEFINITIONS;

// ============================================================
// Helper: today as YYYY-MM-DD string
// ============================================================
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// GET /quests/daily — Lấy nhiệm vụ hàng ngày
// ============================================================
router.get('/daily', authenticate, async (req, res, next) => {
  try {
    const today = todayStr();
    const userId = req.user.id;

    // Get all existing progress rows for today
    const existingRows = await UserDailyQuest.findAll({
      where: { user_id: userId, quest_date: today },
    });

    const existingMap = {};
    existingRows.forEach(r => { existingMap[r.quest_id] = r; });

    // Build quest list — create missing rows on-the-fly
    const quests = await Promise.all(QUEST_DEFINITIONS.map(async (def) => {
      if (!existingMap[def.id]) {
        // Create fresh row for this quest today
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

    const def = QUEST_DEFINITIONS.find(q => q.id === questId);
    if (!def) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });

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
