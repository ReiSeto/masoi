# ⚙️ TECH STACK — WOLVESVILLE VIỆT NAM

## 🏆 LÝ DO CHỌN STACK NÀY

Game Ma Sói yêu cầu **real-time** cực kỳ cao (nhiều người chơi cùng lúc, chat, countdown timer).
Stack được chọn tối ưu cho: **low latency WebSocket, concurrent connections, và rapid development**.

---

## 🖥️ BACKEND

### Node.js 20 LTS + Express 5
- **Lý do**: Event-driven I/O hoàn hảo cho WebSocket. Hệ sinh thái npm rộng.
- **Thay thế đã xem xét**: FastAPI (Python) — nhanh hơn nhưng ít thư viện game real-time hơn.

### Socket.IO 4
- **Lý do**: Abstraction trên WebSocket, hỗ trợ rooms (mỗi game = 1 room), namespace, auto-reconnect.
- **Dùng cho**: Game state sync, chat real-time, timer countdown, event broadcast.
- **Fallback**: Long-polling nếu WebSocket bị chặn.

```json
// package.json backend (chính)
{
  "dependencies": {
    "express": "^5.0.0",
    "socket.io": "^4.7.0",
    "sequelize": "^6.37.0",
    "pg": "^8.11.0",           // PostgreSQL driver
    "ioredis": "^5.3.0",       // Redis client
    "bcryptjs": "^2.4.3",      // Hash mật khẩu
    "jsonwebtoken": "^9.0.0",  // JWT auth
    "zod": "^3.22.0",          // Validation schema
    "cors": "^2.8.5",
    "helmet": "^7.0.0",        // Security headers
    "morgan": "^1.10.0",       // HTTP logging
    "uuid": "^9.0.0",
    "dotenv": "^16.0.0"
  }
}
```

---

## 🗄️ DATABASE

### PostgreSQL 16 (Chính)
- **Lý do**: ACID compliance, JSONB cho game config linh hoạt, hiệu năng cao với index tốt.
- **Dùng cho**: Users, game history, roles, items, transactions.
- **ORM**: Sequelize 6 (hỗ trợ migration, seed, associations).

### Redis 7 (Cache + Real-time State)
- **Lý do**: In-memory, < 1ms latency. Pub/Sub cho multi-server scaling.
- **Dùng cho**:
  - Game state đang chạy (phase, players alive, votes)
  - Session user (socket_id mapping)
  - Matchmaking queue
  - Rate limiting
  - Timer countdown (EXPIRE key)

```
PostgreSQL → Dữ liệu PERSISTENT (lưu mãi)
Redis      → Dữ liệu EPHEMERAL (chỉ trong lúc chơi)
```

---

## 🎨 FRONTEND

### React 18 + Vite 5
- **Lý do**: Component-based, hot reload nhanh, ecosystem mạnh (UI libs, hooks).
- **Styling**: Tailwind CSS 3 — utility-first, không cần viết CSS nhiều.
- **State**: Zustand — nhẹ hơn Redux, phù hợp game state phức tạp.

```json
// package.json frontend (chính)
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "socket.io-client": "^4.7.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "framer-motion": "^11.0.0",  // Animation mượt mà
    "react-hot-toast": "^2.4.0", // Notification toast
    "lucide-react": "^0.344.0"   // Icon set
  }
}
```

---

## 🐳 INFRASTRUCTURE

### Docker + Docker Compose
```yaml
# Các service:
services:
  postgres:    # PostgreSQL 16
  redis:       # Redis 7
  backend:     # Node.js API + Socket.IO
  frontend:    # React (Nginx serving)
  nginx:       # Reverse proxy
```

### Nginx (Reverse Proxy)
- Route `/api/*` → Backend
- Route `/socket.io/*` → Backend (WebSocket upgrade)
- Route `/*` → Frontend static files

---

## 🔒 AUTHENTICATION

### JWT + Refresh Token Pattern
```
[Login] → Access Token (15 phút) + Refresh Token (7 ngày, lưu HttpOnly Cookie)
[Request] → Bearer {access_token} trong Authorization header
[Expired] → Tự động refresh qua /auth/refresh
[Logout] → Blacklist refresh token trong Redis
```

### Socket.IO Auth
```javascript
// Xác thực khi connect WebSocket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT → attach user vào socket.data
});
```

---

## 📁 ENVIRONMENT VARIABLES

```env
# .env.example
NODE_ENV=development
PORT=5000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wolvesville_vn
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=another_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Cloudinary (cho upload ảnh avatar)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 🚀 LỆNH KHỞI ĐỘNG

```bash
# Development
docker-compose up -d postgres redis   # Chỉ DB
cd backend && npm run dev              # Backend port 5000
cd frontend && npm run dev             # Frontend port 3000

# Production
docker-compose up -d --build           # Tất cả services

# Database
cd backend && npx sequelize-cli db:migrate      # Chạy migrations
cd backend && npx sequelize-cli db:seed:all     # Seed data
```

---

## 📊 SCALING PLAN (Tương lai)

```
Phase 1 (MVP): Single server, 1 PostgreSQL, 1 Redis
Phase 2: Redis Cluster cho multiple game servers
Phase 3: PostgreSQL Read Replicas cho queries thống kê
Phase 4: Microservices (Game Engine tách riêng)
```

---

*Cập nhật lần cuối: 2026-05-29*
