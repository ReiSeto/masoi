const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User, sequelize } = require('../models');
const { DataTypes } = require('sequelize');

// ============================================================
// QUEST DEFINITIONS (master list, never changes)
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
    category: 'daily',
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
    category: 'daily',
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
    category: 'daily',
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
    category: 'daily',
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
    category: 'daily',
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
    category: 'daily',
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
    category: 'daily',
    track_field: 'village_wins_today',
  },
];

// ============================================================
// Helper: Get or create today's quest progress for user
// ============================================================
async function getUserQuestProgress(userId) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Try get from DB
  const [rows] = await sequelize.query(
    `SELECT * FROM user_daily_quests WHERE user_id = ? AND quest_date = ?`,
    { replacements: [userId, today], type: sequelize.QueryTypes.SELECT }
  );

  if (rows && rows.length > 0) return rows;

  // Create fresh progress for today
  const values = QUEST_DEFINITIONS.map(q =>
    `(UUID(), ?, ?, '${q.id}', 0, 0, '${today}')`
  ).join(',');

  await sequelize.query(
    `INSERT IGNORE INTO user_daily_quests (id, user_id, quest_date, quest_id, progress, claimed, created_at) VALUES ${values.replace(/UUID\(\)/g, '(SELECT UUID())')}`,
    { type: sequelize.QueryTypes.INSERT }
  );

  const [fresh] = await sequelize.query(
    `SELECT * FROM user_daily_quests WHERE user_id = ? AND quest_date = ?`,
    { replacements: [userId, today], type: sequelize.QueryTypes.SELECT }
  );
  return fresh || [];
}

// ============================================================
// GET /quests/daily — Lấy nhiệm vụ hàng ngày
// ============================================================
router.get('/daily', authenticate, async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const userId = req.user.id;

    // Get or init progress rows
    let progressRows = await getUserQuestProgress(userId);
    if (!Array.isArray(progressRows)) progressRows = [];

    // Merge definitions with progress
    const quests = QUEST_DEFINITIONS.map(def => {
      const row = progressRows.find(r => r.quest_id === def.id) || {};
      return {
        ...def,
        progress: row.progress || 0,
        claimed: !!(row.claimed),
        completed: (row.progress || 0) >= def.target,
      };
    });

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
    const today = new Date().toISOString().slice(0, 10);

    const def = QUEST_DEFINITIONS.find(q => q.id === questId);
    if (!def) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });

    // Check progress
    const [rows] = await sequelize.query(
      `SELECT * FROM user_daily_quests WHERE user_id = ? AND quest_date = ? AND quest_id = ?`,
      { replacements: [userId, today, questId], type: sequelize.QueryTypes.SELECT }
    );

    const row = rows;
    if (!row) return res.status(400).json({ success: false, message: 'Bạn chưa có tiến trình nhiệm vụ này hôm nay' });
    if (row.claimed) return res.status(400).json({ success: false, message: 'Đã nhận thưởng nhiệm vụ này rồi!' });
    if ((row.progress || 0) < def.target) return res.status(400).json({ success: false, message: `Chưa hoàn thành! (${row.progress}/${def.target})` });

    // Mark claimed + award currency
    await sequelize.transaction(async (t) => {
      await sequelize.query(
        `UPDATE user_daily_quests SET claimed = 1 WHERE user_id = ? AND quest_date = ? AND quest_id = ?`,
        { replacements: [userId, today, questId], type: sequelize.QueryTypes.UPDATE, transaction: t }
      );

      const updates = [];
      if (def.reward_coins > 0) updates.push(`coins = coins + ${def.reward_coins}`);
      if (def.reward_gems > 0) updates.push(`gems = gems + ${def.reward_gems}`);
      if (def.reward_roses > 0) updates.push(`roses = roses + ${def.reward_roses}`);

      if (updates.length > 0) {
        await sequelize.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          { replacements: [userId], type: sequelize.QueryTypes.UPDATE, transaction: t }
        );
      }
    });

    // Return updated user currency
    const updatedUser = await User.findByPk(userId, {
      attributes: ['coins', 'gems', 'roses', 'xp', 'level'],
    });

    res.json({
      success: true,
      message: `🎉 Nhận thưởng thành công!`,
      data: {
        reward: {
          coins: def.reward_coins,
          gems: def.reward_gems,
          roses: def.reward_roses,
        },
        user: updatedUser,
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.QUEST_DEFINITIONS = QUEST_DEFINITIONS;
