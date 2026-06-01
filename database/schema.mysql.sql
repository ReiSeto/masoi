-- ============================================================
-- WOLVESVILLE VIỆT NAM — MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS wolvesville_vn DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wolvesville_vn;

-- ============================================================
-- BẢNG: items (Phải tạo trước users vì users FK vào items)
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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

CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_rarity ON items(rarity);

-- ============================================================
-- BẢNG: roles (Vai trò game — seed data)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username        VARCHAR(30) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    coins           INTEGER NOT NULL DEFAULT 500 CHECK (coins >= 0),
    roses           INTEGER NOT NULL DEFAULT 0 CHECK (roses >= 0),
    gems            INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
    level           INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    xp              INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    xp_next_level   INTEGER NOT NULL DEFAULT 1000,
    avatar_item_id  CHAR(36),
    frame_item_id   CHAR(36),
    bio             TEXT,
    country_code    CHAR(2) DEFAULT 'VN',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason      TEXT,
    ban_until       TIMESTAMP NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin')),
    games_played    INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
    games_won       INTEGER NOT NULL DEFAULT 0 CHECK (games_won >= 0),
    last_online     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (avatar_item_id) REFERENCES items(id) ON DELETE SET NULL,
    FOREIGN KEY (frame_item_id) REFERENCES items(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_level ON users(level DESC);

-- ============================================================
-- BẢNG: user_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id                 CHAR(36) NOT NULL UNIQUE,
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
    favorite_role_id        CHAR(36),
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (favorite_role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- ============================================================
-- BẢNG: user_inventory
-- ============================================================
CREATE TABLE IF NOT EXISTS user_inventory (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    item_id         CHAR(36) NOT NULL,
    is_equipped     BOOLEAN DEFAULT FALSE,
    acquired_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source          VARCHAR(30) DEFAULT 'purchase' CHECK (source IN ('purchase', 'battle_pass', 'gift', 'event', 'starter')),
    UNIQUE KEY(user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_user ON user_inventory(user_id);

-- ============================================================
-- BẢNG: user_friends
-- ============================================================
CREATE TABLE IF NOT EXISTS user_friends (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    requester_id    CHAR(36) NOT NULL,
    addressee_id    CHAR(36) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY(requester_id, addressee_id),
    CHECK (requester_id != addressee_id),
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_friends_requester ON user_friends(requester_id);
CREATE INDEX idx_friends_addressee ON user_friends(addressee_id);

-- ============================================================
-- BẢNG: user_blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS user_blocks (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    blocker_id      CHAR(36) NOT NULL,
    blocked_id      CHAR(36) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- BẢNG: clans
-- ============================================================
CREATE TABLE IF NOT EXISTS clans (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name            VARCHAR(50) UNIQUE NOT NULL,
    tag             VARCHAR(8) UNIQUE NOT NULL,
    description     TEXT,
    total_members   INTEGER DEFAULT 1,
    total_wins      INTEGER DEFAULT 0,
    is_public       BOOLEAN DEFAULT TRUE,
    min_level       INTEGER DEFAULT 1,
    owner_id        CHAR(36) NOT NULL,
    icon_url        VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================================
-- BẢNG: clan_members
-- ============================================================
CREATE TABLE IF NOT EXISTS clan_members (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    clan_id         CHAR(36) NOT NULL,
    user_id         CHAR(36) NOT NULL UNIQUE,
    rank_level      VARCHAR(20) DEFAULT 'member' CHECK (rank_level IN ('owner', 'officer', 'member')),
    joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY(clan_id, user_id),
    FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_clan_members_clan ON clan_members(clan_id);

-- ============================================================
-- BẢNG: games
-- ============================================================
CREATE TABLE IF NOT EXISTS games (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    game_mode       VARCHAR(30) NOT NULL CHECK (game_mode IN ('quick', 'ranked', 'custom', 'friends', 'sandbox')),
    status          VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'finished', 'cancelled')),
    max_players     INTEGER NOT NULL DEFAULT 12 CHECK (max_players BETWEEN 4 AND 20),
    min_players     INTEGER NOT NULL DEFAULT 6 CHECK (min_players >= 4),
    language        CHAR(2) DEFAULT 'vi',
    role_config     JSON NOT NULL,
    winning_team    VARCHAR(20) CHECK (winning_team IN ('village', 'werewolf', 'solo')),
    winner_role_slug VARCHAR(50),
    started_at      TIMESTAMP NULL,
    ended_at        TIMESTAMP NULL,
    duration_seconds INTEGER,
    total_rounds    INTEGER DEFAULT 0,
    host_user_id    CHAR(36),
    room_code       CHAR(6) UNIQUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_mode ON games(game_mode);
CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_games_created ON games(created_at DESC);

-- ============================================================
-- BẢNG: game_players
-- ============================================================
CREATE TABLE IF NOT EXISTS game_players (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    game_id         CHAR(36) NOT NULL,
    user_id         CHAR(36) NOT NULL,
    role_id         CHAR(36) NOT NULL,
    is_alive        BOOLEAN NOT NULL DEFAULT TRUE,
    death_round     INTEGER,
    death_cause     VARCHAR(50) CHECK (death_cause IN ('voted', 'wolf_kill', 'hunter_shot', 'poison', 'lovers_death', 'disconnect')),
    seat_number     INTEGER CHECK (seat_number BETWEEN 1 AND 20),
    is_winner       BOOLEAN DEFAULT FALSE,
    xp_earned       INTEGER DEFAULT 0,
    coins_earned    INTEGER DEFAULT 0,
    role_data       JSON,
    joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY(game_id, user_id),
    UNIQUE KEY(game_id, seat_number),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);

-- ============================================================
-- BẢNG: game_actions
-- ============================================================
CREATE TABLE IF NOT EXISTS game_actions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    game_id         CHAR(36) NOT NULL,
    round_number    INTEGER NOT NULL,
    phase           VARCHAR(10) NOT NULL CHECK (phase IN ('night', 'day', 'vote')),
    actor_player_id CHAR(36) NOT NULL,
    action_type     VARCHAR(50) NOT NULL,
    target_player_id CHAR(36),
    result          JSON,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_player_id) REFERENCES game_players(id),
    FOREIGN KEY (target_player_id) REFERENCES game_players(id)
);

CREATE INDEX idx_game_actions_game ON game_actions(game_id);

-- ============================================================
-- BẢNG: game_messages (Chat log)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_messages (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    game_id         CHAR(36) NOT NULL,
    sender_id       CHAR(36),
    channel         VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (channel IN ('public', 'wolf', 'dead', 'system', 'whisper')),
    content         TEXT NOT NULL,
    round_number    INTEGER,
    phase           VARCHAR(10),
    is_system       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES game_players(id)
);

CREATE INDEX idx_game_messages_game ON game_messages(game_id, created_at);

-- ============================================================
-- BẢNG: transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    type            VARCHAR(30) NOT NULL CHECK (type IN ('earn_coins', 'spend_coins', 'earn_roses', 'spend_roses', 'earn_gems', 'spend_gems')),
    amount          INTEGER NOT NULL,
    currency        VARCHAR(10) NOT NULL CHECK (currency IN ('coins', 'roses', 'gems')),
    balance_after   INTEGER NOT NULL,
    description_vi  VARCHAR(500),
    reference_id    CHAR(36),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);

-- ============================================================
-- BẢNG: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    type            VARCHAR(50) NOT NULL,
    title_vi        VARCHAR(200) NOT NULL,
    body_vi         TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    action_url      VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- BẢNG: reports
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reporter_id     CHAR(36) NOT NULL,
    reported_id     CHAR(36) NOT NULL,
    game_id         CHAR(36),
    reason          VARCHAR(50) NOT NULL CHECK (reason IN ('cheating', 'hate_speech', 'harassment', 'spam', 'other')),
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (reporter_id != reported_id),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- ============================================================
-- BẢNG: battle_passes
-- ============================================================
CREATE TABLE IF NOT EXISTS battle_passes (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
INSERT IGNORE INTO roles (id, slug, name_vi, name_en, description_vi, team, aura, has_night_action, night_action_desc, uses_per_game, can_chat_at_night, is_revealed_on_death, difficulty, sort_order) VALUES
-- Phe Dân Làng (Village)
(UUID(), 'villager',    'Dân Làng',      'Villager',  'Thành viên bình thường của làng. Không có kỹ năng đặc biệt. Ban ngày phải dùng suy luận để tìm ra Sói.', 'village', 'good', false, null, 0, false, true, 'easy', 1),
(UUID(), 'seer',        'Tiên Tri',      'Seer',      'Mỗi đêm, Tiên Tri chọn một người để xem aura (tốt/xấu). Aura xấu = có thể là Sói.', 'village', 'good', true, 'Chọn 1 người để xem aura (tốt/xấu)', -1, false, true, 'medium', 2),
(UUID(), 'doctor',      'Bác Sĩ',        'Doctor',    'Mỗi đêm, Bác Sĩ chọn một người để bảo vệ. Người được chọn sẽ không bị giết đêm đó.', 'village', 'good', true, 'Chọn 1 người để cứu sống. Không thể tự cứu 2 đêm liên tiếp.', -1, false, true, 'easy', 3),
(UUID(), 'hunter',      'Thợ Săn',       'Hunter',    'Khi bị giết (dù ban ngày hay ban đêm), Thợ Săn được chọn bắn chết 1 người.', 'village', 'good', false, 'Khi chết: bắn chết 1 người bất kỳ', 1, false, true, 'easy', 4),
(UUID(), 'witch',       'Phù Thủy',      'Witch',     'Có 1 lọ thuốc cứu và 1 lọ thuốc độc. Dùng thuốc cứu để cứu sống, thuốc độc để giết.', 'village', 'good', true, 'Có thể dùng thuốc cứu (x1) và/hoặc thuốc độc (x1)', 1, false, true, 'medium', 5),
(UUID(), 'bodyguard',   'Vệ Sĩ',         'Bodyguard', 'Mỗi đêm chọn bảo vệ 1 người. Nếu người đó bị tấn công, Vệ Sĩ sẽ chết thay.', 'village', 'good', true, 'Chọn 1 người để bảo vệ. Sẽ chết thay nếu người đó bị tấn công.', -1, false, true, 'medium', 6),
(UUID(), 'detective',   'Thám Tử',       'Detective', 'Mỗi đêm xem liệu một người chơi có bị điều tra hay không (dựa vào hành động đêm).', 'village', 'good', true, 'Xem có ai đang tác động vào 1 người chơi không', -1, false, true, 'hard', 7),
(UUID(), 'mayor',       'Thị Trưởng',    'Mayor',     'Phiếu của Thị Trưởng có giá trị x2 trong bỏ phiếu hàng ngày.', 'village', 'good', false, null, 0, false, false, 'medium', 8),

-- Phe Sói (Werewolf)
(UUID(), 'werewolf',    'Sói Thường',    'Werewolf',  'Mỗi đêm cùng với đồng đội chọn giết 1 người. Có thể chat với đàn Sói ban đêm.', 'werewolf', 'evil', true, 'Cùng đàn Sói chọn 1 người để giết', -1, true, true, 'easy', 10),
(UUID(), 'alpha_wolf',  'Alpha Sói',     'Alpha Wolf', 'Lãnh đạo của đàn Sói. Khi Alpha Sói chết, Sói tiếp theo có thể biến thành Alpha.', 'werewolf', 'evil', true, 'Cùng đàn Sói chọn giết. Có thể chọn không lộ vai khi chết.', -1, true, false, 'hard', 11),
(UUID(), 'wolf_seer',   'Sói Tiên Tri',  'Wolf Seer', 'Sói có khả năng của Tiên Tri — mỗi đêm xem aura 1 người.', 'werewolf', 'evil', true, 'Cùng giết như Sói + Xem aura 1 người', -1, true, true, 'hard', 12),

-- Phe Độc Lập (Solo)
(UUID(), 'jester',      'Kẻ Hề',         'Jester',    'Mục tiêu: BỊ treo cổ bởi dân làng. Nếu Kẻ Hề bị vote, phe Kẻ Hề thắng!', 'solo', 'neutral', false, null, 0, false, true, 'hard', 20),
(UUID(), 'serial_killer', 'Kẻ Giết Người Hàng Loạt', 'Serial Killer', 'Mỗi đêm giết 1 người. Mục tiêu: là người sống sót cuối cùng.', 'solo', 'evil', true, 'Mỗi đêm giết 1 người bất kỳ', -1, false, true, 'hard', 21),
(UUID(), 'cupid',       'Thần Tình Yêu', 'Cupid',     'Đêm đầu tiên, chọn 2 người làm tình nhân. Nếu 1 người chết, người kia chết theo.', 'solo', 'neutral', true, 'Đêm 1: chọn 2 người thành tình nhân', 1, false, true, 'hard', 22);

-- ============================================================
-- SEED DATA: Items 
-- ============================================================
INSERT IGNORE INTO items (id, slug, name_vi, description_vi, category, price_coins, price_gems, rarity, is_available) VALUES
(UUID(), 'avatar_default',      'Avatar Mặc Định',      'Avatar mặc định cho người chơi mới',   'hat', 0, 0, 'common', false),
(UUID(), 'frame_wood',          'Khung Gỗ',              'Khung hồ sơ bằng gỗ đơn giản',         'frame', 0, 0, 'common', true),
(UUID(), 'frame_silver',        'Khung Bạc',             'Khung hồ sơ bạc sáng bóng',            'frame', 500, 0, 'rare', true),
(UUID(), 'frame_gold',          'Khung Vàng',            'Khung hồ sơ vàng rực rỡ',              'frame', 0, 50, 'epic', true),
(UUID(), 'frame_wolf',          'Khung Sói Hú',          'Khung hồ sơ với họa tiết đàn sói',     'frame', 0, 150, 'legendary', true),
(UUID(), 'hat_basic_cap',       'Mũ Lưỡi Trai',          'Chiếc mũ lưỡi trai đơn giản',          'hat', 200, 0, 'common', true),
(UUID(), 'hat_detective',       'Mũ Thám Tử',            'Mũ của thám tử tài ba',                'hat', 800, 0, 'rare', true),
(UUID(), 'outfit_villager',     'Áo Dân Làng',           'Bộ trang phục dân làng truyền thống',  'outfit', 0, 0, 'common', false),
(UUID(), 'emoji_laugh',         'Emoji Cười',             'Emoji cười vui vẻ',                    'emoji', 100, 0, 'common', true),
(UUID(), 'emoji_angry',         'Emoji Tức Giận',         'Emoji tức giận',                       'emoji', 100, 0, 'common', true),
(UUID(), 'emoji_wolf',          'Emoji Sói',              'Emoji hình con sói',                   'emoji', 300, 0, 'rare', true);

-- ============================================================
-- SEED DATA: Default Test Account
-- ============================================================
INSERT IGNORE INTO users (id, username, email, password_hash, coins, roses, gems, level, xp, role) VALUES
('b8d7ef28-ef22-4a00-ba5f-b52b821ab001', 'tester', 'tester@wolvesville.vn', '$2a$10$.qPCzdztdl39zIxPassPAOQy1R11.6uRy5cYzOJuqovs9msvi4u6m', 9999, 100, 100, 10, 5000, 'admin');

-- SEED DATA: User Stats for the default account
INSERT IGNORE INTO user_stats (id, user_id, total_games, total_wins, total_losses, win_rate, elo_rating) VALUES
('b8d7ef28-ef22-4a00-ba5f-b52b821ab002', 'b8d7ef28-ef22-4a00-ba5f-b52b821ab001', 50, 30, 20, 60.00, 1200);

