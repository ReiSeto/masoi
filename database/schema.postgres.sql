-- ============================================================
-- WOLVESVILLE VIỆT NAM — PostgreSQL Schema
-- Compatible with Render.com free PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BẢNG: items
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(100) UNIQUE NOT NULL,
    name_vi         VARCHAR(200) NOT NULL,
    description_vi  TEXT,
    category        VARCHAR(30) NOT NULL CHECK (category IN ('hat', 'outfit', 'accessory', 'frame', 'emoji', 'role_skin', 'effect', 'bundle')),
    price_coins     INTEGER DEFAULT 0 CHECK (price_coins >= 0),
    price_gems      INTEGER DEFAULT 0 CHECK (price_gems >= 0),
    price_roses     INTEGER DEFAULT 0 CHECK (price_roses >= 0),
    rarity          VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_available    BOOLEAN DEFAULT TRUE,
    is_premium      BOOLEAN DEFAULT FALSE,
    image_url       VARCHAR(500),
    preview_url     VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);

-- ============================================================
-- BẢNG: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                VARCHAR(50) UNIQUE NOT NULL,
    name_vi             VARCHAR(100) NOT NULL,
    name_en             VARCHAR(100) NOT NULL,
    description_vi      TEXT NOT NULL,
    team                VARCHAR(20) NOT NULL CHECK (team IN ('village', 'werewolf', 'solo')),
    aura                VARCHAR(10) NOT NULL CHECK (aura IN ('good', 'evil', 'neutral')),
    has_night_action    BOOLEAN DEFAULT FALSE,
    night_action_desc   TEXT,
    uses_per_game       INTEGER DEFAULT -1,
    can_chat_at_night   BOOLEAN DEFAULT FALSE,
    is_revealed_on_death BOOLEAN DEFAULT TRUE,
    difficulty          VARCHAR(10) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_active           BOOLEAN DEFAULT TRUE,
    sort_order          INTEGER DEFAULT 0,
    icon_url            VARCHAR(500),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- BẢNG: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(30) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    coins           INTEGER NOT NULL DEFAULT 500 CHECK (coins >= 0),
    roses           INTEGER NOT NULL DEFAULT 0 CHECK (roses >= 0),
    gems            INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
    level           INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    xp              INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    xp_next_level   INTEGER NOT NULL DEFAULT 1000,
    avatar_item_id  UUID REFERENCES items(id) ON DELETE SET NULL,
    frame_item_id   UUID REFERENCES items(id) ON DELETE SET NULL,
    bio             TEXT,
    country_code    CHAR(2) DEFAULT 'VN',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason      TEXT,
    ban_until       TIMESTAMP NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin')),
    games_played    INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
    games_won       INTEGER NOT NULL DEFAULT 0 CHECK (games_won >= 0),
    reputation      INTEGER NOT NULL DEFAULT 100 CHECK (reputation >= 0 AND reputation <= 100),
    last_reputation_recovery TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_online     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);

-- ============================================================
-- BẢNG: user_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_games             INTEGER DEFAULT 0,
    total_wins              INTEGER DEFAULT 0,
    total_losses            INTEGER DEFAULT 0,
    win_rate                DECIMAL(5,2) DEFAULT 0.00,
    games_as_villager       INTEGER DEFAULT 0,
    wins_as_villager        INTEGER DEFAULT 0,
    games_as_werewolf       INTEGER DEFAULT 0,
    wins_as_werewolf        INTEGER DEFAULT 0,
    games_as_solo           INTEGER DEFAULT 0,
    wins_as_solo            INTEGER DEFAULT 0,
    total_kills             INTEGER DEFAULT 0,
    total_saves             INTEGER DEFAULT 0,
    total_correct_checks    INTEGER DEFAULT 0,
    times_voted_out         INTEGER DEFAULT 0,
    times_survived          INTEGER DEFAULT 0,
    elo_rating              INTEGER DEFAULT 1000,
    elo_peak                INTEGER DEFAULT 1000,
    ranked_season           INTEGER DEFAULT 1,
    favorite_role_id        UUID REFERENCES roles(id) ON DELETE SET NULL,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- BẢNG: user_inventory
-- ============================================================
CREATE TABLE IF NOT EXISTS user_inventory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id         UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    is_equipped     BOOLEAN DEFAULT FALSE,
    acquired_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source          VARCHAR(30) DEFAULT 'purchase' CHECK (source IN ('purchase', 'battle_pass', 'gift', 'event', 'starter')),
    UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory(user_id);

-- ============================================================
-- BẢNG: user_friends
-- ============================================================
CREATE TABLE IF NOT EXISTS user_friends (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_requester ON user_friends(requester_id);
CREATE INDEX IF NOT EXISTS idx_friends_addressee ON user_friends(addressee_id);

-- ============================================================
-- BẢNG: user_blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS user_blocks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- ============================================================
-- BẢNG: games
-- ============================================================
CREATE TABLE IF NOT EXISTS games (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_mode       VARCHAR(30) NOT NULL CHECK (game_mode IN ('quick', 'ranked', 'custom', 'friends', 'sandbox')),
    status          VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'finished', 'cancelled')),
    max_players     INTEGER NOT NULL DEFAULT 12 CHECK (max_players BETWEEN 4 AND 20),
    min_players     INTEGER NOT NULL DEFAULT 6 CHECK (min_players >= 4),
    language        CHAR(2) DEFAULT 'vi',
    role_config     JSONB NOT NULL,
    winning_team    VARCHAR(20) CHECK (winning_team IN ('village', 'werewolf', 'solo')),
    winner_role_slug VARCHAR(50),
    started_at      TIMESTAMP NULL,
    ended_at        TIMESTAMP NULL,
    duration_seconds INTEGER,
    total_rounds    INTEGER DEFAULT 0,
    host_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    room_code       CHAR(6) UNIQUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_mode ON games(game_mode);
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at DESC);

-- ============================================================
-- BẢNG: game_players
-- ============================================================
CREATE TABLE IF NOT EXISTS game_players (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    role_id         UUID NOT NULL REFERENCES roles(id),
    is_alive        BOOLEAN NOT NULL DEFAULT TRUE,
    death_round     INTEGER,
    death_cause     VARCHAR(50) CHECK (death_cause IN ('voted', 'wolf_kill', 'hunter_shot', 'poison', 'lovers_death', 'disconnect')),
    seat_number     INTEGER CHECK (seat_number BETWEEN 1 AND 20),
    is_winner       BOOLEAN DEFAULT FALSE,
    xp_earned       INTEGER DEFAULT 0,
    coins_earned    INTEGER DEFAULT 0,
    role_data       JSONB,
    joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id),
    UNIQUE(game_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_game_players_game ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user ON game_players(user_id);

-- ============================================================
-- BẢNG: game_actions
-- ============================================================
CREATE TABLE IF NOT EXISTS game_actions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number    INTEGER NOT NULL,
    phase           VARCHAR(10) NOT NULL CHECK (phase IN ('night', 'day', 'vote')),
    actor_player_id UUID NOT NULL REFERENCES game_players(id),
    action_type     VARCHAR(50) NOT NULL,
    target_player_id UUID REFERENCES game_players(id),
    result          JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_actions_game ON game_actions(game_id);

-- ============================================================
-- BẢNG: game_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS game_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    sender_id       UUID REFERENCES game_players(id),
    channel         VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (channel IN ('public', 'wolf', 'dead', 'system', 'whisper')),
    content         TEXT NOT NULL,
    round_number    INTEGER,
    phase           VARCHAR(10),
    is_system       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_messages_game ON game_messages(game_id, created_at);

-- ============================================================
-- BẢNG: transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(30) NOT NULL CHECK (type IN ('earn_coins', 'spend_coins', 'earn_roses', 'spend_roses', 'earn_gems', 'spend_gems')),
    amount          INTEGER NOT NULL,
    currency        VARCHAR(10) NOT NULL CHECK (currency IN ('coins', 'roses', 'gems')),
    balance_after   INTEGER NOT NULL,
    description_vi  VARCHAR(500),
    reference_id    UUID,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);

-- ============================================================
-- BẢNG: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title_vi        VARCHAR(200) NOT NULL,
    body_vi         TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    action_url      VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- BẢNG: reports
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    reported_id     UUID NOT NULL REFERENCES users(id),
    game_id         UUID REFERENCES games(id),
    reason          VARCHAR(50) NOT NULL CHECK (reason IN ('cheating', 'hate_speech', 'harassment', 'spam', 'other')),
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (reporter_id != reported_id)
);

-- ============================================================
-- BẢNG: clans
-- ============================================================
CREATE TABLE IF NOT EXISTS clans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) UNIQUE NOT NULL,
    tag             VARCHAR(8) UNIQUE NOT NULL,
    description     TEXT,
    total_members   INTEGER DEFAULT 1,
    total_wins      INTEGER DEFAULT 0,
    is_public       BOOLEAN DEFAULT TRUE,
    min_level       INTEGER DEFAULT 1,
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    icon_url        VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- BẢNG: clan_members
-- ============================================================
CREATE TABLE IF NOT EXISTS clan_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id         UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    rank_level      VARCHAR(20) DEFAULT 'member' CHECK (rank_level IN ('owner', 'officer', 'member')),
    joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);

-- ============================================================
-- BẢNG: battle_passes
-- ============================================================
CREATE TABLE IF NOT EXISTS battle_passes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season          INTEGER NOT NULL UNIQUE,
    name_vi         VARCHAR(100) NOT NULL,
    start_date      TIMESTAMP NOT NULL,
    end_date        TIMESTAMP NOT NULL,
    max_level       INTEGER DEFAULT 50,
    price_gems      INTEGER DEFAULT 500,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA: Roles
-- ============================================================
INSERT INTO roles (slug, name_vi, name_en, description_vi, team, aura, has_night_action, night_action_desc, uses_per_game, can_chat_at_night, is_revealed_on_death, difficulty, sort_order) VALUES
('villager',    'Dân Làng',      'Villager',  'Thành viên bình thường của làng.', 'village', 'good', false, null, 0, false, true, 'easy', 1),
('seer',        'Tiên Tri',      'Seer',      'Mỗi đêm, chọn một người để xem aura.', 'village', 'good', true, 'Chọn 1 người để xem aura (tốt/xấu)', -1, false, true, 'medium', 2),
('doctor',      'Bác Sĩ',        'Doctor',    'Mỗi đêm, chọn một người để bảo vệ.', 'village', 'good', true, 'Chọn 1 người để cứu sống', -1, false, true, 'easy', 3),
('hunter',      'Thợ Săn',       'Hunter',    'Khi bị giết, được chọn bắn chết 1 người.', 'village', 'good', false, 'Khi chết: bắn chết 1 người bất kỳ', 1, false, true, 'easy', 4),
('witch',       'Phù Thủy',      'Witch',     'Có 1 lọ thuốc cứu và 1 lọ thuốc độc.', 'village', 'good', true, 'Có thể dùng thuốc cứu (x1) và/hoặc thuốc độc (x1)', 1, false, true, 'medium', 5),
('bodyguard',   'Vệ Sĩ',         'Bodyguard', 'Mỗi đêm chọn bảo vệ 1 người.', 'village', 'good', true, 'Chọn 1 người để bảo vệ', -1, false, true, 'medium', 6),
('detective',   'Thám Tử',       'Detective', 'Mỗi đêm xem hành động đêm.', 'village', 'good', true, 'Xem có ai tác động vào 1 người chơi không', -1, false, true, 'hard', 7),
('mayor',       'Thị Trưởng',    'Mayor',     'Phiếu bầu có giá trị x2.', 'village', 'good', false, null, 0, false, false, 'medium', 8),
('werewolf',    'Sói Thường',    'Werewolf',  'Mỗi đêm cùng đàn sói chọn giết 1 người.', 'werewolf', 'evil', true, 'Cùng đàn Sói chọn 1 người để giết', -1, true, true, 'easy', 10),
('alpha_wolf',  'Alpha Sói',     'Alpha Wolf', 'Lãnh đạo đàn Sói.', 'werewolf', 'evil', true, 'Cùng đàn Sói chọn giết', -1, true, false, 'hard', 11),
('wolf_seer',   'Sói Tiên Tri',  'Wolf Seer', 'Sói có khả năng Tiên Tri.', 'werewolf', 'evil', true, 'Cùng giết như Sói + Xem aura 1 người', -1, true, true, 'hard', 12),
('jester',      'Kẻ Hề',         'Jester',    'Mục tiêu: BỊ treo cổ bởi dân làng.', 'solo', 'neutral', false, null, 0, false, true, 'hard', 20),
('serial_killer', 'Kẻ Giết Người Hàng Loạt', 'Serial Killer', 'Mỗi đêm giết 1 người.', 'solo', 'evil', true, 'Mỗi đêm giết 1 người bất kỳ', -1, false, true, 'hard', 21),
('cupid',       'Thần Tình Yêu', 'Cupid',     'Đêm đầu tiên, chọn 2 người làm tình nhân.', 'solo', 'neutral', true, 'Đêm 1: chọn 2 người thành tình nhân', 1, false, true, 'hard', 22)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA: Items
-- ============================================================
INSERT INTO items (slug, name_vi, description_vi, category, price_coins, price_gems, rarity, is_available) VALUES
('avatar_default',      'Avatar Mặc Định',      'Avatar mặc định cho người chơi mới',   'hat', 0, 0, 'common', false),
('frame_wood',          'Khung Gỗ',              'Khung hồ sơ bằng gỗ đơn giản',         'frame', 0, 0, 'common', true),
('frame_silver',        'Khung Bạc',             'Khung hồ sơ bạc sáng bóng',            'frame', 500, 0, 'rare', true),
('frame_gold',          'Khung Vàng',            'Khung hồ sơ vàng rực rỡ',              'frame', 0, 50, 'epic', true),
('frame_wolf',          'Khung Sói Hú',          'Khung hồ sơ với họa tiết đàn sói',     'frame', 0, 150, 'legendary', true),
('hat_basic_cap',       'Mũ Lưỡi Trai',          'Chiếc mũ lưỡi trai đơn giản',          'hat', 200, 0, 'common', true),
('hat_detective',       'Mũ Thám Tử',            'Mũ của thám tử tài ba',                'hat', 800, 0, 'rare', true),
('outfit_villager',     'Áo Dân Làng',           'Bộ trang phục dân làng truyền thống',  'outfit', 0, 0, 'common', false),
('emoji_laugh',         'Emoji Cười',             'Emoji cười vui vẻ',                    'emoji', 100, 0, 'common', true),
('emoji_angry',         'Emoji Tức Giận',         'Emoji tức giận',                       'emoji', 100, 0, 'common', true),
('emoji_wolf',          'Emoji Sói',              'Emoji hình con sói',                   'emoji', 300, 0, 'rare', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA: Default Test Account
-- password: tester123
-- ============================================================
INSERT INTO users (id, username, email, password_hash, coins, roses, gems, level, xp, role) VALUES
('b8d7ef28-ef22-4a00-ba5f-b52b821ab001', 'tester', 'tester@wolvesville.vn', '$2a$10$.qPCzdztdl39zIxPassPAOQy1R11.6uRy5cYzOJuqovs9msvi4u6m', 9999, 100, 100, 10, 5000, 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_stats (id, user_id, total_games, total_wins, total_losses, win_rate, elo_rating) VALUES
('b8d7ef28-ef22-4a00-ba5f-b52b821ab002', 'b8d7ef28-ef22-4a00-ba5f-b52b821ab001', 50, 30, 20, 60.00, 1200)
ON CONFLICT (id) DO NOTHING;
