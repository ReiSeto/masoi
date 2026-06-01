const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Game, GamePlayer } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Tạo mã phòng ngẫu nhiên 6 ký tự
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// POST /games/rooms — Tạo phòng riêng
router.post('/rooms', authenticate, async (req, res, next) => {
  try {
    const { max_players = 12, role_config = {} } = req.body;

    // Tạo room code duy nhất
    let room_code;
    let attempts = 0;
    do {
      room_code = generateRoomCode();
      const existing = await Game.findOne({ where: { room_code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const game = await Game.create({
      game_mode: 'custom',
      status: 'waiting',
      max_players,
      min_players: 6,
      role_config,
      host_user_id: req.user.id,
      room_code,
    });

    res.status(201).json({
      success: true,
      message: 'Tạo phòng thành công!',
      data: { game },
    });
  } catch (e) { next(e); }
});

// GET /games/rooms/:code — Thông tin phòng
router.get('/rooms/:code', authenticate, async (req, res, next) => {
  try {
    const game = await Game.findOne({
      where: { room_code: req.params.code.toUpperCase(), status: 'waiting' },
      include: [{ model: GamePlayer, as: 'players' }],
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng hoặc phòng đã bắt đầu',
        code: 'GAME_001',
      });
    }

    res.json({ success: true, data: { game } });
  } catch (e) { next(e); }
});

// GET /games/:id — Kết quả ván đấu
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const game = await Game.findByPk(req.params.id, {
      include: [{ model: GamePlayer, as: 'players' }],
    });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ván đấu' });
    }

    res.json({ success: true, data: { game } });
  } catch (e) { next(e); }
});

module.exports = router;
