const path = require('path');
const fs = require('fs');
// Chỉ load .env khi dev local (Render.com inject env vars trực tiếp)
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./config/database');
const { initRedis } = require('./config/redis');
const { initSocket } = require('./socket');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Trust proxy — required on Render.com / Heroku behind load balancer
// Allows express-rate-limit to correctly read client IP from X-Forwarded-For
app.set('trust proxy', 1);

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
// Also allow Vercel preview URLs
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now in production
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate limiting chung
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    code: 'RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================================
// ROUTES
// ============================================================
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Wolvesville VN API đang chạy 🐺',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFound);
app.use(errorHandler);

// ============================================================
// SOCKET.IO
// ============================================================
initSocket(server);

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Kết nối Database
    await sequelize.authenticate();
    console.log('✅ Kết nối Database thành công');

    // Sync models — tạo tables nếu chưa tồn tại (safe, không xóa data)
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Sequelize models synced');

    // Kết nối Redis
    await initRedis();
    console.log('✅ Kết nối Redis thành công');

    // Bắt đầu lắng nghe
    server.listen(PORT, () => {
      console.log(`\n🐺 Wolvesville VN Backend đang chạy`);
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
      console.log(`📋 API Docs: http://localhost:${PORT}/api/v1`);
      console.log(`🌍 Môi trường: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server };
