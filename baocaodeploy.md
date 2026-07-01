# 📦 Báo Cáo Deploy — Wolvesville VN Backend

> **Ngày deploy:** 04/06/2026  
> **Thực hiện bởi:** Antigravity (AI Assistant)  
> **Nền tảng:** Render.com (Free Plan)

---

## 🎯 Mục Tiêu

Deploy backend Node.js + Socket.IO của dự án **Wolvesville Việt Nam** lên Render.com, kết nối với:
- PostgreSQL 18 (Render managed database — `wolvesville-db`)
- Redis/Valkey 8 (Render key-value service — `wolvesville-redis`)

---

## 📊 Trạng Thái Trước Khi Fix

| Service | Loại | Trạng thái |
|---|---|---|
| `wolvesville-db` | PostgreSQL 18 | ✅ Available |
| `wolvesville-redis` | Valkey 8 | ✅ Available |
| `wolvesville-backend` | Node.js Web Service | ❌ Deploy Failed |

**Lỗi:** Backend exit code 1 — không khởi động được. Logs trống (không có logs = crash trước khi bind port).

---

## 🔍 Nguyên Nhân Lỗi

### 1. `server.js` — Crash khi load `.env`
```js
// ❌ TRƯỚC — crash nếu không có file .env
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
```
Render.com không có file `.env` vật lý — inject env vars trực tiếp qua dashboard.  
Khi `dotenv` không tìm thấy file, `process.env` trống → mọi kết nối đều fail.

---

### 2. `redis.js` — Không hỗ trợ `REDIS_URL`
```js
// ❌ TRƯỚC — chỉ dùng host/port/password riêng lẻ
client = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || 'redis123', // Hardcode fallback sai
});
```
Render cung cấp Redis/Valkey qua `REDIS_URL` (connection string), không phải `REDIS_PASSWORD`.  
Internal URL thực tế: `redis://red-d8g6aq4p3tds73cc7ohg:6379`

---

### 3. `render.yaml` — Cấu hình sai service names
```yaml
# ❌ TRƯỚC — tên service không khớp với service thực
databases:
  - name: wolvesville-mysql   # Service thực tên là wolvesville-db
    ...
  - key: DB_DIALECT
    value: mysql              # Render dùng PostgreSQL, không phải MySQL
  # Thiếu: DATABASE_URL, REDIS_URL
```

---

### 4. `server.js` — Không sync tables ở production
```js
// ❌ TRƯỚC — bỏ qua sync khi production
if (process.env.NODE_ENV === 'development') {
  await sequelize.sync({ alter: false });
}
```
Tables chưa được tạo trong PostgreSQL mới → mọi query đều fail.

---

## 🛠️ Các Fix Đã Thực Hiện

### Fix 1: `backend/src/server.js` — Dotenv fault-tolerant
```js
// ✅ SAU — chỉ load .env khi file tồn tại (dev local)
const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}
```

### Fix 2: `backend/src/server.js` — Sync tables mọi môi trường
```js
// ✅ SAU — sync an toàn (chỉ CREATE nếu chưa tồn tại, không alter/drop)
await sequelize.sync({ force: false, alter: false });
console.log('✅ Sequelize models synced');
```

### Fix 3: `backend/src/config/redis.js` — Hỗ trợ REDIS_URL
```js
// ✅ SAU — ưu tiên REDIS_URL (Render) > host/port riêng lẻ (local)
if (process.env.REDIS_URL) {
  client = new Redis(process.env.REDIS_URL, { retryStrategy, maxRetriesPerRequest: 3 });
} else {
  const redisConfig = { host, port, retryStrategy, maxRetriesPerRequest: 3 };
  if (process.env.REDIS_PASSWORD) redisConfig.password = process.env.REDIS_PASSWORD;
  client = new Redis(redisConfig);
}
```

### Fix 4: `render.yaml` — Cập nhật đúng service names & thêm env vars
```yaml
# ✅ SAU
databases:
  - name: wolvesville-db       # Đúng tên service thực
    databaseName: wolvesville_vn

services:
  - type: web
    name: wolvesville-backend
    envVars:
      - key: DB_DIALECT
        value: postgres          # Đúng dialect
      - key: DATABASE_URL        # Thêm mới — Render PostgreSQL URL
        fromDatabase:
          name: wolvesville-db
          property: connectionString
      - key: REDIS_URL           # Thêm mới — Render Valkey URL
        fromService:
          name: wolvesville-redis
          type: redis
          property: connectionString
```

---

## 🚀 Quy Trình Deploy

```
1. Phát hiện vấn đề từ Render Events log (exit code 1)
2. Đọc screenshot Render dashboard → xác định services đang chạy
3. Fix 4 vấn đề trong code
4. git add + git commit + git push origin main
   Commit: f1fa775 — "fix: Render.com deployment - add REDIS_URL support, 
                       fix dotenv loading, sync PostgreSQL"
5. Trigger "Deploy latest commit" trên Render dashboard
6. Verify health endpoint
```

---

## ✅ Kết Quả Cuối Cùng

| Service | URL | Trạng thái |
|---|---|---|
| **Backend API** | https://wolvesville-backend.onrender.com | ✅ Live |
| **Health Check** | https://wolvesville-backend.onrender.com/health | ✅ 200 OK |
| **Redis** | Internal — wolvesville-redis | ✅ Connected |
| **PostgreSQL** | Internal — wolvesville-db | ✅ Connected |

### Phản hồi Health Check (xác nhận thực tế):
```json
{
  "success": true,
  "message": "Wolvesville VN API đang chạy 🐺",
  "timestamp": "2026-06-04T10:25:15.592Z",
  "version": "1.0.0"
}
```

---

## 🌐 URLs Production Đầy Đủ

| Thành phần | URL |
|---|---|
| **Frontend** | https://wolvesville-vn.vercel.app *(đã deploy trước)* |
| **Backend API** | https://wolvesville-backend.onrender.com |
| **API Base** | https://wolvesville-backend.onrender.com/api/v1 |
| **Socket.IO** | wss://wolvesville-backend.onrender.com |
| **GitHub Repo** | https://github.com/ReiSeto/masoi |

---

## ⚠️ Lưu Ý Vận Hành (Free Plan)

- **Cold Start:** Instance tự spin down sau ~15 phút idle. Request đầu tiên sau khi ngủ sẽ chậm **~50 giây**.
- **Database:** PostgreSQL free plan giới hạn storage và connections.
- **Redis:** Valkey free plan có giới hạn memory — policy `allkeys-lru` (xóa key cũ khi đầy bộ nhớ).
- **Uptime:** Không đảm bảo 100% uptime trên free tier.

---

## 📁 Files Đã Thay Đổi

| File | Thay đổi |
|---|---|
| `backend/src/server.js` | Dotenv fault-tolerant + sync mọi môi trường |
| `backend/src/config/redis.js` | Hỗ trợ `REDIS_URL` connection string |
| `render.yaml` | Fix tên service + thêm `DATABASE_URL` + `REDIS_URL` |
