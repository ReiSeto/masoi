require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
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

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    console.log('✅ Kết nối MySQL thành công');

    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Sequelize models synced');
    }

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
