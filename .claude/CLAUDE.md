# 🐺 WOLVESVILLE VIỆT NAM — CLAUDE CODE CONTEXT

> **File này được đọc tự động bởi Claude Code mỗi khi bắt đầu session mới.**
> Đọc file này đầu tiên, sau đó đọc các file liên quan theo task hiện tại.

---

## 📁 CẤU TRÚC THƯ MỤC `.claude/`

```
.claude/
├── CLAUDE.md              ← File này (đọc đầu tiên mỗi session)
├── memory.md              ← ⭐ BỘ NHỚ SESSION (đọc ngay sau CLAUDE.md)
├── PROJECT_OVERVIEW.md    ← Tổng quan dự án & kiến trúc hệ thống
├── TECH_STACK.md          ← Stack công nghệ & lý do chọn
├── DATABASE_SCHEMA.md     ← Schema database đầy đủ (PostgreSQL + Redis)
├── GAME_ROLES.md          ← Danh sách 50+ vai trò game Ma Sói (tiếng Việt)
├── FEATURES.md            ← Danh sách tính năng & mức độ ưu tiên
├── PROGRESS.md            ← Tiến độ hiện tại (cập nhật sau mỗi session)
└── API_DESIGN.md          ← Thiết kế REST API & WebSocket events
```

---

## 🎯 MỤC TIÊU DỰ ÁN

Clone game **Wolvesville** (game Ma Sói online) sang **tiếng Việt** cho người dùng Việt Nam.

- **Tên dự án**: `Wolvesville Việt Nam` (hoặc `Ma Sói Online VN`)
- **Thể loại**: Game suy diễn xã hội (Social Deduction Game) — nhiều người chơi real-time
- **Ngôn ngữ**: 100% tiếng Việt
- **Gốc tham khảo**: https://www.wolvesville.com/

---

## ⚡ QUY TẮC LÀM VIỆC THEO SESSION

### Bắt đầu mỗi session:
1. Đọc `CLAUDE.md` (file này)
2. Đọc `memory.md` → **bộ nhớ đầy đủ** (files đã tạo, trạng thái, việc cần làm tiếp)
3. Đọc `PROGRESS.md` → biết đang làm đến đâu
4. Đọc file liên quan đến task hiện tại (DB → `DATABASE_SCHEMA.md`, Features → `FEATURES.md`, v.v.)

### Kết thúc mỗi session:
1. Cập nhật `PROGRESS.md` với những gì đã làm xong
2. Ghi lại vấn đề còn tồn đọng hoặc quyết định kỹ thuật quan trọng

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

```
[Client Browser]
     │  HTTP REST + WebSocket (Socket.IO)
     ▼
[Nginx Reverse Proxy]
     │
     ├─► [Frontend: React + Vite]   ← Port 3000
     │
     └─► [Backend: Node.js/Express] ← Port 5000
              │
              ├─► [PostgreSQL]       ← Dữ liệu chính (users, games, roles...)
              ├─► [Redis]            ← Session, game state real-time, cache
              └─► [Cloudinary/S3]    ← Avatar, skin, assets game
```

---

## 📂 CẤU TRÚC THƯ MỤC DỰ ÁN

```
wolvesville/
├── .claude/               ← Tài liệu quản lý session (9 files)
├── .env                   ← Biến môi trường (ở ROOT, không phải backend/)
├── docker-compose.yml     ← PostgreSQL + Redis
├── database/schema.sql    ← 17 bảng + 14 roles + 11 items seed
│
├── backend/src/
│   ├── server.js          ← Express + Socket.IO (⚠️ dotenv path: ../../.env)
│   ├── server.mock.js     ← Mock server (không cần DB)
│   ├── config/            ← database.js, redis.js
│   ├── models/            ← User, Role, Game + 6 inline models
│   ├── middleware/        ← auth.js (JWT), errorHandler.js
│   ├── controllers/       ← authController.js
│   ├── routes/            ← auth, user, role, game routes
│   ├── socket/
│   │   ├── index.js       ← Socket.IO init + 3 handlers
│   │   ├── lobbyHandler.js ← join/leave/start + GameEngine init
│   │   ├── chatHandler.js  ← public/wolf/dead channels
│   │   └── gameHandler.js  ← ⭐ night_action, vote, hunter_shot, reconnect
│   └── game/              ← ⭐ GAME ENGINE
│       ├── GameEngine.js   ← Vòng lặp chính (381 lines)
│       ├── GameState.js    ← Redis state CRUD (170 lines)
│       ├── RoleAssigner.js ← Gán vai + 6 preset configs (148 lines)
│       └── phases/
│           ├── NightPhase.js   ← Wolf→Seer→Doctor→Witch→Bodyguard→SK
│           ├── DayPhase.js     ← Dawn announcements
│           ├── DiscussPhase.js ← Duration constant
│           └── VotePhase.js    ← Mayor x2, Jester, Hunter
├── backend/test/
│   └── bot-players.js     ← 3 bots tự chơi (join + auto action)
│
└── frontend/src/
    ├── main.jsx, App.jsx  ← Entry + Router
    ├── index.css           ← Tailwind + custom component classes
    ├── store/
    │   ├── authStore.js    ← Zustand + persist + auto-refresh
    │   └── socketStore.js  ← Socket.IO: connect, nightAction, vote
    └── pages/
        ├── LobbyPage.jsx   ← ⭐ Wolvesville-style 3-column dashboard
        ├── GamePage.jsx    ← ⭐ 3-panel game UI (21KB)
        ├── LoginPage.jsx   ← Dark wolf theme
        ├── RegisterPage.jsx ← 4 fields, validation
        ├── ProfilePage.jsx  ← Stats + ELO
        └── NotFoundPage.jsx
```

---

## 🔑 THÔNG TIN KỸ THUẬT CỐT LÕI

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js 20 + Express 5 |
| Real-time | Socket.IO 4 |
| Database chính | MySQL Workbench 8 |
| Cache / Game state | Redis 7 |
| Frontend | React 18 + Vite 5 |
| Auth | JWT + Refresh Token |
| ORM | Sequelize 6 |
| Container | Docker + Docker Compose |

---

## ⚠️ CÁC ĐIỂM CHÚ Ý QUAN TRỌNG

1. **Luôn dùng tiếng Việt** cho tất cả UI text, thông báo, tên vai trò
2. **Game state** lưu trên Redis (không phải PostgreSQL) vì cần tốc độ cao
3. **Vai trò game** có 3 phe: Dân Làng, Sói, Độc Lập (xem `GAME_ROLES.md`)
4. **Mỗi ván game** cần socket room riêng biệt
5. **Không copy code** của Wolvesville — tự xây dựng logic riêng
6. **`.env` nằm ở ROOT** (không phải `backend/`) — `server.js` load bằng `dotenv({ path: '../../.env' })`
7. **Rate limiter** đặt 100 req/15min cho dev mode (file: `authRoutes.js`)
8. **Test accounts**: test1@game.com, bot2-4@test.com (password: test123456)

---

*Cập nhật lần cuối: 2026-05-30 (Session #3)*
