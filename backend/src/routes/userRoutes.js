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

// GET /users/:username — Hồ sơ công khai
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

module.exports = router;
