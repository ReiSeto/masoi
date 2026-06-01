const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getRedis, KEYS } = require('../config/redis');

/**
 * Middleware xác thực JWT
 * Thêm req.user sau khi verify thành công
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục',
        code: 'AUTH_001',
      });
    }

    const token = authHeader.substring(7);

    // Kiểm tra blacklist (logout)
    try {
      const redis = getRedis();
      const isBlacklisted = await redis.get(KEYS.blacklistToken(token));
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
          code: 'AUTH_001',
        });
      }
    } catch (redisErr) {
      console.warn('Redis check failed, continuing:', redisErr.message);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy user từ DB
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại',
        code: 'AUTH_001',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
        code: 'AUTH_003',
      });
    }

    if (user.is_banned) {
      const banMsg = user.ban_until
        ? `Tài khoản bị khóa đến ${new Date(user.ban_until).toLocaleDateString('vi-VN')}`
        : 'Tài khoản bị khóa vĩnh viễn';
      return res.status(403).json({
        success: false,
        message: banMsg,
        reason: user.ban_reason,
        code: 'AUTH_003',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng refresh token.',
        code: 'AUTH_001',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      code: 'AUTH_001',
    });
  }
}

/**
 * Middleware kiểm tra quyền Admin
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này',
    });
  }
  next();
}

/**
 * Middleware kiểm tra quyền Moderator+
 */
function requireModerator(req, res, next) {
  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này',
    });
  }
  next();
}

/**
 * Xác thực Socket.IO connection
 */
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Thiếu token xác thực'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username;
    next();
  } catch (error) {
    next(new Error('Token không hợp lệ'));
  }
}

module.exports = { authenticate, requireAdmin, requireModerator, authenticateSocket };
