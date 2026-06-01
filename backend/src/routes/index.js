const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const gameRoutes = require('./gameRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/games', gameRoutes);

// API Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Wolvesville VN API v1 🐺',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      roles: '/api/v1/roles',
      games: '/api/v1/games',
    },
  });
});

module.exports = router;
