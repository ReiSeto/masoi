# 🧠 MEMORY.MD — WOLVESVILLE VIỆT NAM
> **Mục đích**: File này tóm tắt toàn bộ những gì đã được xây dựng, để Claude Code (hoặc bất kỳ AI nào) có thể tiếp tục từ đúng điểm dừng mà không cần hỏi lại từ đầu.
> **Cập nhật lần cuối**: 2026-05-30 (Session #5 — Antigravity)

---

## 📍 TRẠNG THÁI HIỆN TẠI

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Tài liệu `.claude/` | ✅ 100% | 9 file (gồm memory.md) |
| PostgreSQL Schema | ✅ 100% | `database/schema.sql` — 17 bảng + seed |
| Backend base | ✅ 100% | Express + Socket.IO + **Game Engine hoàn chỉnh** |
| Frontend base | ✅ 100% | React + Vite + Tailwind, build OK |
| Auth (register/login) | ✅ Hoạt động | Kết nối DB thật, JWT + refresh token |
| Lobby + Tạo phòng | ✅ Hoạt động | Socket.IO lobby events, tạo/vào/rời phòng |
| **Game Engine** | ✅ 100% | **MULTIPLAYER & BOT INTEGRATED**: Night→Dawn→Discuss→Vote→Win |
| **Game UI (GamePage)** | ✅ 100% | **REDESIGNED & DYNAMIC**: Gravestones, vote wood indicators, phase themes, speech bubbles, dynamic role grids. |
| **Lobby UI (LobbyPage)** | ✅ 100% | **Tạo Bot & Redesign**: 3-column dashboard, confirmation modal, add/remove bot buttons |
| Docker Compose | ✅ Hoạt động | PostgreSQL + Redis đã kết nối thật |
| Bot Testing Script | ✅ Hoạt động | `full-game-test.js` (E2E), `BotBrain.js` (Smart AI decision module) |

---

## 🚀 CÁCH CHẠY NGAY

### Chế độ THẬT (cần Docker):
```bash
# 1. Bật PostgreSQL + Redis
cd C:\Users\Dell\Downloads\wolvesville
docker-compose up -d postgres redis

# 2. Backend (kết nối DB thật)
cd backend
npm run dev
# → http://localhost:5000

# 3. Frontend
cd frontend
npm run dev
# → http://localhost:3000
```

### Chế độ MOCK (không cần Docker):
```bash
cd backend && npm run mock    # Mock in-memory
cd frontend && npm run dev
```

### Test multiplayer với bots:
```bash
# Option 1: Full automated test (4 players, auto-create room, auto-play)
cd backend
node test/full-game-test.js
# → Tự tạo phòng, 4 bot join, auto start, chơi đến hết game

# Option 2: Manual test (bạn chơi qua browser + 3 bots)
# 1. Tạo phòng qua UI hoặc API
# 2. Chạy bots (thay ROOM_CODE bằng mã phòng thật)
cd backend
node test/bot-players.js <ROOM_CODE>
# → 3 bots tự join, tự night action, tự vote
```

### Test accounts đã tạo:
| Email | Password | Username |
|---|---|---|
| test1@game.com | test123456 | testplayer1 |
| bot2@test.com | test123456 | wolfbot2 |
| bot3@test.com | test123456 | wolfbot3 |
| bot4@test.com | test123456 | wolfbot4 |

> ✅ **Session #5 — SINGLE-PLAYER BOT INTEGRATED**:
> - Designed `🤖 Tạo Bot` button with elegant double confirmation dialog in lobby.
> - Implemented virtual bot addition and eviction (`lobby:add_bot`, `lobby:remove_bot`).
> - Developed `BotBrain.js` AI with strategic logic for werewolf, doctor, seer, hunter.
> - Randomized player seat numbers (`shuffle(players)`) on entering the game.
> - Simulated and verified 4-player game (1 human + 3 bots) playing seamlessly to game over.
>
> ✅ **Session #6 — HIGH-FIDELITY GAMEPLAY UI & DYNAMIC ROLE SYNCHRONIZATION**:
> - **Hold & Hover Role Badge Details**: Created an interactive hover/hold popover card for the player's role, showing title, alignment/team, aura, and detailed mechanics.
> - **Dynamic Active Game Roles**: Synchronized backend configurations to send the match's exact role list (`roleList`) in initialization and reconnection state syncs.
> - **Automatic Role Elimination Grid**: Designed `isRoleDisabled(roleSlug)` logic, dynamically gracing out and disabling specific role icons in the sidebar when all of their assigned players have deceased.
> - **Gravestone and Public Role Reveals**: Added arched slate RIP Gravestone SVGs in place of deceased player avatars, with a badge overlay displaying their revealed role icon on the bottom right of their card.
> - **Speech Bubbles & Vote Indicators**: Populated real-time micro-animation speech bubbles overlaying player cards, and displayed dynamic wood-like vote banners during the Voting phase.
> - **Phase-Aware Theme Transitions**: Styled automatic CSS switches between a deep indigo night atmosphere and a soft light-grey Day/Voting mode.
>
> ✅ **Session #7 — E2E TESTING & ROLE ANIMATIONS**:
> - **Thử nghiệm E2E & Đồng bộ hệ thống**: Hoàn tất kịch bản kiểm thử toàn diện, dọn dẹp game ảo (Ghost Game) và hệ thống uy tín.
> - **Logic 7 Vai Trò Nâng Cao**: Tiên Tri/Sói Tiên Tri/Thám Tử nhận KQ ngay lập tức trong đêm. Cai ngục nhốt/xử tử. Vệ sĩ bảo vệ. Xạ thủ bắn. Hỏa tặc tẩm dầu/châm lửa giết người hàng loạt đêm. Phù thủy cứu/độc hoạt động mượt mà.
> - **Hiệu Ứng Chiêu Thức Đỉnh Cao**: Sử dụng `framer-motion` tích hợp hiệu ứng thị giác cho từng vai (lửa cháy, tia lazer, vòng bảo vệ, cung tên, bàn tay vote 🫵 tự ghi đè hiệu ứng đêm).

---

## 📁 CẤU TRÚC FILE ĐẦY ĐỦ

```
wolvesville/
├── .claude/               ✅ 9 file tài liệu
│   ├── CLAUDE.md          Context file chính
│   ├── PROGRESS.md        Tiến độ
│   ├── DATABASE_SCHEMA.md Schema đầy đủ
│   ├── TECH_STACK.md      Stack + lý do chọn
│   ├── FEATURES.md        95 tính năng chia 4 phase
│   ├── API_DESIGN.md      REST + Socket.IO events
│   ├── GAME_ROLES.md      50+ vai trò tiếng Việt
│   ├── PROJECT_OVERVIEW.md Tổng quan kiến trúc
│   └── memory.md          ← FILE NÀY
│
├── .env                   ✅ (dev defaults)
├── docker-compose.yml     ✅ PostgreSQL + Redis
│
├── database/
│   └── schema.sql         ✅ 17 bảng + 14 roles + 11 items seed
│
├── backend/
│   ├── package.json       (scripts: dev, mock, start)
│   ├── test/
│   │   └── bot-players.js ⭐ 3 bots tự chơi
│   └── src/
│       ├── server.js          Express + Socket.IO (DB thật)
│       │                      ⚠️ dotenv path: ../../.env (project root)
│       ├── server.mock.js     Mock server (KHÔNG cần DB/Redis)
│       ├── config/
│       │   ├── database.js    Sequelize config
│       │   └── redis.js       Redis + KEYS helpers + TTL
│       ├── models/
│       │   ├── index.js       All models + associations (9 models)
│       │   ├── User.js        Coins, roses, gems, level, XP
│       │   ├── Role.js        14 roles seeded
│       │   └── Game.js        Room code, role_config JSONB
│       ├── middleware/
│       │   ├── auth.js        JWT authenticate + requireAdmin + socketAuth
│       │   └── errorHandler.js Zod validation + general errors
│       ├── controllers/
│       │   └── authController.js  register/login/logout/refresh
│       ├── routes/
│       │   ├── index.js       Mount all routes
│       │   ├── authRoutes.js  ⚠️ Rate limit 100 req/15min (dev)
│       │   ├── userRoutes.js
│       │   ├── roleRoutes.js
│       │   └── gameRoutes.js
│       ├── socket/
│       │   ├── index.js       Socket.IO init + auth middleware + 3 handlers
│       │   ├── lobbyHandler.js join/leave/start → GameEngine integration
│       │   ├── chatHandler.js  send/receive + system messages
│       │   └── gameHandler.js  ⭐ Night actions, vote, hunter shot, reconnect
│       └── game/              ⭐ GAME ENGINE
│           ├── GameEngine.js   Vòng lặp chính (381 lines)
│           │                   start → role assign → night → dawn → discuss → vote → loop
│           │                   Win checks, Hunter shot, Jester win, timer management
│           ├── GameState.js    Redis state manager (170 lines)
│           │                   get/update/setPlayers/getNightAction/setVote/destroy
│           ├── RoleAssigner.js Gán vai ngẫu nhiên (148 lines)
│           │                   DEFAULT_CONFIGS cho 4-16 người, ROLE_INFO, Fisher-Yates shuffle
│           └── phases/
│               ├── NightPhase.js   Resolve đêm (181 lines)
│               │                   wolf_kill → seer_check → doctor_save → witch → bodyguard → SK
│               │                   Bodyguard sacrifice, doctor consecutive-save check
│               ├── DayPhase.js     Generate dawn messages (63 lines)
│               ├── DiscussPhase.js Discussion duration constant (7 lines)
│               └── VotePhase.js    Vote resolution (103 lines)
│                                   Mayor x2, tie detection, Jester, Hunter trigger
│
└── frontend/              ✅ npm installed, build OK
    ├── package.json       (type: module)
    ├── vite.config.js     (proxy /api + /socket.io → :5000)
    ├── tailwind.config.js (custom wolf dark theme)
    ├── index.html         (SEO meta, Google Fonts: Outfit + Inter)
    └── src/
        ├── main.jsx       React entry + Toaster config
        ├── App.jsx        Router: / → Lobby, /login, /register, /game/:id, /profile/:username
        ├── index.css      Tailwind + custom classes (btn-primary, card, input-field...)
        ├── store/
        │   ├── authStore.js   Zustand + persist + axios interceptors (auto-refresh)
        │   └── socketStore.js Zustand Socket.IO
        │                      nightAction(type, targetId), vote(targetId), sendMessage()
        └── pages/
            ├── LoginPage.jsx    ✅ Wolf logo, purple gradient, animated
            ├── RegisterPage.jsx ✅ 4 fields, validation
            ├── LobbyPage.jsx    ⭐ REDESIGNED: Wolvesville-style 3-column dashboard
            │                    Home view: sidebar nav / wolf center / stats+quests right
            │                    Room view: player list + room code + start button
            │                    Roles grid: 14 cards, team-colored
            ├── GamePage.jsx     ⭐ FULL GAME UI (21KB)
            │                    3-panel: players(left) / actions+events(center) / chat(right)
            │                    Phase-aware gradient backgrounds (night=indigo, discuss=teal, vote=rose)
            │                    Night action prompts, vote buttons, seer results, hunter shot
            │                    Game end: role reveal grid
            ├── ProfilePage.jsx  ✅ Stats + ELO + bio
            └── NotFoundPage.jsx ✅ 404 wolf page
```

---

## 🔑 THÔNG TIN KỸ THUẬT QUAN TRỌNG

### Ports
| Service | Port |
|---|---|
| Frontend (Vite) | 3000 |
| Backend (Express) | 5000 |
| PostgreSQL | 5432 |
| Redis | 6379 |

### Environment Variables (`.env` ở root, KHÔNG phải backend/)
```env
DB_NAME=wolvesville_vn
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
JWT_SECRET=wolvesville_vn_jwt_secret_dev_2026
REFRESH_TOKEN_SECRET=wolvesville_vn_refresh_secret_dev_2026
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

> ⚠️ **QUAN TRỌNG**: `server.js` load dotenv với path `../../.env` (từ `src/` ra `root/`). Đây là fix đã áp dụng trong session #3.

### API Endpoints đã implement
```
POST /api/v1/auth/register     (rate limited, 100/15min dev)
POST /api/v1/auth/login        (rate limited)
POST /api/v1/auth/logout       (auth required)
POST /api/v1/auth/refresh      (cookie refresh_token)
GET  /api/v1/users/me          (auth)
PUT  /api/v1/users/me          (auth)
GET  /api/v1/users/:username
GET  /api/v1/users/leaderboard
GET  /api/v1/roles
GET  /api/v1/roles/:slug
POST /api/v1/games/rooms       (auth — tạo phòng)
GET  /api/v1/games/rooms/:code
GET  /api/v1/games/:id
GET  /health
```

### Socket.IO Events đã implement
```
CLIENT→SERVER:
  lobby:join, lobby:leave, lobby:start
  chat:send
  game:night_action    { action_type, target_id }
  game:vote            { target_id }
  game:hunter_shot     { target_id }
  game:request_state   (reconnect)

SERVER→CLIENT:
  connected, error
  lobby:joined, lobby:updated, lobby:player_joined, lobby:player_left, lobby:countdown
  game:started, game:init, game:role_assigned, game:wolf_team
  game:phase_change    { phase, round, duration, message, deaths?, voteTargets? }
  game:timer           { duration, endAt }
  game:night_action_prompt  { roleSlug, actionType, actionLabel, targets[] }
  game:action_confirmed
  game:vote_update     { votedPlayerIds, totalVotes }
  game:vote_confirmed
  game:vote_result     { voteCounts, votedOutPlayer, isTie, jesterWin, events[] }
  game:seer_result     { targetId, targetUsername, aura }
  game:hunter_shot_prompt  { targets[], duration, message }
  game:hunter_shot_result
  game:ended           { winningTeam, reason, roleReveal[] }
  game:state_sync      (reconnect response)
  chat:message
```

---

## ⚡ VIỆC CẦN LÀM TIẾP THEO (Session #4)

### 🔴 Ưu tiên #1: Multiplayer End-to-End Test
- Mở browser + chạy bot-players.js → test 4 người chơi full flow
- Fix bug: bots chỉ join nhưng chưa test game engine start thành công
- Debug: rate limiter đã tăng lên 100, cần verify game engine chạy đúng với DB thật
- Verify: Seer nhận aura, Doctor cứu, Wolf giết, Vote treo cổ, Win condition

### 🔴 Ưu tiên #2: UI Improvements
- GamePage: thêm circular seat arrangement (hình tròn như Wolvesville)
- LobbyPage: thêm animation cho wolf avatar ở giữa
- Thêm sound effects / visual transitions giữa các phase
- Improve mobile responsiveness

### 🟡 Ưu tiên #3: Game Logic Mở Rộng
- Fix: Game cần tối thiểu 4 người (hiện lobby check 2, cần sửa về 4)
- Implement: Detective investigate (xem ai visit ai)
- Implement: Cupid lovers (2 người yêu, 1 chết thì cả 2 chết)
- Implement: Serial Killer immunity (SK không bị sói giết)
- Lưu kết quả game vào PostgreSQL (game_players, game_actions)

### 🟢 Ưu tiên #4: Features Mới
- Shop page (mua vật phẩm với coins/gems)
- Leaderboard page (ELO ranking)
- Friend system (add/accept/reject)
- Matchmaking queue (quick play)

---

## 🎨 DESIGN SYSTEM

### Tailwind Custom Classes
```css
.btn-primary    — Wolf purple gradient, hover lift
.btn-danger     — Blood red
.btn-ghost      — Border only
.card           — Dark glassmorphism
.card-hover     — Card + hover lift + glow border
.input-field    — Dark input with focus ring
.badge-village  — Xanh lá (phe Dân Làng)
.badge-wolf     — Đỏ (phe Sói)
.badge-solo     — Vàng (phe Độc Lập)
.text-gradient  — Purple → Red gradient text
.glass          — White glassmorphism panel
```

### Color Palette
- Wolf Purple: `#7c3aed` (wolf-500)
- Blood Red: `#f43f5e` (blood-500)
- Wolvesville Pink: `#F05A88` (dùng cho CHƠI button, theo reference)
- Dark BG: `#0a0515` (dark-950)
- Card BG: `#1a1035` (dark-800)

### Game Phase Colors (GamePage gradient backgrounds)
- Night: `from-indigo-950 to-slate-950` + accent `#6366f1`
- Dawn: `from-amber-950 to-orange-950` + accent `#f59e0b`
- Discuss: `from-emerald-950 to-teal-950` + accent `#10b981`
- Vote: `from-rose-950 to-red-950` + accent `#f43f5e`

---

## 🐛 VẤN ĐỀ ĐÃ GẶP & GIẢI QUYẾT

| Vấn đề | Giải pháp |
|---|---|
| Frontend trắng ở localhost:3000 | Vite server chưa chạy → `npm run dev` |
| Backend cần DB/Redis | Tạo `server.mock.js` — in-memory storage |
| `LobbyPage.jsx` bị mất | Recreate file (xảy ra khi build fail cắt ngang) |
| `"type": "module"` warning | Thêm vào `frontend/package.json` |
| JWT secretOrPrivateKey error | `.env` load sai path → fix `dotenv({ path: '../../.env' })` |
| Port 5000 EADDRINUSE | Kill process: `Get-NetTCPConnection -LocalPort 5000 \| Stop-Process` |
| Rate limit lockout (10/15min) | Tăng lên 100 cho dev mode |

---

## 📊 DATABASE

### 17 bảng PostgreSQL (đã seed):
```
users, user_stats, user_inventory, user_friends, user_blocks,
roles (14 seed), items (11 seed),
games, game_players, game_actions, game_messages,
clans, clan_members, transactions, notifications,
battle_passes, reports
```

### Redis Keys (real-time game state):
```
game:{id}:state         → JSON (phase, round, timer, alivePlayers[], deadPlayers[])
game:{id}:players       → HASH (playerId → {roleSlug, team, aura, isAlive, seatNumber, roleData})
game:{id}:votes         → HASH (voterId → targetId)
game:{id}:night_actions → HASH (playerId → {actionType, targetId})
lobby:{id}              → JSON (players[], host_id)
session:{userId}        → HASH (socket_id, status, game_id, last_seen)
blacklist:token:{token} → "1" (TTL 15min)
```

---

## 🎮 GAME ENGINE CHI TIẾT

### Vòng lặp game:
```
lobby:start → GameEngine.start()
  → RoleAssigner.assignRoles() — Fisher-Yates shuffle
  → game:role_assigned (private, mỗi người nhận vai riêng)
  → game:init (public, danh sách ghế)
  → game:wolf_team (private, phe Sói biết đồng đội)
  → startNightPhase()
    → sendNightActionPrompts() — gửi targets cho từng vai
    → Timer 45s → endNightPhase()
      → resolveNight() — theo priority:
        1. Wolf vote → wolf target
        2. Seer check → aura result
        3. Doctor save → cancel wolf kill
        4. Bodyguard protect → sacrifice
        5. Witch heal/poison
        6. Serial Killer kill
      → checkWinCondition()
  → startDawnPhase() — thông báo ai chết (10s)
  → startDiscussPhase() — chat public (60s)
  → startVotePhase() — bỏ phiếu (30s)
    → resolveVotes()
      → Mayor vote x2
      → Jester win check
      → Hunter death → hunterShot (10s)
    → checkWinCondition()
  → round++ → startNightPhase() [LOOP]

Win conditions:
  - Village wins: tất cả Sói chết (+ SK chết)
  - Werewolf wins: số Sói >= số còn lại
  - Jester wins: bị vote treo cổ
  - Serial Killer wins: là người sống cuối cùng
```

### RoleAssigner DEFAULT_CONFIGS:
```
4 players:  1 sói, 1 seer, 1 doctor, 1 villager
6 players:  2 sói, 1 seer, 1 doctor, 2 villager
8 players:  2 sói, 1 seer, 1 doctor, 1 witch, 1 hunter, 2 villager
10 players: 2 sói + 1 alpha, 1 seer, 1 doctor, 1 witch, 1 hunter, 1 bodyguard, 2 villager
12 players: 2 sói + 1 alpha, 1 seer, 1 doctor, 1 witch, 1 hunter, 1 bodyguard, 1 detective, 1 jester, 2 villager
16 players: 3 sói + 1 alpha, 1 seer, 1 doctor, 1 witch, 1 hunter, 1 bodyguard, 1 detective, 1 mayor, 1 jester, 1 SK, 3 villager
```

---

## 🎭 VAI TRÒ GAME ĐÃ SEED (14 vai)

**Phe Dân Làng (Village)**: Dân Làng, Tiên Tri, Bác Sĩ, Thợ Săn, Phù Thủy, Vệ Sĩ, Thám Tử, Thị Trưởng
**Phe Sói (Werewolf)**: Sói Thường, Alpha Sói, Sói Tiên Tri
**Phe Độc Lập (Solo)**: Kẻ Hề, Kẻ Giết Người Hàng Loạt, Thần Tình Yêu

---

## 📝 QUYẾT ĐỊNH KỸ THUẬT ĐÃ CHỐT

1. **Không dùng TypeScript** ban đầu (tốc độ develop, có thể migrate sau)
2. **Game state lưu Redis** (ephemeral) — lịch sử lưu PostgreSQL (persistent)
3. **server.mock.js** dùng in-memory array thay DB — đủ để demo/dev
4. **Socket.IO rooms**: mỗi game = `game:{gameId}` room; kênh wolf = `game:{gameId}:wolf`
5. **JWT**: Access token 15 phút + Refresh token 7 ngày (HttpOnly cookie)
6. **Tailwind dark theme**: wolf-500 (#7c3aed) làm màu chính
7. **Game state server-authoritative**: client chỉ nhận thông tin cần thiết (không lộ role người khác)
8. **Lobby redesign**: 3-column layout theo Wolvesville.com (left nav / center content / right stats)
9. **dotenv path**: `../../.env` trong server.js (vì .env nằm ở project root, không phải backend/)

---

*File này thay thế cho "bộ nhớ" giữa các session. Đọc file này TRƯỚC KHI đọc bất kỳ file nào khác trong session mới.*



# 📈 TIẾN ĐỘ DỰ ÁN — WOLVESVILLE VIỆT NAM

> **Cập nhật file này sau MỖI session Claude Code.**
> Đây là nguồn thông tin chính để tiếp tục công việc giữa các session.

---

## 📅 SESSION LOG

### Session #1 — 2026-05-29
**Người thực hiện**: Antigravity (AI Assistant)
**Thời gian**: ~1 giờ

**Đã làm**:
- [x] Nghiên cứu website Wolvesville gốc (wolvesville.com)
- [x] Tạo thư mục `.claude/` với 7 file tài liệu
- [x] Viết `CLAUDE.md` — context file chính
- [x] Viết `PROJECT_OVERVIEW.md` — tổng quan dự án
- [x] Viết `DATABASE_SCHEMA.md` — schema đầy đủ (PostgreSQL + Redis)
- [x] Viết `GAME_ROLES.md` — 50+ vai trò tiếng Việt
- [x] Viết `TECH_STACK.md` — stack công nghệ & lý do chọn
- [x] Viết `FEATURES.md` — 95 tính năng chia 4 phase
- [x] Viết `API_DESIGN.md` — REST API & Socket.IO events
- [x] Viết `PROGRESS.md` — file này

### Session #2 — 2026-05-29
**Người thực hiện**: Antigravity (AI Assistant)
**Thời gian**: ~2 giờ

**Đã làm**:
- [x] **Infrastructure**: `docker-compose.yml` (postgres, redis, backend, frontend)
- [x] **Database**: `database/schema.sql` — Full PostgreSQL schema với:
  - 15 bảng đầy đủ (users, roles, games, game_players, game_messages, items, ...)
  - Indexes, constraints, triggers (auto update_at)
  - Seed data: 14 vai trò game + 11 items mặc định
- [x] **Backend** (`/backend`):
  - `package.json` — tất cả dependencies
  - `Dockerfile`
  - `src/server.js` — Express + Socket.IO + middleware
  - `src/config/database.js` — Sequelize config
  - `src/config/redis.js` — Redis client + key helpers
  - `src/models/` — User, Role, Game, index.js (all models + associations)
  - `src/middleware/auth.js` — JWT auth + socket auth middleware
  - `src/middleware/errorHandler.js` — Global error handler
  - `src/controllers/authController.js` — register/login/logout/refresh
  - `src/routes/` — index, authRoutes, userRoutes, roleRoutes, gameRoutes
  - `src/socket/` — index.js, lobbyHandler.js, chatHandler.js
  - `.sequelizerc` — Sequelize CLI config
  - ✅ `npm install` thành công (347 packages)
- [x] **Frontend** (`/frontend`):
  - `package.json` — React 18 + Vite 5 + Tailwind + Zustand + Socket.IO
  - `Dockerfile`
  - `vite.config.js` — proxy config
  - `tailwind.config.js` — custom wolf dark theme
  - `postcss.config.js`
  - `index.html` — SEO meta tags, Google Fonts
  - `src/index.css` — Tailwind + custom component classes
  - `src/main.jsx` — React entry + Toaster
  - `src/App.jsx` — Router + ProtectedRoute
  - `src/store/authStore.js` — Zustand auth + axios interceptors
  - `src/store/socketStore.js` — Zustand Socket.IO store
  - `src/pages/LoginPage.jsx` — Trang đăng nhập
  - `src/pages/RegisterPage.jsx` — Trang đăng ký
  - `src/pages/LobbyPage.jsx` — Lobby + room management
  - `src/pages/GamePage.jsx` — Placeholder game screen
  - `src/pages/ProfilePage.jsx` — Trang hồ sơ
  - `src/pages/NotFoundPage.jsx` — 404 page
  - ✅ `npm install` thành công (359 packages)
- [x] `.env` và `.env.example` đã tạo

**Chưa làm** (để session tiếp theo):
- [ ] Sequelize migrations (thay vì dùng schema.sql trực tiếp)
- [ ] Shop API & UI
- [ ] Friends & Social features
- [ ] Clan system

### Session #3 — 2026-05-30
**Người thực hiện**: Antigravity (AI Assistant)
**Thời gian**: ~3 giờ

**Đã làm**:
- [x] **Docker**: Khởi động PostgreSQL + Redis containers (17 bảng, 14 roles seeded)
- [x] **Fix dotenv**: server.js load `.env` từ project root (`../../.env`)
- [x] **Fix rate limiter**: tăng từ 10 lên 100 requests/15min cho dev mode
- [x] **Game Engine Backend** — 7 file mới:
  - `src/game/GameEngine.js` (381 lines) — Vòng lặp chính, timer, win condition
  - `src/game/GameState.js` (170 lines) — Redis state CRUD
  - `src/game/RoleAssigner.js` (148 lines) — Gán vai Fisher-Yates, 6 preset configs
  - `src/game/phases/NightPhase.js` (181 lines) — Wolf→Seer→Doctor→Witch→Bodyguard→SK
  - `src/game/phases/DayPhase.js` (63 lines) — Dawn announcements
  - `src/game/phases/DiscussPhase.js` (7 lines) — Duration constant
  - `src/game/phases/VotePhase.js` (103 lines) — Mayor x2, Jester, Hunter trigger
- [x] **Socket Handlers**:
  - `src/socket/gameHandler.js` — night_action, vote, hunter_shot, reconnect
  - Updated `src/socket/index.js` — register gameHandler
  - Updated `src/socket/lobbyHandler.js` — integrate GameEngine on lobby:start
- [x] **LobbyPage.jsx** — REDESIGNED: Wolvesville-style 3-column dashboard
  - Left: nav sidebar (CHƠI, VAI TRÒ, VÀO PHÒNG)
  - Center: wolf animation / roles grid
  - Right: user card, stats, daily quests
- [x] **GamePage.jsx** — Full game UI (21KB):
  - 3-panel: seats(left) / actions+events(center) / chat(right)
  - Phase-aware gradient backgrounds
  - Night actions, vote, hunter shot, seer results, role reveal
- [x] **Bot Testing**: `backend/test/bot-players.js` — 3 bots auto-play
- [x] **Test accounts**: testplayer1, wolfbot2, wolfbot3, wolfbot4
- [x] **E2E tested**: Register → Login → Lobby → Create Room → Game phases cycling

**Chưa làm** (để session tiếp theo):
- [x] ~~Full multiplayer E2E test (bots + human player)~~ → Done in Session #4!
- [ ] Lưu kết quả game vào PostgreSQL
- [ ] Shop, Friends, Leaderboard UI
- [ ] Mobile responsive

### Session #4 — 2026-05-30
**Người thực hiện**: Antigravity (AI Assistant)
**Thời gian**: ~1.5 giờ

**Đã làm**:
- [x] **MULTIPLAYER E2E TEST**: 2/2 games passed with 4 automated players
- [x] **Full Game Test Script**: `backend/test/full-game-test.js`
  - Tự tạo room, login 4 players, join, start, play to completion
  - Staggered connections (2.5s) to avoid race conditions
  - Verbose logging for all game events
- [x] **Bug Fixes**:
  - Fixed LobbyPage navigating to GamePage on lobby:join instead of game:init
  - Fixed start button showing wrong minimum player count
  - Added debug logging to lobbyHandler for tracing join events
- [x] **Timer Reduction** (dev mode):
  - Night: 45s → 15s
  - Dawn: 10s → 5s
  - Discuss: 60s → 20s
  - Vote: 30s → 15s
- [x] **Bot Script v2**: Enhanced `bot-players.js` with error logging, stagger delay
- [x] **Updated memory.md** and **PROGRESS.md**

**Test Results**:
- Game #1: testplayer1=Doctor, wolfbot4=🐺Werewolf → Werewolf wins
- Game #2: testplayer1=🐺Werewolf, wolfbot3=Doctor → Werewolf wins
- All phases verified: Night→Dawn→Discuss→Vote→Win

**Chưa làm** (để session tiếp theo):
- [ ] Lưu kết quả game vào PostgreSQL (game_players table)
- [ ] Test với 6-8 players (thêm vai: witch, hunter, bodyguard)
- [ ] Browser visual test (fix viewport issue)
- [ ] Circular seat arrangement
- [ ] Phase transition animations

### Session #5 — 2026-05-30
**Người thực hiện**: Antigravity (AI Assistant)
**Thời gian**: ~1.5 giờ

**Đã làm**:
- [x] **Tạo Bot Button**: Thêm button "Tạo bot" với logic click 1 lần kèm modal xác nhận.
- [x] **Bot AI (BotBrain.js)**: Module AI chiến thuật điều khiển hành động đêm và bỏ phiếu ban ngày.
- [x] **Random Seating**: Spin/shuffle vị trí ghế ngẫu nhiên khi vào ván game thực tế.
- [x] **Single-Player Validation**: Xác minh hoàn chỉnh E2E game với 1 người và 3 bots tự động chơi thông minh.

### Session #6 — 2026-05-31
**Người thực hiện**: Antigravity (AI Assistant)
**Thời gian**: ~2 giờ

**Đã làm**:
- [x] **UI & Gameplay Sync**:
  - Hold/Hover Role Badge Popover.
  - RIP Gravestone SVGs (hiển thị vai trò đã chết).
  - Animation bong bóng chat và thông báo treo cổ.
  - Phase theme auto switch (Đêm tối, Ngày sáng).
  - Tắt biểu tượng role khi cả phe chết.

### Session #7 — 2026-06-02
**Người thực hiện**: Antigravity (AI Assistant)
**Thời gian**: ~1 giờ

**Đã làm**:
- [x] **E2E Testing (baocaotest.md)**: Pass toàn bộ hệ thống test 4 người, logic các vai trò mới (Seer, Thám tử, Cai ngục, Hỏa tặc, Xạ thủ, Phù thủy, Vệ sĩ).
- [x] **Role Effects (hieuung.md)**: Implement toàn bộ hiệu ứng chiêu thức (Framer Motion). Lửa cháy Arsonist, khiên xoay Bodyguard, lazer Thám tử, cung tên Hunter.
- [x] **UI Updates**: Vote pointer `🫵` đè hiệu ứng đêm; Fix lỗi UI (Ghost game clear, reputation system logic, tie logic).

---

## 🎯 TRẠNG THÁI TỔNG QUAN

```
Phase 1 (MVP):     █████████░  90% (Auth, Lobby, Game Engine TESTED, Game UI done)
Phase 2:           ░░░░░░░░░░  0%
Phase 3:           ░░░░░░░░░░  0%
Phase 4:           ░░░░░░░░░░  0%
Tài liệu .claude:  ██████████  100% ✅
Backend base:      ██████████  100% ✅
Game Engine:       █████████░  90% ✅
Frontend base:     ██████████  100% ✅
Game UI:           █████████░  90% ✅
Database schema:   ██████████  100% ✅
Docker infra:      ██████████  100% ✅
```

---

## 🗂️ TRẠNG THÁI CÁC FILE DỰ ÁN

### Thư mục `.claude/` (Tài liệu)
| File | Trạng thái |
|------|------------|
| `CLAUDE.md` | ✅ Hoàn thành |
| `PROJECT_OVERVIEW.md` | ✅ Hoàn thành |
| `DATABASE_SCHEMA.md` | ✅ Hoàn thành |
| `GAME_ROLES.md` | ✅ Hoàn thành |
| `TECH_STACK.md` | ✅ Hoàn thành |
| `FEATURES.md` | ✅ Hoàn thành |
| `API_DESIGN.md` | ✅ Hoàn thành |
| `PROGRESS.md` | ✅ Hoàn thành |

### Backend (`/backend`)
| Thành phần | Trạng thái |
|------------|------------|
| Khởi tạo project | ✅ Xong |
| Config Express + Socket.IO | ✅ Xong |
| Config Database (Sequelize) | ✅ Xong |
| Config Redis | ✅ Xong |
| Models (User, Role, Game, ...) | ✅ Xong |
| Auth middleware (JWT) | ✅ Xong |
| Error handler middleware | ✅ Xong |
| Auth routes (register/login/logout/refresh) | ✅ Xong |
| User routes (me, profile, leaderboard) | ✅ Xong |
| Role routes (list, detail) | ✅ Xong |
| Game routes (create room, join, get) | ✅ Xong |
| Socket.IO init + auth | ✅ Xong |
| Lobby handler (join/leave/start) | ✅ Xong |
| Chat handler (send/receive) | ✅ Xong |


## 📈 TIẾN TRÌNH CHI TIẾT

### Backend (`/backend`)
| Thành phần | Trạng thái |
|------------|------------|
| Khởi tạo project (express, socket) | ✅ Xong |
| Kết nối DB PostgreSQL (Sequelize) | ✅ Xong |
| Kết nối Redis (cấu hình key/ttl) | ✅ Xong |
| Auth controller & routes | ✅ Xong |
| Chat controller & socket handler | ✅ Xong |
| Lobby controller & socket handler | ✅ Xong |
| **Thêm/Xóa Bot ảo socket events** | ✅ Xong |
| **Game handler (night/vote/hunter)** | ✅ Xong |
| **Game Engine (GameEngine.js)** | ✅ Xong |
| **GameState (Redis)** | ✅ Xong |
| **RoleAssigner** | ✅ Xong |
| **NightPhase logic** | ✅ Xong |
| **DayPhase / DiscussPhase** | ✅ Xong |
| **VotePhase logic** | ✅ Xong |
| **Smart AI (BotBrain.js)** | ✅ Xong |
| **Bot test script** | ✅ Xong |

### Frontend (`/frontend`)
| Thành phần | Trạng thái |
|------------|------------|
| Khởi tạo React + Vite | ✅ Xong |
| Tailwind custom theme (wolf dark) | ✅ Xong |
| Global CSS + component classes | ✅ Xong |
| Zustand auth store + axios | ✅ Xong |
| Zustand socket store | ✅ Xong |
| React Router + Protected routes | ✅ Xong |
| Trang Login/Register | ✅ Xong |
| Trang Lobby (home + room view) | ✅ Xong |
| Trang Profile | ✅ Xong |
| **LobbyPage redesign (Wolvesville-style)** | ✅ Xong |
| **GamePage full UI (3-panel)** | ✅ Xong |
| Shop UI | ⬜ Chưa làm |
| Friends UI | ⬜ Chưa làm |
| Leaderboard UI | ⬜ Chưa làm |

### Infrastructure
| Thành phần | Trạng thái |
|------------|------------|
| `docker-compose.yml` | ✅ Xong |
| `.env.example` | ✅ Xong |
| `.env` (dev) | ✅ Xong |
| `database/schema.sql` | ✅ Xong (17 bảng, 14 roles, 11 items) |
| Docker PostgreSQL + Redis | ✅ Tested & Running |
| `README.md` | ⬜ Chưa làm |

---

## 🔢 THỐNG KÊ NHANH

| Hạng mục | Tổng | Xong | Còn lại |
|----------|------|------|---------|
| Tài liệu | 9 | 9 | 0 |
| Tính năng Phase 1 | 30 | 24 | 6 |
| Tính năng Phase 2 | 25 | 0 | 25 |
| Tính năng Phase 3 | 20 | 0 | 20 |
| Tính năng Phase 4 | 20 | 0 | 20 |

---

## 🚀 TASK CHO SESSION TIẾP THEO (Session #6)

### Ưu tiên cao — Làm ngay:
```
1. docker-compose up -d postgres redis
2. cd backend && npm run dev
3. cd frontend && npm run dev
4. Lưu kết quả game vào PostgreSQL (game_players, game_actions) sau khi ván game kết thúc
5. Improve GamePage: circular seat arrangement
6. Thêm sound effects / phase transition animations
```

### Ghi chú kỹ thuật:
- Port backend: **5000**, frontend: **3000**, PostgreSQL: **5432**, Redis: **6379**
- dotenv path: `../../.env` trong server.js
- Rate limit: 100/15min (dev mode)
- Test accounts: test1@game.com / bot2-4@test.com (password: test123456)

---

## 🐛 VẤN ĐỀ BIẾT TRƯỚC / RỦI RO

| Rủi ro | Mức độ | Cách giải quyết |
|--------|--------|-----------------|
| Real-time sync phức tạp khi nhiều người | Cao | Dùng Redis pub/sub + atomic operations |
| Game logic bị race condition | Cao | Xử lý tuần tự trong một vòng lặp game đơn |
| Cheating (xem role người khác) | Trung | Server-authoritative: chỉ gửi thông tin cần thiết ✅ ĐÃ IMPLEMENT |
| Scaling khi nhiều game đồng thời | Trung | Redis cho shared state, stateless API server |
| Mất kết nối giữa chừng | Thấp | Socket.IO auto-reconnect + game:request_state ✅ ĐÃ IMPLEMENT |
| JWT secret undefined | ĐÃ FIX | dotenv path fix: `../../.env` |
| Rate limit lockout | ĐÃ FIX | Tăng lên 100 cho dev mode |

---

## 📝 GHI CHÚ THÊM

*Template cập nhật: Thêm dòng mới vào "SESSION LOG" và cập nhật bảng trạng thái sau mỗi session.*

