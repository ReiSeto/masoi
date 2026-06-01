const express = require('express');
const router = express.Router();
const { Role } = require('../models');

// GET /roles — Danh sách vai trò
router.get('/', async (req, res, next) => {
  try {
    const { team } = req.query;
    const where = { is_active: true };
    if (team) where.team = team;

    const roles = await Role.findAll({
      where,
      order: [['sort_order', 'ASC']],
    });

    res.json({ success: true, data: { roles } });
  } catch (e) { next(e); }
});

// GET /roles/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const role = await Role.findOne({ where: { slug: req.params.slug } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vai trò' });
    }
    res.json({ success: true, data: { role } });
  } catch (e) { next(e); }
});

module.exports = router;
