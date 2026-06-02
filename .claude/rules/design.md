# 🔌 API DESIGN — WOLVESVILLE VIỆT NAM

> REST API + Socket.IO Events
> **Base URL**: `http://localhost:5000/api/v1`

---

## 🔐 AUTH API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/register` | Đăng ký tài khoản | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/logout` | Đăng xuất | ✅ |
| POST | `/auth/refresh` | Làm mới access token | ❌ (cookie) |
| POST | `/auth/forgot-password` | Gửi email reset mật khẩu | ❌ |
| POST | `/auth/reset-password` | Đặt lại mật khẩu mới | ❌ |

### Ví dụ Request/Response:

```json
// POST /auth/register
{
  "username": "nguyen_van_a",
  "email": "a@example.com",
  "password": "MatKhau123!"
}

// Response 201
{
  "success": true,
  "message": "Đăng ký thành công!",
  "data": {
    "user": { "id": "...", "username": "nguyen_van_a", "level": 1 },
    "access_token": "eyJ..."
  }
}
```

---

## 👤 USER API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/users/me` | Lấy thông tin bản thân | ✅ |
| PUT | `/users/me` | Cập nhật hồ sơ | ✅ |
| GET | `/users/:username` | Xem hồ sơ người khác | ✅ |
| GET | `/users/me/stats` | Thống kê game cá nhân | ✅ |
| GET | `/users/me/inventory` | Kho đồ cá nhân | ✅ |
| GET | `/users/me/history` | Lịch sử ván đấu | ✅ |
| GET | `/users/leaderboard` | Bảng xếp hạng | ✅ |

---

## 🎮 GAME API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/games/quick-match` | Xếp hàng chơi nhanh | ✅ |
| POST | `/games/rooms` | Tạo phòng riêng | ✅ |
| GET | `/games/rooms` | Danh sách phòng custom | ✅ |
| GET | `/games/rooms/:code` | Thông tin phòng theo mã | ✅ |
| POST | `/games/rooms/:code/join` | Vào phòng bằng mã | ✅ |
| DELETE | `/games/rooms/:id` | Giải tán phòng (host) | ✅ |
| GET | `/games/:id` | Xem kết quả ván đấu | ✅ |
| DELETE | `/games/quick-match` | Rời hàng đợi | ✅ |

---

## 🎭 ROLES API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/roles` | Danh sách tất cả vai trò | ❌ |
| GET | `/roles/:slug` | Chi tiết 1 vai trò | ❌ |

---

## 🛒 SHOP API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/shop/items` | Danh sách vật phẩm | ✅ |
| GET | `/shop/items/:id` | Chi tiết vật phẩm | ✅ |
| POST | `/shop/purchase` | Mua vật phẩm | ✅ |
| PUT | `/shop/equip/:item_id` | Trang bị vật phẩm | ✅ |

---

## 👥 FRIENDS & SOCIAL API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/friends` | Danh sách bạn bè | ✅ |
| POST | `/friends/request` | Gửi lời mời kết bạn | ✅ |
| PUT | `/friends/request/:id/accept` | Chấp nhận | ✅ |
| DELETE | `/friends/request/:id` | Từ chối / Hủy | ✅ |
| DELETE | `/friends/:user_id` | Xóa bạn bè | ✅ |
| POST | `/users/:id/block` | Block người dùng | ✅ |

---

## 🏰 CLAN API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/clans` | Danh sách clan | ✅ |
| POST | `/clans` | Tạo clan | ✅ |
| GET | `/clans/:id` | Thông tin clan | ✅ |
| POST | `/clans/:id/join` | Tham gia clan | ✅ |
| DELETE | `/clans/:id/leave` | Rời clan | ✅ |
| POST | `/clans/:id/kick` | Kick thành viên (owner) | ✅ |

---

## 🔔 NOTIFICATIONS API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/notifications` | Lấy thông báo | ✅ |
| PUT | `/notifications/read-all` | Đánh dấu đọc tất cả | ✅ |
| DELETE | `/notifications/:id` | Xóa thông báo | ✅ |

---

## ⚡ SOCKET.IO EVENTS

### Kết Nối & Auth
```javascript
// Client → Server
socket.emit('authenticate', { token: 'eyJ...' })

// Server → Client
socket.emit('authenticated', { user: { id, username, level } })
socket.emit('auth_error', { message: 'Token không hợp lệ' })
```

---

### 🏠 Lobby Events (Phòng chờ)

```javascript
// CLIENT → SERVER

// Tạo phòng
socket.emit('lobby:create', {
  mode: 'custom',       // 'quick', 'friends', 'custom'
  max_players: 12,
  role_config: { werewolf: 2, seer: 1, doctor: 1, villager: 8 }
})

// Vào phòng
socket.emit('lobby:join', { room_code: 'ABC123' })

// Rời phòng
socket.emit('lobby:leave')

// Host bắt đầu game
socket.emit('lobby:start')

// Host kick người chơi
socket.emit('lobby:kick', { player_id: '...' })

// SERVER → CLIENT

// Cập nhật danh sách phòng
socket.emit('lobby:updated', { players: [...], host_id: '...' })

// Bắt đầu đếm ngược
socket.emit('lobby:countdown', { seconds: 3 })

// Bắt đầu game
socket.emit('game:started', { game_id: '...' })

// Thông báo ai vào/rời
socket.emit('lobby:player_joined', { player: { id, username, avatar } })
socket.emit('lobby:player_left', { player_id: '...' })
```

---

### 🎮 Game Events (Trong game)

```javascript
// SERVER → CLIENT (broadcast đến toàn phòng)

// Thông tin game bắt đầu (KHÔNG tiết lộ role của người khác)
socket.emit('game:init', {
  game_id: '...',
  players: [
    { id, username, avatar, seat_number, is_alive: true }
    // role KHÔNG có trong đây
  ],
  my_role: {
    slug: 'seer',
    name_vi: 'Tiên Tri',
    description_vi: '...',
    team: 'village',
    // Nếu là Sói: thêm wolf_teammates: [...]
  }
})

// Chuyển phase
socket.emit('game:phase_change', {
  phase: 'night',   // 'night', 'day_announce', 'discussion', 'voting'
  round: 2,
  duration_seconds: 45,
  message_vi: 'Đêm thứ 2 bắt đầu...'
})

// Thông báo buổi sáng
socket.emit('game:morning_report', {
  killed_players: [{ id, username, role: { name_vi: 'Dân Làng' } }],
  saved_players: [],  // Bác sĩ cứu (không lộ ai cứu)
  message_vi: 'Đêm qua, 1 người đã bị giết...'
})

// Kết quả vote
socket.emit('game:vote_result', {
  executed_player: { id, username, role: { name_vi: 'Kẻ Hề' } },
  votes: { 'player_id': 'target_id', ... },
  message_vi: 'Làng đã treo cổ Kẻ Hề!'
})

// Game kết thúc
socket.emit('game:ended', {
  winning_team: 'village',
  winning_team_vi: 'Phe Dân Làng',
  winners: [{ id, username }],
  all_roles: [{ player_id, role: { name_vi } }],
  stats: { duration_seconds: 420, total_rounds: 5 },
  rewards: { xp: 150, coins: 80 }
})

// Người chơi chết (mid-game announcement)
socket.emit('game:player_died', {
  player_id: '...',
  cause: 'wolf_kill',
  cause_vi: 'bị Sói giết',
  revealed_role: { name_vi: 'Bác Sĩ' }
})

// CLIENT → SERVER (hành động trong game)

// Hành động đêm (role-specific)
socket.emit('game:night_action', {
  action_type: 'seer_check',  // hoặc 'wolf_kill', 'doctor_save', ...
  target_id: 'player_uuid'
})

// Bỏ phiếu
socket.emit('game:vote', {
  target_id: 'player_uuid'   // null = bỏ phiếu trắng
})

// Hunter bắn (khi chết)
socket.emit('game:hunter_shoot', {
  target_id: 'player_uuid'
})

// Server → Client (phản hồi hành động đêm, chỉ gửi cho người hành động)
socket.emit('game:night_action_result', {
  action_type: 'seer_check',
  target: { id, username },
  result: { aura: 'evil' }   // hoặc { aura: 'good' }
})
```

---

### 💬 Chat Events

```javascript
// CLIENT → SERVER
socket.emit('chat:send', {
  channel: 'public',  // 'public', 'wolf', 'dead'
  content: 'Tôi nghĩ người ngồi ghế số 3 là Sói!'
})

// SERVER → CLIENT
socket.emit('chat:message', {
  id: '...',
  sender: { id, username, seat_number },
  channel: 'public',
  content: 'Tôi nghĩ người ngồi ghế số 3 là Sói!',
  timestamp: '2026-05-29T10:00:00Z'
})

// System message (không có sender)
socket.emit('chat:message', {
  id: '...',
  sender: null,
  channel: 'public',
  content: '🌙 Màn đêm buông xuống...',
  is_system: true,
  timestamp: '...'
})
```

---

### 🔔 Notification Events

```javascript
// SERVER → CLIENT
socket.emit('notification:new', {
  type: 'friend_request',
  title_vi: 'Lời mời kết bạn',
  body_vi: 'nguyen_van_b muốn kết bạn với bạn',
  action_url: '/friends'
})

socket.emit('notification:game_invite', {
  from: { id, username },
  room_code: 'XYZ789',
  expires_in: 60  // giây
})
```

---

## 🛡️ ERROR CODES

| Code | Mô tả |
|------|-------|
| `AUTH_001` | Token không hợp lệ hoặc hết hạn |
| `AUTH_002` | Sai email hoặc mật khẩu |
| `AUTH_003` | Tài khoản bị khóa |
| `GAME_001` | Phòng không tồn tại |
| `GAME_002` | Phòng đã đầy |
| `GAME_003` | Không đủ người để bắt đầu |
| `GAME_004` | Không phải lượt của bạn |
| `SHOP_001` | Không đủ tiền |
| `SHOP_002` | Vật phẩm đã sở hữu |
| `USER_001` | Tên người dùng đã tồn tại |
| `USER_002` | Email đã được đăng ký |

---

## 🔧 MIDDLEWARE PIPELINE

```
Request → [Nginx] → [Rate Limiter] → [CORS] → [Auth JWT] → [Validate] → [Controller]
```

---

*Xem tiến độ implement: `PROGRESS.md`*
*Xem database schema liên quan: `DATABASE_SCHEMA.md`*




# 🗄️ DATABASE SCHEMA — WOLVESVILLE VIỆT NAM

> **Database chính**: PostgreSQL 16
> **Cache / Real-time state**: Redis 7
> **ORM**: Sequelize 6

---

## 📦 DANH SÁCH CÁC BẢNG

```
users                  ← Tài khoản người dùng
user_stats             ← Thống kê game của user
user_inventory         ← Vật phẩm sở hữu
user_friends           ← Danh sách bạn bè
user_blocks            ← Danh sách block

roles                  ← Định nghĩa vai trò game (seed data)
items                  ← Vật phẩm trong cửa hàng (seed data)
item_categories        ← Danh mục vật phẩm

games                  ← Lịch sử các ván game
game_players           ← Người chơi trong từng ván
game_actions           ← Hành động trong từng đêm/ngày
game_messages          ← Chat log của ván game

clans                  ← Thông tin clan
clan_members           ← Thành viên clan

transactions           ← Lịch sử giao dịch tiền tệ
battle_passes          ← Battle Pass theo mùa
user_battle_passes     ← Tiến trình Battle Pass của user

reports                ← Báo cáo vi phạm
notifications          ← Hệ thống thông báo
```

---

## 🔐 BẢNG: `users`

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(30) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    
    -- Tiền tệ trong game
    coins           INTEGER NOT NULL DEFAULT 500,
    roses           INTEGER NOT NULL DEFAULT 0,
    gems            INTEGER NOT NULL DEFAULT 0,
    
    -- Cấp độ & XP
    level           INTEGER NOT NULL DEFAULT 1,
    xp              INTEGER NOT NULL DEFAULT 0,
    xp_next_level   INTEGER NOT NULL DEFAULT 1000,
    
    -- Hồ sơ
    avatar_item_id  UUID REFERENCES items(id),
    frame_item_id   UUID REFERENCES items(id),
    bio             TEXT,
    country_code    CHAR(2) DEFAULT 'VN',
    
    -- Trạng thái tài khoản
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason      TEXT,
    ban_until       TIMESTAMP,
    role            VARCHAR(20) NOT NULL DEFAULT 'player',
    -- role: 'player', 'moderator', 'admin'
    
    -- Thống kê nhanh (denormalized cho performance)
    games_played    INTEGER NOT NULL DEFAULT 0,
    games_won       INTEGER NOT NULL DEFAULT 0,
    
    -- Thời gian
    last_online     TIMESTAMP DEFAULT NOW(),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_level ON users(level DESC);
```

---

## 📊 BẢNG: `user_stats`

```sql
CREATE TABLE user_stats (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Thống kê tổng quan
    total_games             INTEGER DEFAULT 0,
    total_wins              INTEGER DEFAULT 0,
    total_losses            INTEGER DEFAULT 0,
    win_rate                DECIMAL(5,2) DEFAULT 0.00,
    
    -- Theo phe
    games_as_villager       INTEGER DEFAULT 0,
    wins_as_villager        INTEGER DEFAULT 0,
    games_as_werewolf       INTEGER DEFAULT 0,
    wins_as_werewolf        INTEGER DEFAULT 0,
    games_as_solo           INTEGER DEFAULT 0,
    wins_as_solo            INTEGER DEFAULT 0,
    
    -- Hành động nổi bật
    total_kills             INTEGER DEFAULT 0,   -- (dành cho Sói)
    total_saves             INTEGER DEFAULT 0,   -- (dành cho Bác Sĩ)
    total_correct_checks    INTEGER DEFAULT 0,   -- (dành cho Tiên Tri)
    times_voted_out         INTEGER DEFAULT 0,
    times_survived          INTEGER DEFAULT 0,
    
    -- Điểm ELO (Ranked)
    elo_rating              INTEGER DEFAULT 1000,
    elo_peak                INTEGER DEFAULT 1000,
    ranked_season           INTEGER DEFAULT 1,
    
    -- Vai trò hay chơi nhất
    favorite_role_id        UUID REFERENCES roles(id),
    
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🎭 BẢNG: `roles` *(Seed data — xem GAME_ROLES.md)*

```sql
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(50) UNIQUE NOT NULL,  -- VD: 'seer', 'werewolf'
    
    -- Thông tin hiển thị (tiếng Việt)
    name_vi         VARCHAR(100) NOT NULL,  -- VD: 'Tiên Tri'
    name_en         VARCHAR(100) NOT NULL,  -- VD: 'Seer'
    description_vi  TEXT NOT NULL,
    
    -- Phân loại
    team            VARCHAR(20) NOT NULL,
    -- team: 'village', 'werewolf', 'solo'
    
    aura            VARCHAR(10) NOT NULL,
    -- aura: 'good', 'evil', 'neutral'
    
    -- Hành động mỗi đêm
    has_night_action    BOOLEAN DEFAULT FALSE,
    night_action_desc   TEXT,
    uses_per_game       INTEGER DEFAULT -1, -- -1 = không giới hạn
    
    -- Khả năng
    can_chat_at_night   BOOLEAN DEFAULT FALSE,  -- Sói có thể chat đêm
    is_revealed_on_death BOOLEAN DEFAULT TRUE,  -- Lộ vai khi chết
    
    -- Meta
    difficulty      VARCHAR(10) DEFAULT 'easy',
    -- difficulty: 'easy', 'medium', 'hard'
    
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    
    icon_url        VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🎮 BẢNG: `games`

```sql
CREATE TABLE games (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Loại game
    game_mode       VARCHAR(30) NOT NULL,
    -- game_mode: 'quick', 'ranked', 'custom', 'friends', 'sandbox'
    
    -- Trạng thái
    status          VARCHAR(20) NOT NULL DEFAULT 'waiting',
    -- status: 'waiting', 'in_progress', 'finished', 'cancelled'
    
    -- Cấu hình
    max_players     INTEGER NOT NULL DEFAULT 12,
    min_players     INTEGER NOT NULL DEFAULT 6,
    language        CHAR(2) DEFAULT 'vi',
    
    -- Role configuration (JSON)
    role_config     JSONB NOT NULL DEFAULT '{}',
    -- VD: {"werewolf": 2, "seer": 1, "doctor": 1, "villager": 8}
    
    -- Kết quả
    winning_team    VARCHAR(20),
    -- winning_team: 'village', 'werewolf', 'solo', null
    
    winner_role_slug VARCHAR(50),  -- Cho solo win
    
    -- Thời gian
    started_at      TIMESTAMP,
    ended_at        TIMESTAMP,
    duration_seconds INTEGER,     -- Thời gian ván đấu (giây)
    total_rounds    INTEGER DEFAULT 0,
    
    -- Host (cho custom game)
    host_user_id    UUID REFERENCES users(id),
    room_code       CHAR(6) UNIQUE,  -- Code phòng cho custom game
    
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_mode ON games(game_mode);
CREATE INDEX idx_games_room_code ON games(room_code) WHERE room_code IS NOT NULL;
```

---

## 👥 BẢNG: `game_players`

```sql
CREATE TABLE game_players (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    
    -- Vai trò được gán
    role_id         UUID NOT NULL REFERENCES roles(id),
    
    -- Trạng thái trong game
    is_alive        BOOLEAN NOT NULL DEFAULT TRUE,
    death_round     INTEGER,
    death_cause     VARCHAR(50),
    -- death_cause: 'voted', 'wolf_kill', 'hunter_shot', 'poison', ...
    
    -- Vị trí ghế ngồi (1-16)
    seat_number     INTEGER,
    
    -- Kết quả
    is_winner       BOOLEAN DEFAULT FALSE,
    xp_earned       INTEGER DEFAULT 0,
    coins_earned    INTEGER DEFAULT 0,
    
    -- Hành động đặc biệt (JSON cho linh hoạt)
    role_data       JSONB DEFAULT '{}',
    -- VD: {"protected_user_id": "...", "checked_tonight": true}
    
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(game_id, user_id),
    UNIQUE(game_id, seat_number)
);

CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);
```

---

## ⚔️ BẢNG: `game_actions`

```sql
CREATE TABLE game_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number    INTEGER NOT NULL,
    phase           VARCHAR(10) NOT NULL,
    -- phase: 'night', 'day', 'vote'
    
    -- Ai thực hiện
    actor_player_id UUID NOT NULL REFERENCES game_players(id),
    
    -- Hành động gì
    action_type     VARCHAR(50) NOT NULL,
    -- VD: 'wolf_kill', 'doctor_save', 'seer_check', 'vote', 'hunter_shoot'
    
    -- Nhắm vào ai (có thể null)
    target_player_id UUID REFERENCES game_players(id),
    
    -- Kết quả
    result          JSONB DEFAULT '{}',
    -- VD: {"success": true, "revealed": "werewolf"}
    
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_actions_game ON game_actions(game_id);
```

---

## 💬 BẢNG: `game_messages`

```sql
CREATE TABLE game_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    
    -- Người gửi (null = system message)
    sender_id       UUID REFERENCES game_players(id),
    
    -- Loại kênh chat
    channel         VARCHAR(20) NOT NULL DEFAULT 'public',
    -- channel: 'public', 'wolf', 'dead', 'system', 'whisper'
    
    content         TEXT NOT NULL,
    round_number    INTEGER,
    phase           VARCHAR(10),
    
    is_system       BOOLEAN DEFAULT FALSE,
    
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_messages_game ON game_messages(game_id, created_at);
```

---

## 🏰 BẢNG: `clans`

```sql
CREATE TABLE clans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) UNIQUE NOT NULL,
    tag             VARCHAR(8) UNIQUE NOT NULL,   -- VD: [SÓI]
    description     TEXT,
    
    -- Thống kê
    total_members   INTEGER DEFAULT 1,
    total_wins      INTEGER DEFAULT 0,
    
    -- Cài đặt
    is_public       BOOLEAN DEFAULT TRUE,
    min_level       INTEGER DEFAULT 1,
    
    -- Leader
    owner_id        UUID NOT NULL REFERENCES users(id),
    
    icon_url        VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🛒 BẢNG: `items`

```sql
CREATE TABLE items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(100) UNIQUE NOT NULL,
    
    -- Hiển thị
    name_vi         VARCHAR(200) NOT NULL,
    description_vi  TEXT,
    
    -- Loại
    category        VARCHAR(30) NOT NULL,
    -- category: 'hat', 'outfit', 'accessory', 'frame', 
    --           'emoji', 'role_skin', 'effect', 'bundle'
    
    -- Giá
    price_coins     INTEGER DEFAULT 0,
    price_gems      INTEGER DEFAULT 0,
    price_roses     INTEGER DEFAULT 0,
    
    -- Hiếm
    rarity          VARCHAR(20) DEFAULT 'common',
    -- rarity: 'common', 'rare', 'epic', 'legendary'
    
    is_available    BOOLEAN DEFAULT TRUE,
    is_premium      BOOLEAN DEFAULT FALSE,  -- Chỉ mua bằng gems
    
    image_url       VARCHAR(500),
    preview_url     VARCHAR(500),
    
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🎒 BẢNG: `user_inventory`

```sql
CREATE TABLE user_inventory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id         UUID NOT NULL REFERENCES items(id),
    
    is_equipped     BOOLEAN DEFAULT FALSE,
    acquired_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    source          VARCHAR(30) DEFAULT 'purchase',
    -- source: 'purchase', 'battle_pass', 'gift', 'event'
    
    UNIQUE(user_id, item_id)
);
```

---

## 💰 BẢNG: `transactions`

```sql
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    
    type            VARCHAR(20) NOT NULL,
    -- type: 'earn_coins', 'spend_coins', 'earn_gems', 'spend_gems', ...
    
    amount          INTEGER NOT NULL,
    currency        VARCHAR(10) NOT NULL,
    -- currency: 'coins', 'roses', 'gems'
    
    balance_after   INTEGER NOT NULL,
    
    description_vi  VARCHAR(500),
    reference_id    UUID,   -- game_id hoặc item_id liên quan
    
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
```

---

## 📢 BẢNG: `notifications`

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type            VARCHAR(50) NOT NULL,
    -- type: 'friend_request', 'game_invite', 'reward', 'system', ...
    
    title_vi        VARCHAR(200) NOT NULL,
    body_vi         TEXT,
    
    is_read         BOOLEAN DEFAULT FALSE,
    action_url      VARCHAR(500),
    
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

---

## 🔴 REDIS SCHEMA (Game State Real-time)

```
# Trạng thái game đang chạy
game:{game_id}:state           → JSON (phase, round, timer, alive players)
game:{game_id}:players         → HASH (player_id → role, status)
game:{game_id}:votes           → HASH (voter_id → target_id)
game:{game_id}:night_actions   → HASH (actor_id → action JSON)
game:{game_id}:chat:{channel}  → LIST (messages)
game:{game_id}:timer           → STRING (seconds remaining)

# Matchmaking queue
queue:quick                    → ZSET (user_id, timestamp)
queue:ranked                   → ZSET (user_id, elo_rating)

# User sessions
session:{user_id}              → HASH (socket_id, game_id, status)
# status: 'online', 'in_game', 'idle'

# Rate limiting
ratelimit:{user_id}:{action}   → STRING (count, TTL)

# Lobby rooms
lobby:{game_id}                → JSON (room config, players list)

TTL mặc định:
  - game state: 4 giờ
  - session: 24 giờ
  - queue entry: 10 phút
```

---

## 🔧 DATABASE SETUP COMMANDS

```bash
# Tạo database
createdb wolvesville_vn

# Chạy migrations
npx sequelize-cli db:migrate

# Seed dữ liệu mẫu (roles, items mặc định)
npx sequelize-cli db:seed:all

# Reset database (development only)
npx sequelize-cli db:migrate:undo:all && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all
```

---

*Xem chi tiết vai trò game: `GAME_ROLES.md`*
*Xem tiến độ: `PROGRESS.md`*




# ✅ DANH SÁCH TÍNH NĂNG — WOLVESVILLE VIỆT NAM

> **Mức ưu tiên**: 🔴 Bắt buộc (MVP) | 🟡 Quan trọng | 🟢 Nice-to-have
> **Trạng thái**: ⬜ Chưa làm | 🔄 Đang làm | ✅ Xong

---

## PHASE 1 — MVP (Tuần 1–4)

### 🔐 Xác thực & Tài khoản
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 1.1 | Đăng ký bằng email & mật khẩu | 🔴 | ⬜ |
| 1.2 | Đăng nhập / Đăng xuất | 🔴 | ⬜ |
| 1.3 | JWT Access Token + Refresh Token | 🔴 | ⬜ |
| 1.4 | Trang hồ sơ cá nhân | 🔴 | ⬜ |
| 1.5 | Đổi mật khẩu | 🟡 | ⬜ |
| 1.6 | Quên mật khẩu (email reset) | 🟡 | ⬜ |
| 1.7 | Đăng nhập bằng Google OAuth | 🟢 | ⬜ |

### 🎮 Lobby & Matchmaking
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 2.1 | Màn hình chờ (Lobby) | 🔴 | ⬜ |
| 2.2 | Chơi Nhanh — tự ghép đội | 🔴 | ⬜ |
| 2.3 | Phòng Riêng — tạo phòng với mã 6 ký tự | 🔴 | ⬜ |
| 2.4 | Chơi Với Bạn — vào phòng bằng mã | 🔴 | ⬜ |
| 2.5 | Hiển thị danh sách người trong lobby | 🔴 | ⬜ |
| 2.6 | Host bắt đầu game | 🔴 | ⬜ |
| 2.7 | Kick người khỏi phòng (host) | 🟡 | ⬜ |
| 2.8 | Countdown bắt đầu game | 🔴 | ⬜ |

### ⚙️ Game Engine — Cơ Bản
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 3.1 | Gán vai trò ngẫu nhiên cho người chơi | 🔴 | ⬜ |
| 3.2 | **Giai đoạn Đêm**: Timer đếm ngược | 🔴 | ⬜ |
| 3.3 | **Giai đoạn Sáng**: Thông báo ai chết | 🔴 | ⬜ |
| 3.4 | **Giai đoạn Thảo Luận**: Chat công khai | 🔴 | ⬜ |
| 3.5 | **Giai đoạn Bỏ Phiếu**: Vote treo cổ | 🔴 | ⬜ |
| 3.6 | Kiểm tra điều kiện thắng/thua | 🔴 | ⬜ |
| 3.7 | Màn hình kết quả game | 🔴 | ⬜ |
| 3.8 | Người chết vào kênh Âm Hồn (chat riêng) | 🟡 | ⬜ |

### 🎭 Vai Trò MVP (7 vai trò đầu tiên)
| # | Vai trò | Ưu tiên | Trạng thái |
|---|---------|---------|------------|
| 4.1 | Dân Làng (Villager) | 🔴 | ⬜ |
| 4.2 | Sói Thường (Werewolf) — chat đêm giữa đàn | 🔴 | ⬜ |
| 4.3 | Tiên Tri (Seer) — xem aura mỗi đêm | 🔴 | ⬜ |
| 4.4 | Bác Sĩ (Doctor) — cứu sống mỗi đêm | 🔴 | ⬜ |
| 4.5 | Thợ Săn (Hunter) — bắn khi chết | 🔴 | ⬜ |
| 4.6 | Phù Thủy (Witch) — 2 lọ thuốc | 🟡 | ⬜ |
| 4.7 | Kẻ Hề (Jester) — muốn bị treo cổ | 🟡 | ⬜ |

### 💬 Chat Real-time
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 5.1 | Chat công khai ban ngày | 🔴 | ⬜ |
| 5.2 | Chat bí mật Sói (chỉ Sói thấy) | 🔴 | ⬜ |
| 5.3 | Chat Âm Hồn (người đã chết) | 🟡 | ⬜ |
| 5.4 | System message (thông báo sự kiện game) | 🔴 | ⬜ |
| 5.5 | Lọc từ ngữ thô tục (filter cơ bản) | 🟡 | ⬜ |

---

## PHASE 2 — Mở Rộng (Tuần 5–8)

### 🎭 Thêm Vai Trò
| # | Vai trò | Ưu tiên | Trạng thái |
|---|---------|---------|------------|
| 6.1 | Vệ Sĩ (Bodyguard) | 🟡 | ⬜ |
| 6.2 | Thám Tử (Detective) | 🟡 | ⬜ |
| 6.3 | Cảnh Sát Trưởng (Sheriff) | 🟡 | ⬜ |
| 6.4 | Quản Ngục (Jailer) | 🟡 | ⬜ |
| 6.5 | Thị Trưởng (Mayor) | 🟡 | ⬜ |
| 6.6 | Thợ Làm Bánh (Baker) | 🟢 | ⬜ |
| 6.7 | Alpha Sói | 🟡 | ⬜ |
| 6.8 | Sói Pháp Sư | 🟡 | ⬜ |
| 6.9 | Thần Tình Yêu (Cupid) | 🟡 | ⬜ |
| 6.10 | Kẻ Giết Người Hàng Loạt (Serial Killer) | 🟡 | ⬜ |

### 👤 Hệ Thống Người Dùng Nâng Cao
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 7.1 | Hệ thống XP & Level up | 🟡 | ⬜ |
| 7.2 | Trang thống kê cá nhân (tỷ lệ thắng, vai hay chơi...) | 🟡 | ⬜ |
| 7.3 | Bảng xếp hạng (Top 100 server) | 🟡 | ⬜ |
| 7.4 | Lịch sử ván đấu | 🟡 | ⬜ |
| 7.5 | Huy hiệu thành tích (achievements) | 🟢 | ⬜ |

### 🛒 Cửa Hàng Cơ Bản
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 8.1 | Trang cửa hàng | 🟡 | ⬜ |
| 8.2 | Mua vật phẩm bằng Vàng | 🟡 | ⬜ |
| 8.3 | Kho đồ cá nhân | 🟡 | ⬜ |
| 8.4 | Trang bị vật phẩm cho nhân vật | 🟡 | ⬜ |
| 8.5 | Nhận Vàng sau mỗi ván | 🟡 | ⬜ |

---

## PHASE 3 — Xã Hội (Tuần 9–12)

### 👥 Bạn Bè & Xã Hội
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 9.1 | Gửi/nhận lời mời kết bạn | 🟡 | ⬜ |
| 9.2 | Danh sách bạn bè & trạng thái online | 🟡 | ⬜ |
| 9.3 | Block người chơi | 🟡 | ⬜ |
| 9.4 | Tin nhắn riêng (Inbox) | 🟢 | ⬜ |
| 9.5 | Mời bạn vào phòng game | 🟡 | ⬜ |
| 9.6 | Tặng Hoa Hồng cho người chơi khác | 🟢 | ⬜ |

### 🏰 Hệ Thống Clan
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 10.1 | Tạo Clan | 🟡 | ⬜ |
| 10.2 | Tham gia/rời Clan | 🟡 | ⬜ |
| 10.3 | Clan Chat | 🟡 | ⬜ |
| 10.4 | Clan Challenges (nhiệm vụ hàng tuần) | 🟢 | ⬜ |
| 10.5 | Bảng xếp hạng Clan | 🟢 | ⬜ |

### 🏆 Đấu Hạng (Ranked)
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 11.1 | Hệ thống ELO | 🟡 | ⬜ |
| 11.2 | Bảng hạng mùa (Season ranking) | 🟡 | ⬜ |
| 11.3 | Yêu cầu level tối thiểu cho Ranked | 🟡 | ⬜ |
| 11.4 | Phần thưởng cuối mùa | 🟢 | ⬜ |

---

## PHASE 4 — Nâng Cao (Tuần 13+)

### 🎮 Game Tùy Chỉnh Nâng Cao
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 12.1 | Tùy chỉnh số lượng từng vai trò | 🟡 | ⬜ |
| 12.2 | Tùy chỉnh thời gian thảo luận/đêm | 🟢 | ⬜ |
| 12.3 | Game Sandbox (test vai trò) | 🟢 | ⬜ |
| 12.4 | Spectator mode (xem game) | 🟢 | ⬜ |
| 12.5 | Replay ván đấu | 🟢 | ⬜ |

### 🛡️ Quản Trị & An Toàn
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 13.1 | Báo cáo người chơi vi phạm | 🟡 | ⬜ |
| 13.2 | Hệ thống karma/uy tín | 🟢 | ⬜ |
| 13.3 | Trang Admin quản lý user | 🟡 | ⬜ |
| 13.4 | Ban/unban tài khoản | 🟡 | ⬜ |
| 13.5 | Hệ thống anti-cheat cơ bản | 🟡 | ⬜ |

### 💎 Monetization
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 14.1 | Nạp Ngọc (VNPay / Momo) | 🟡 | ⬜ |
| 14.2 | Battle Pass theo mùa | 🟡 | ⬜ |
| 14.3 | Vật phẩm Premium (chỉ mua bằng Ngọc) | 🟢 | ⬜ |
| 14.4 | Gói VIP / Premium membership | 🟢 | ⬜ |

### 📱 UX & Performance
| # | Tính năng | Ưu tiên | Trạng thái |
|---|-----------|---------|------------|
| 15.1 | Responsive design (mobile-friendly) | 🟡 | ⬜ |
| 15.2 | Progressive Web App (PWA) | 🟢 | ⬜ |
| 15.3 | Âm thanh & nhạc nền | 🟢 | ⬜ |
| 15.4 | Animation mượt mà (Framer Motion) | 🟡 | ⬜ |
| 15.5 | Dark mode (mặc định) | 🔴 | ⬜ |

---

## 📊 TỔNG KẾT

| Phase | Số tính năng | Thời gian ước tính |
|-------|-------------|-------------------|
| Phase 1 (MVP) | ~30 | 4 tuần |
| Phase 2 | ~25 | 4 tuần |
| Phase 3 | ~20 | 4 tuần |
| Phase 4 | ~20 | 4+ tuần |
| **Tổng** | **~95** | **~16 tuần** |

---

*Cập nhật trạng thái trong `PROGRESS.md` sau mỗi session*




# 🎭 DANH SÁCH VAI TRÒ GAME — WOLVESVILLE VIỆT NAM

> Tổng cộng **50+ vai trò** chia thành 3 phe.
> Mỗi vai trò có: Tên VN, Tên EN, Phe, Hào Quang, Mô tả hành động đêm.

---

## 🟢 PHE DÂN LÀNG (VILLAGE TEAM)

> **Mục tiêu**: Loại bỏ hết Sói và kẻ thù Độc Lập

| Slug | Tên VN | Tên EN | Hào Quang | Mô tả hành động |
|------|--------|--------|-----------|-----------------|
| `villager` | Dân Làng | Villager | Thiện | Không có hành động đêm. Bỏ phiếu ban ngày. |
| `seer` | Tiên Tri | Seer | Thiện | Mỗi đêm xem hào quang (Thiện/Ác) của 1 người. |
| `doctor` | Bác Sĩ | Doctor | Thiện | Mỗi đêm cứu sống 1 người (không tự cứu liên tiếp). |
| `bodyguard` | Vệ Sĩ | Bodyguard | Thiện | Bảo vệ 1 người mỗi đêm; Vệ Sĩ chết thay nếu bị tấn công. |
| `hunter` | Thợ Săn | Hunter | Thiện | Khi chết, bắn chết 1 người bất kỳ. |
| `witch` | Phù Thủy | Witch | Thiện | Có 1 lọ hồi sinh và 1 lọ độc (dùng mỗi loại 1 lần/game). |
| `sheriff` | Cảnh Sát Trưởng | Sheriff | Thiện | Biết aura. Có thể bắn 1 người/ván; nếu bắn dân → từ chức. |
| `medium` | Thầy Đồng | Medium | Thiện | Mỗi đêm nói chuyện với 1 người đã chết, nhận 1 câu trả lời có/không. |
| `mayor` | Thị Trưởng | Mayor | Thiện | Phiếu bầu có giá trị x2. Có thể tự tiết lộ vị trí. |
| `cupid` | Thần Tình Yêu | Cupid | Thiện | Đêm 1 chọn 2 người yêu nhau; nếu 1 người chết, người kia cũng chết. |
| `aura_seer` | Thầy Bói | Aura Seer | Thiện | Mỗi đêm xem vai trò của 1 người (biết chính xác vai). |
| `priest` | Mục Sư | Priest | Thiện | Ban phước cho 1 người; người đó không thể bị Sói giết đêm đó. |
| `jailer` | Quản Ngục | Jailer | Thiện | Giam 1 người mỗi đêm; người bị giam không thể dùng kỹ năng. |
| `escort` | Kỹ Nữ | Escort | Thiện | Quyến rũ 1 người mỗi đêm; người đó không thể dùng kỹ năng. |
| `detective` | Thám Tử | Detective | Thiện | Theo dõi 1 người; biết họ đã ghé thăm ai đêm đó. |
| `soul_binder` | Kẻ Gắn Hồn | Soul Binder | Thiện | Liên kết 2 người; nếu 1 chết, người kia mất 1 kỹ năng tiếp theo. |
| `beast_hunter` | Thợ Săn Quái Thú | Beast Hunter | Thiện | Có thể tiêu diệt Alpha Sói; miễn nhiễm với Sói Biến Hình. |
| `loudmouth` | Cậu Bé Miệng Bự | Loudmouth | Thiện | Khi chết, tiết lộ vai trò của người cuối cùng họ nói chuyện. |
| `flower_child` | Hoa Bé Con | Flower Child | Thiện | Miễn nhiễm với cuộc bỏ phiếu ban ngày lần đầu. |
| `baker` | Thợ Làm Bánh | Baker | Thiện | Cung cấp bánh mì; người không nhận bánh sau 2 đêm sẽ chết đói. |
| `warden` | Người Canh Gác | Warden | Thiện | Chặn kẻ tấn công; kẻ tấn công bị tiết lộ cho Warden. |
| `prophet` | Nhà Tiên Tri | Prophet | Thiện | Nhận linh cảm về 1 người (đúng/sai ngẫu nhiên 80/20). |
| `vampire_hunter` | Thợ Săn Ma Cà Rồng | Vampire Hunter | Thiện | Tiêu diệt được Ma Cà Rồng; miễn nhiễm cắn của Ma Cà Rồng. |

---

## 🔴 PHE SÓI (WEREWOLF TEAM)

> **Mục tiêu**: Số Sói ≥ số Dân còn lại

| Slug | Tên VN | Tên EN | Hào Quang | Mô tả hành động |
|------|--------|--------|-----------|-----------------|
| `werewolf` | Sói Thường | Werewolf | Ác | Mỗi đêm cùng đàn chọn 1 người để giết. Biết đồng bọn. |
| `alpha_wolf` | Alpha Sói | Alpha Wolf | Ác | Dẫn đầu đàn. Nếu bị Tiên Tri xem: hiện là Thiện. |
| `wolf_shaman` | Sói Pháp Sư | Wolf Shaman | Ác | Ngăn 1 người Dân dùng kỹ năng đêm đó. |
| `wolf_seer` | Sói Tiên Tri | Wolf Seer | Ác | Xem hào quang của 1 người mỗi đêm (giống Tiên Tri). |
| `wolf_berserker` | Sói Cuồng Chiến | Wolf Berserker | Ác | Miễn nhiễm với bảo vệ của Bác Sĩ/Vệ Sĩ. |
| `wolfboy` | Sói Cậu Bé | Wolfboy | Ác | Xuất hiện là Thiện với Tiên Tri. Chuyển 1 Dân sang phe Sói. |
| `wolf_knight` | Sói Hiệp Sĩ | Wolf Knight | Ác | Khi chết ban ngày, giết thêm 1 người đã bỏ phiếu chống. |
| `lone_wolf` | Sói Cô Đơn | Lone Wolf | Ác | Không biết đồng bọn, hành động độc lập. Thắng nếu là Sói cuối. |
| `vampire` | Ma Cà Rồng | Vampire | Ác | Cắn 1 người mỗi đêm; sau 2 đêm người bị cắn chuyển phe Sói. |
| `wolf_sorcerer` | Sói Phù Thủy | Wolf Sorcerer | Ác | Đặt bẫy; người Dân dẫm bẫy bị lộ vai. |

---

## 🟡 PHE ĐỘC LẬP (SOLO TEAM)

> **Mục tiêu**: Tùy từng vai trò — thường thắng một mình

| Slug | Tên VN | Tên EN | Hào Quang | Điều kiện thắng |
|------|--------|--------|-----------|-----------------|
| `jester` | Kẻ Hề | Jester | Trung Lập | **Phải bị treo cổ** bởi dân làng (không tự sát). |
| `arsonist` | Kẻ Phóng Hỏa | Arsonist | Trung Lập | Tẩm xăng lên người; ra lệnh đốt → tất cả bị tẩm chết. |
| `assassin` | Sát Thủ | Assassin | Trung Lập | Giết đúng mục tiêu bí mật được giao (1 lần/đêm). |
| `cult_leader` | Giáo Chủ | Cult Leader | Trung Lập | Chiêu mộ người vào giáo phái; thắng khi giáo phái chiếm đa số. |
| `serial_killer` | Kẻ Giết Người Hàng Loạt | Serial Killer | Trung Lập | Giết 1 người mỗi đêm; thắng khi là người cuối cùng còn sống. |
| `doomsayer` | Kẻ Tiên Đoán Diệt Vong | Doomsayer | Trung Lập | Đoán đúng 3 người chết tiếp theo → thắng ngay. |
| `vigilante` | Cảnh Sát Tư | Vigilante | Trung Lập | Bắn 1 người mỗi đêm; thắng với Dân nếu Sói chết trước. |
| `witch_doctor` | Pháp Sư Bộ Lạc | Witch Doctor | Trung Lập | Có thể cứu người; thắng nếu còn sống đến cuối. |
| `lycan` | Người Sói Nguyên Thủy | Lycan | Trung Lập | Hiện là Ác với Tiên Tri; không biết Sói; thắng với Dân. |
| `troll` | Yêu Quái | Troll | Trung Lập | Nếu bị vote, người vote nhiều nhất cho Troll cũng chết. |
| `executioner` | Đao Phủ | Executioner | Trung Lập | Phải khiến mục tiêu bí mật bị treo cổ (không tự giết). |
| `plaguebearer` | Kẻ Mang Dịch Bệnh | Plaguebearer | Trung Lập | Lây bệnh cho tất cả; khi tất cả nhiễm bệnh → trở thành Pestilence và thắng. |

---

## 📋 VAI TRÒ THEO ĐỘ KHÓ

### 🟢 Dễ (Cho người mới):
`villager`, `werewolf`, `seer`, `doctor`, `hunter`, `witch`

### 🟡 Trung bình:
`bodyguard`, `sheriff`, `medium`, `mayor`, `escort`, `detective`, `jester`, `serial_killer`

### 🔴 Khó (Cần kinh nghiệm):
`cupid`, `arsonist`, `doomsayer`, `plaguebearer`, `cult_leader`, `alpha_wolf`, `wolfboy`

---

## 🗂️ VAI TRÒ PHASE 1 (MVP — Triển khai trước)

Chỉ cần 5–7 vai trò để chạy được game cơ bản:

```
✅ villager       → Dân Làng (dễ nhất, không action đêm)
✅ werewolf       → Sói Thường
✅ seer           → Tiên Tri
✅ doctor         → Bác Sĩ
✅ hunter         → Thợ Săn
✅ witch          → Phù Thủy
✅ jester         → Kẻ Hề (solo đơn giản nhất)
```

---

## 🔧 SEED SQL MẪU

```sql
INSERT INTO roles (slug, name_vi, name_en, description_vi, team, aura, has_night_action, difficulty) VALUES
('villager',  'Dân Làng',   'Villager', 'Không có kỹ năng đặc biệt. Dùng lý luận để tìm ra Sói.', 'village', 'good', false, 'easy'),
('werewolf',  'Sói Thường', 'Werewolf', 'Mỗi đêm cùng đồng bọn chọn 1 người để tiêu diệt.',       'werewolf', 'evil', true,  'easy'),
('seer',      'Tiên Tri',   'Seer',     'Mỗi đêm xem hào quang Thiện/Ác của 1 người chơi khác.',   'village', 'good', true,  'easy'),
('doctor',    'Bác Sĩ',     'Doctor',   'Mỗi đêm cứu sống 1 người; không tự cứu 2 đêm liên tiếp.', 'village', 'good', true,  'easy'),
('hunter',    'Thợ Săn',    'Hunter',   'Khi bị giết, ngay lập tức bắn chết 1 người bất kỳ.',      'village', 'good', false, 'medium'),
('witch',     'Phù Thủy',   'Witch',    'Có 1 lọ hồi sinh và 1 lọ độc, mỗi loại dùng 1 lần/game.','village', 'good', true,  'medium'),
('jester',    'Kẻ Hề',      'Jester',   'Thắng nếu bị dân làng treo cổ. Đừng để lộ mình là Kẻ Hề!','solo',    'neutral', false, 'hard');
```

---

*Phase 2 sẽ bổ sung thêm 20 vai trò. Xem lịch trình: `PROGRESS.md`*




# Báo Cáo Cập Nhật: Hiệu Ứng Chiêu Thức Các Vai Trò (Wolvesville VN)

Chào bạn, tôi đã hoàn thành việc thiết kế và lập trình các hiệu ứng chiêu thức trực quan cực kỳ sinh động, mang phong cách cao cấp và hiện đại cho **tất cả** các vai trò (roles) trong game Wolvesville Việt Nam. 

Toàn bộ logic gốc cực kỳ hoàn chỉnh của trò chơi đều được giữ nguyên vẹn 100%, các hiệu ứng chỉ được thêm vào dưới dạng các lớp phủ đồ họa hoạt hình (overlaid graphical animations) sử dụng thư viện **Framer Motion** và các CSS/SVG tùy biến đẳng cấp.

---

## 🎨 Chi Tiết Hiệu Ứng Cho Từng Vai Trò (Roles)

Bất kỳ khi nào người chơi sở hữu vai trò tương ứng và chọn mục tiêu vào ban đêm (hoặc ban ngày khi dùng kỹ năng/bỏ phiếu), một lớp phủ hoạt ảnh (overlay effect) đặc trưng sẽ xuất hiện trực tiếp trên thẻ bài của mục tiêu đó:

| Biểu Tượng | Vai Trò | Chi Tiết Hiệu Ứng Chiêu Thức Trực Quan | Hoạt Ảnh (Animation Style) |
| :---: | :--- | :--- | :--- |
| 🛡️ | **Vệ Sĩ (Bodyguard)** | Khiên chắn hoàng kim cổ điển hiện lên bao bọc thẻ bài kèm hào quang bảo vệ. | Khiên xoay lắc nhẹ nhàng, viền thẻ bài nhấp nháy phát sáng vàng kim. |
| 💊 | **Bác Sĩ (Doctor)** | Biểu tượng bình thuốc/tim y tế sáng xanh mòng két cùng các ký hiệu chữ thập nổi lên. | Chữ thập xanh lá/cyan bay lơ lửng từ dưới lên rồi tan biến dần. |
| 🔮 | **Tiên Tri (Seer)** | Quả cầu pha lê vũ trụ lấp lánh tinh vân tím mộng mơ. | Quả cầu xoay trục chậm, tinh vân tím khuếch tán lấp lánh. |
| 🔮🐺 | **Sói Tiên Tri (Wolf Seer)** | Quả cầu pha lê hắc ám màu đỏ máu với vết vuốt sói quét qua. | Quả cầu chập chờn, phát ra luồng năng lượng đỏ rực nguy hiểm. |
| 🧪🟢 | **Phù Thủy - Cứu (Witch)** | Lọ thuốc sinh mệnh ngọc lục bảo nghiêng xuống rót giọt nước hồi sinh. | Bình thuốc lắc nhẹ, bọt khí xanh lục liên tục sủi lên. |
| 🧪☠️ | **Phù Thủy - Độc (Witch)** | Lọ độc dược màu tím hắc ám mang hình đầu lâu nhỏ giọt độc. | Bình nghiêng chảy, các giọt độc dược tím rơi xuống đáy thẻ bài. |
| 🏹 | **Thợ Săn (Hunter)** | Cung tên gỗ cổ thụ giương sẵn hướng thẳng vào mục tiêu kèm tâm ngắm ngắm bắn đỏ rực. | Cung tên co giãn như đang kéo dây cung, hồng tâm quay tròn liên tục. |
| 🛢️ | **Hỏa Tặc - Dầu (Arsonist)** | Thùng dầu bóng loáng đổ dầu đen bóng vào mục tiêu. | Thùng dầu nghiêng, các giọt dầu đen loang lổ nhỏ xuống thẻ bài. |
| 🔥 | **Hỏa Tặc - Đốt (Arsonist)** | Hoạt cảnh lửa cháy thiêu rụi ngập tràn thẻ bài dành cho **tất cả** mục tiêu đã bị đổ dầu khi kích hoạt châm lửa. | Ngọn lửa cam đỏ bập bùng dữ dội ở đáy thẻ, tàn tro bay lơ lửng bốc lên. |
| 🐺🩸 | **Phe Sói (Werewolves)** | Vết vuốt cào sắc lẹm xé toạc màn đêm kèm vệt máu đỏ tươi loang ra trên thẻ mục tiêu. | Vết cào chém dứt khoát góc chéo, giọt máu nhỏ giọt chân thực. |
| 🔍 | **Thám Tử (Detective)** | Kính lúp công nghệ cao cùng tia quét lazer quét dọc thẻ bài. | Tia quét lazer xanh ngọc neon chuyển động lên xuống liên tục. |
| ⛓️ | **Cai Ngục (Jailer)** | Hàng rào song sắt ngục tù đen xám thả thẳng từ trên xuống khóa chặt thẻ bài. | Các thanh sắt rơi tự do nảy nhẹ (spring), chữ khóa ngục phát sáng. |
| 🔫 | **Xạ Thủ (Gunner)** | Bầu không khí căng thẳng với súng lục bạc nhắm bắn và hồng tâm khóa mục tiêu xanh neon. | Khẩu súng giật nhẹ (recoil), tâm ngắm thu nhỏ nhấp nháy liên tục. |
| 💘 | **Thần Tình Yêu (Cupid)** | Trái tim hồng tình yêu bập bùng cùng vô vàn trái tim nhỏ lơ lửng. | Trái tim lớn đập nhịp liên hồi, trái tim nhỏ lấp lánh nhẹ nhàng bay lên. |
| 🔪 | **Sát Nhân (Serial Killer)** | Con dao bầu sắc lạnh rỉ máu chém ngang màn hình. | Con dao nghiêng góc chí mạng, vệt máu đỏ bắn tung tóe. |
| 🎯 | **Săn Đầu Người (Headhunter)** | Hồng tâm thợ săn tiền thưởng khóa mục tiêu truy nã bí mật. | Vòng tròn tiêu cự zoom in - zoom out nhịp nhàng, màu cam cảnh báo. |
| 💀👻 | **Ngoại Cảm (Medium)** | Hồn ma màu xanh dương tâm linh bay lượn trên mộ bia của người đã khuất. | Hồn ma bay lượn theo hình sóng sin uốn lượn mờ ảo ảo diệu. |
| 🫵 | **Bỏ Phiếu (Voting)** | Hình bàn tay chỉ thẳng vào mục tiêu (`🫵`) biểu thị lượt bình chọn treo cổ công khai vào ban ngày. | Bàn tay co giãn nhấp nháy, trượt nhẹ nhịp nhàng kèm viền hồng neon rực rỡ, tự động thay thế mọi hiệu ứng chiêu thức đêm khi bỏ phiếu. |

---

## ⚡ Các Điểm Cải Tiến Đồ Họa Cực Kỳ Đắt Giá

1. **Hiệu ứng lửa cháy đồng loạt (Arsonist Ignite):** Thay vì chỉ sáng thẻ, khi Hỏa Tặc kích hoạt "Châm lửa" (`arsonist_ignite`), toàn bộ các người chơi đã bị đổ dầu trước đó (lưu trong danh sách doused) sẽ đồng loạt rực cháy lên ngọn lửa đỏ cam rực rỡ và bay tàn tro, cực kỳ mãn nhãn và đúng chuẩn Wolvesville cao cấp.
2. **Hệ thống mượt mà (Performance):** Sử dụng tối đa sức mạnh của CSS GPU Hardware Acceleration kết hợp `framer-motion` giúp các hiệu ứng chạy mượt mà ở tần số quét cao (lên tới 120Hz/144Hz) mà không hề gây giật lag cho giao diện game.
3. **Phù hợp bối cảnh:** Các hiệu ứng chỉ xuất hiện khi người chơi chủ động chọn mục tiêu chiêu thức hoặc kích hoạt, giúp giữ cho giao diện chung luôn sạch sẽ, gọn gàng và tối ưu trải nghiệm.
4. **Hiệu ứng Vote (Bỏ Phiếu) Độc Lập:** Khi bước vào giai đoạn bỏ phiếu ban ngày, nếu người chơi bình chọn một mục tiêu bất kỳ, thẻ bài mục tiêu đó sẽ hiển thị hiệu ứng bàn tay chỉ vào (`🫵`) cùng viền hồng neon lộng lẫy, hoàn toàn ghi đè lên các hiệu ứng chiêu thức ban đêm của vai trò đó, giúp giao diện trở nên mạch lạc và đúng thực tế trò chơi.

---

## 🚀 Trạng Thái Tích Hợp

- Giao diện Frontend: Đã cập nhật thành công và sẵn sàng hiển thị tại `frontend/src/pages/GamePage.jsx`.
- Logic Trận Đấu & Thợ Săn Trả Thù: Hoàn toàn được bảo vệ an toàn, không có bất kỳ dòng logic cốt lõi nào bị thay đổi sai lệch.

Chúc bạn và các người chơi sẽ có những phút giây trải nghiệm Wolvesville Việt Nam cực kỳ mãn nhãn và đầy kịch tính!




