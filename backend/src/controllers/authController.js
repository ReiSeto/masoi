const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { User, UserStats } = require('../models');
const { getRedis, KEYS, TTL } = require('../config/redis');

// ============================================================
// VALIDATION SCHEMAS
// ============================================================
const registerSchema = z.object({
  username: z.string().min(3, 'Tên người dùng tối thiểu 3 ký tự').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Tên người dùng chỉ dùng chữ, số và gạch dưới'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(50),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

// ============================================================
// HELPERS
// ============================================================
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
}

function setRefreshTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isProduction, // must be true for SameSite=none
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin Vercel→Render
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });
}

// ============================================================
// CONTROLLERS
// ============================================================

/**
 * POST /auth/register — Đăng ký tài khoản
 */
async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    // Kiểm tra email & username đã tồn tại
    const existing = await User.findOne({
      where: { email: data.email },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email này đã được đăng ký',
        code: 'USER_002',
      });
    }

    const existingUsername = await User.findOne({
      where: { username: data.username },
    });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Tên người dùng đã tồn tại',
        code: 'USER_001',
      });
    }

    // Hash mật khẩu
    const password_hash = await bcrypt.hash(data.password, 12);

    // Tạo user
    const user = await User.create({
      username: data.username,
      email: data.email,
      password_hash,
      coins: 500,
    });

    // Tạo user_stats
    await UserStats.create({ user_id: user.id });

    // Tạo tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Chào mừng bạn đến với Wolvesville VN 🐺',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          level: user.level,
          coins: user.coins,
        },
        access_token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/login — Đăng nhập
 */
async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    // Tìm user
    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
        code: 'AUTH_002',
      });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
        code: 'AUTH_002',
      });
    }

    // Kiểm tra ban
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Lý do: ' + (user.ban_reason || 'Vi phạm quy định'),
        code: 'AUTH_003',
      });
    }

    // Tính điểm uy tín phục hồi (1 điểm mỗi giờ)
    let newReputation = user.reputation !== undefined ? user.reputation : 100;
    let lastRecovery = user.last_reputation_recovery ? new Date(user.last_reputation_recovery) : new Date();
    if (newReputation < 100) {
      const now = new Date();
      const hoursPassed = Math.floor((now - lastRecovery) / (1000 * 60 * 60));
      if (hoursPassed > 0) {
        newReputation = Math.min(100, newReputation + hoursPassed);
        // Only advance lastRecovery by hours actually used for recovery
        // Or simply set to now to simplify
        lastRecovery = new Date(lastRecovery.getTime() + hoursPassed * 60 * 60 * 1000);
      }
    }

    // Cập nhật last_online và uy tín
    await user.update({ 
      last_online: new Date(),
      reputation: newReputation,
      last_reputation_recovery: lastRecovery
    });

    // Cập nhật session trong Redis
    try {
      const redis = getRedis();
      await redis.hset(KEYS.userSession(user.id), {
        status: 'online',
        game_id: '',
        last_seen: Date.now(),
      });
      await redis.expire(KEYS.userSession(user.id), TTL.userSession);
    } catch (redisErr) {
      console.warn('Redis session update failed:', redisErr.message);
    }

    // Tạo tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          level: user.level,
          xp: user.xp,
          xp_next_level: user.xp_next_level,
          coins: user.coins,
          roses: user.roses,
          gems: user.gems,
          role: user.role,
          bio: user.bio,
          country_code: user.country_code,
          games_played: user.games_played,
          games_won: user.games_won,
          reputation: user.reputation,
          last_online: user.last_online,
        },
        access_token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/logout — Đăng xuất
 */
async function logout(req, res, next) {
  try {
    const token = req.token;

    // Blacklist token trong Redis
    try {
      const redis = getRedis();
      await redis.set(KEYS.blacklistToken(token), '1', 'EX', TTL.blacklistToken);

      // Xóa session
      await redis.del(KEYS.userSession(req.user.id));
    } catch (redisErr) {
      console.warn('Redis logout failed:', redisErr.message);
    }

    // Xóa refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({
      success: true,
      message: 'Đã đăng xuất thành công',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/refresh — Làm mới access token
 */
async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không tồn tại',
        code: 'AUTH_001',
      });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active || user.is_banned) {
      return res.status(401).json({
        success: false,
        message: 'Không thể refresh token',
        code: 'AUTH_001',
      });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({
      success: true,
      data: { access_token: newAccessToken },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ. Vui lòng đăng nhập lại.',
        code: 'AUTH_001',
      });
    }
    next(error);
  }
}

module.exports = { register, login, logout, refreshToken };
