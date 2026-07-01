const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User, UserStats, GamePlayer, Role } = require('../models');
const { Op } = require('sequelize');

// GET /users/me — Hồ sơ bản thân
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password_hash'] },
    include: [{ model: UserStats, as: 'stats' }],
  });
  res.json({ success: true, data: { user } });
});

// PUT /users/me — Cập nhật hồ sơ
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { bio, country_code } = req.body;
    await req.user.update({ bio, country_code });
    res.json({ success: true, message: 'Cập nhật hồ sơ thành công', data: { bio, country_code } });
  } catch (e) { next(e); }
});

// GET /users/leaderboard — Bảng xếp hạng
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const users = await User.findAll({
      attributes: ['id', 'username', 'level', 'xp', 'games_played', 'games_won', 'country_code'],
      where: { is_active: true, is_banned: false },
      order: [['level', 'DESC'], ['xp', 'DESC']],
      limit,
      offset,
    });

    res.json({ success: true, data: { users, page, limit } });
  } catch (e) { next(e); }
});

// GET /users/id/:userId — Hồ sơ công khai theo userId (dùng trong game)
router.get('/id/:userId', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'username', 'level', 'xp', 'games_played', 'games_won', 'bio', 'country_code', 'last_online', 'created_at'],
      include: [{ model: UserStats, as: 'stats' }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

// GET /users/:username — Hồ sơ công khai theo username
router.get('/:username', authenticate, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { username: req.params.username },
      attributes: ['id', 'username', 'level', 'xp', 'games_played', 'games_won', 'bio', 'country_code', 'last_online', 'created_at'],
      include: [{ model: UserStats, as: 'stats' }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

// POST /users/admin/reset-stats — Reset toàn bộ stats (chỉ admin/dev)
// Dùng khi muốn reset DB về trạng thái ban đầu
router.post('/admin/reset-stats', authenticate, async (req, res, next) => {
  try {
    // Kiểm tra quyền admin hoặc dev secret
    const devSecret = req.headers['x-dev-secret'];
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && devSecret !== process.env.DEV_RESET_SECRET) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const { sequelize: db } = require('../models');
    const { User, UserStats, UserDailyQuest } = require('../models');

    // Reset tất cả user stats
    await UserStats.update({
      total_games: 0, total_wins: 0, total_losses: 0, win_rate: 0.00,
      games_as_villager: 0, wins_as_villager: 0,
      games_as_werewolf: 0, wins_as_werewolf: 0,
      games_as_solo: 0, wins_as_solo: 0,
      total_kills: 0, total_saves: 0, total_correct_checks: 0,
      times_voted_out: 0, times_survived: 0,
      elo_rating: 1000, elo_peak: 1000,
    }, { where: {} });

    // Reset coins, xp, level của tất cả user về giá trị mặc định
    await User.update({
      coins: 500, roses: 0, gems: 0,
      xp: 0, level: 1, xp_next_level: 500,
      games_played: 0, games_won: 0,
    }, { where: {} });

    // Xóa tất cả nhiệm vụ hàng ngày
    await UserDailyQuest.destroy({ where: {} });

    res.json({ success: true, message: '✅ Đã reset toàn bộ stats về 0!' });
  } catch (e) { next(e); }
});

// POST /users/admin/reset-user/:userId — Reset 1 user cụ thể
router.post('/admin/reset-user/:userId', authenticate, async (req, res, next) => {
  try {
    const devSecret = req.headers['x-dev-secret'];
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && devSecret !== process.env.DEV_RESET_SECRET) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const { userId } = req.params;
    const { User, UserStats, UserDailyQuest } = require('../models');

    await UserStats.update({
      total_games: 0, total_wins: 0, total_losses: 0, win_rate: 0.00,
      games_as_villager: 0, wins_as_villager: 0,
      games_as_werewolf: 0, wins_as_werewolf: 0,
      games_as_solo: 0, wins_as_solo: 0,
      total_kills: 0, total_saves: 0, total_correct_checks: 0,
      times_voted_out: 0, times_survived: 0,
      elo_rating: 1000, elo_peak: 1000,
    }, { where: { user_id: userId } });

    await User.update({
      coins: 500, roses: 0, gems: 0,
      xp: 0, level: 1, xp_next_level: 500,
      games_played: 0, games_won: 0,
    }, { where: { id: userId } });

    await UserDailyQuest.destroy({ where: { user_id: userId } });

    res.json({ success: true, message: `✅ Đã reset user ${userId} về 0!` });
  } catch (e) { next(e); }
});

module.exports = router;
