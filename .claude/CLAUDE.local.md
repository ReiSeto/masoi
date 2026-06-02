# 📋 TỔNG QUAN DỰ ÁN — WOLVESVILLE VIỆT NAM

## 🎮 VỀ GAME

**Wolvesville** là game suy diễn xã hội (Social Deduction) nhiều người chơi real-time, lấy chủ đề Ma Sói. Người chơi được gán vai trò bí mật và phải suy luận, thảo luận, bỏ phiếu để tìm ra kẻ thù.

### Vòng lặp game cơ bản:
```
[BẮT ĐẦU VÁN]
     │
     ▼
[GIAI ĐOẠN ĐÊM]  ← Sói, Tiên Tri, Bác Sĩ... hành động bí mật
     │
     ▼
[GIAI ĐOẠN SÁNG] ← Thông báo ai chết, ai sống
     │
     ▼
[THẢO LUẬN]      ← Người chơi chat, tranh luận (60-90 giây)
     │
     ▼
[BỎ PHIẾU]       ← Vote treo cổ nghi phạm
     │
     ▼
[KIỂM TRA THẮNG/THUA]
     │
     ├── Còn game? → Lặp lại từ [ĐÊM]
     └── Game xong? → Kết quả & phần thưởng
```

---

## 🏆 ĐIỀU KIỆN THẮNG

| Phe | Điều kiện thắng |
|-----|----------------|
| **Dân Làng** | Loại bỏ hết Sói & kẻ thù |
| **Sói** | Số Sói ≥ số Dân còn lại |
| **Độc Lập** | Tùy vai trò (VD: Kẻ Hề phải bị treo cổ) |

---

## 🔄 CÁC CHẾ ĐỘ CHƠI

| Chế độ | Mô tả | Số người |
|--------|-------|----------|
| **Chơi Nhanh** | Vào game ngay với người lạ | 6–16 |
| **Đấu Hạng** | Có điểm ELO, xếp hạng mùa | 8–16 |
| **Chơi Với Bạn** | Phòng riêng, code mời | 4–16 |
| **Game Tùy Chỉnh** | Tùy chọn vai trò, luật chơi | 4–20 |
| **Sandbox** | Test vai trò, không tính điểm | 1–16 |

---

## 💰 HỆ THỐNG TIỀN TỆ

| Loại | Tên VN | Kiếm bằng | Dùng để |
|------|--------|-----------|---------|
| 🪙 Coins | Vàng | Chơi game, nhiệm vụ | Mua item thường |
| 🌹 Roses | Hoa Hồng | Tặng/nhận từ người chơi khác | Tặng bạn bè |
| 💎 Gems | Ngọc | Nạp tiền thật / Battle Pass | Mua item cao cấp |

---

## 👤 HỆ THỐNG NGƯỜI DÙNG

### Thông tin tài khoản:
- Username, Avatar, Level (1–∞)
- XP tích lũy theo ván
- Bộ sưu tập skin, trang phục, hiệu ứng
- Clan membership
- Lịch sử ván đấu
- Thống kê: tỷ lệ thắng, vai trò hay chơi

### Hệ thống cấp độ:
```
Level 1–10:   Tân Binh
Level 11–25:  Dân Làng
Level 26–50:  Thám Tử
Level 51–100: Thợ Săn
Level 101+:   Huyền Thoại
```

---

## 🛒 CỬA HÀNG & VẬT PHẨM

### Loại vật phẩm:
- **Trang phục nhân vật**: Mũ, quần áo, phụ kiện
- **Avatar frame**: Khung ảnh đại diện
- **Emoji biểu cảm**: Dùng trong chat game
- **Skin vai trò**: Thay đổi hình ảnh vai trò
- **Hiệu ứng**: Animation khi thắng/thua
- **Battle Pass**: Gói theo mùa, nhận thưởng theo cấp

---

## 👥 HỆ THỐNG CLAN

- Tạo/tham gia Clan (tối đa 50 người)
- Clan chat
- Clan challenges hàng tuần
- Bảng xếp hạng Clan
- Clan wars (PvP giữa các clan)

---

## 🔔 HỆ THỐNG THÔNG BÁO & XÃ HỘI

- Danh sách bạn bè (add/block)
- Inbox tin nhắn riêng
- Thông báo game: mời chơi, kết quả, phần thưởng
- Báo cáo người chơi vi phạm
- Hệ thống karma/uy tín

---

## 📊 MODULE PHÁT TRIỂN THEO THỨ TỰ ƯU TIÊN

```
Phase 1 — Nền tảng (MVP)
  ├── Auth (Đăng ký / Đăng nhập / JWT)
  ├── Lobby & Matchmaking cơ bản
  ├── Game Engine: 5 vai trò cốt lõi
  │     (Sói, Dân, Tiên Tri, Bác Sĩ, Thợ Săn)
  └── Chat real-time trong game

Phase 2 — Mở rộng
  ├── Thêm 20+ vai trò
  ├── Hệ thống XP & Level
  ├── Cửa hàng & vật phẩm cơ bản
  └── Bảng xếp hạng

Phase 3 — Xã hội
  ├── Hệ thống bạn bè & Clan
  ├── Đấu hạng (Ranked + ELO)
  ├── Battle Pass
  └── Thống kê chi tiết

Phase 4 — Nâng cao
  ├── Custom game room
  ├── Spectator mode
  ├── Replay ván đấu
  └── Mobile responsive
```

---

*Xem thêm: `FEATURES.md` để biết chi tiết từng tính năng*
*Xem thêm: `PROGRESS.md` để biết tiến độ hiện tại*



# 🐺 Wolvesville Việt Nam

Game Ma Sói Online phiên bản Việt Nam — Clone từ [Wolvesville](https://www.wolvesville.com/).

Ứng dụng real-time sử dụng **Socket.IO**, hỗ trợ chơi cùng Bot AI, hệ thống vai trò đa dạng.

---

## 📋 Mục lục

- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cách chạy Local (MySQL + Redis)](#-cách-chạy-local-mysql--redis)
- [Cách chạy với Docker](#-cách-chạy-với-docker-compose)
- [Hướng dẫn chơi](#-hướng-dẫn-chơi)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Vai trò trong game](#-vai-trò-trong-game)

---

## 💻 Yêu cầu hệ thống

| Công cụ        | Phiên bản tối thiểu | Ghi chú                           |
|----------------|---------------------|-----------------------------------|
| **Node.js**    | 18+                 | Khuyến nghị 20 LTS                |
| **npm**        | 9+                  | Đi kèm Node.js                   |
| **MySQL**      | 8.0+                | Bắt buộc                          |
| **Redis**      | 7+                  | Bắt buộc                          |
| **Docker**     | 24+                 | Tùy chọn (nếu chạy Docker)       |

---

## 🔧 Cách chạy Local (MySQL + Redis)

> **Đây là cách chạy chính** — cần MySQL và Redis đang chạy trên máy local.

### Bước 1: Cài đặt MySQL 8.0

```bash
# Windows: Tải từ https://dev.mysql.com/downloads/installer/
# Hoặc dùng Chocolatey:
choco install mysql

# Tạo database
mysql -u root -p
CREATE DATABASE wolvesville_vn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Import schema

```bash
mysql -u root -p wolvesville_vn < database/schema.mysql.sql
```

### Bước 3: Cài đặt Redis

```bash
# Windows (dùng winget):
winget install --accept-source-agreements --accept-package-agreements Redis.Redis -e

# Kiểm tra Redis đang chạy:
& "C:\Program Files\Redis\redis-cli.exe" ping
# Kết quả: PONG

# Set password cho Redis:
& "C:\Program Files\Redis\redis-cli.exe" CONFIG SET requirepass redis123
```

### Bước 4: Cấu hình `.env`

Đảm bảo file `.env` ở thư mục gốc có nội dung phù hợp:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=wolvesville_vn
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DIALECT=mysql

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

JWT_SECRET=wolvesville_vn_jwt_secret_dev_2026
FRONTEND_URL=http://localhost:3000
```

### Bước 5: Cài đặt dependencies

```bash
# Terminal 1 — Backend
cd backend
npm install

# Terminal 2 — Frontend
cd frontend
npm install
```

### Bước 6: Chạy ứng dụng

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### Bước 7: Mở trình duyệt

1. Truy cập **http://localhost:3000**
2. **Đăng ký** tài khoản mới
3. **Tạo phòng** → **Thêm Bot** → **Bắt đầu chơi!**

---

## 🐳 Cách chạy với Docker Compose

> Cần cài **Docker Desktop** trước khi bắt đầu.

```bash
docker-compose up --build
```

| Service    | URL                         |
|------------|------------------------------|
| Frontend   | http://localhost:3000        |
| Backend    | http://localhost:5000        |
| MySQL      | localhost:3308               |
| Redis      | localhost:6379               |
| Health     | http://localhost:5000/health |

```bash
# Dừng:
docker-compose down

# Dừng + xóa data:
docker-compose down -v
```

---

## 🧪 Tài khoản Test

| Mục           | Giá trị                      |
|---------------|------------------------------|
| **Email**     | `tester@wolvesville.vn`      |
| **Mật khẩu** | `password123`                |

> **Lưu ý**: Tài khoản này dùng cho mục đích development/testing. Đảm bảo đã import schema và chạy backend trước khi đăng nhập.

---

## 🎮 Hướng dẫn chơi

### Tạo phòng & Bắt đầu

1. **Đăng ký / Đăng nhập** tại http://localhost:3000
2. Click **"Tạo Phòng"** trên trang chủ
3. Copy **mã phòng** (6 ký tự) để chia sẻ cho bạn bè
4. Hoặc click **"Tạo Bot"** để thêm bot AI (cần tối thiểu 2 người chơi)
5. Host click **"Bắt Đầu"** khi đủ người

### Luật chơi cơ bản

#### Vòng lặp game:
```
🌙 Đêm (30s) → ☀️ Bình minh (10s) → 💬 Thảo luận (60s) → 🗳️ Bỏ phiếu (30s) → 🌙 Đêm (lặp lại)
```

#### Phe phái:
- **🟢 Phe Dân Làng**: Thắng khi tiêu diệt hết Sói và sát thủ đơn độc
- **🔴 Phe Sói**: Thắng khi số Sói ≥ số người còn lại
- **🟡 Phe Độc Lập**: Mỗi vai có điều kiện thắng riêng

#### Hệ thống bỏ phiếu:
- **Minh bạch**: Mọi người đều thấy ai bỏ phiếu cho ai
- **Thay đổi được**: Có thể đổi phiếu bất cứ lúc nào trong giai đoạn vote
- **Số ghế hiển thị**: Xem số ghế của người đã bỏ phiếu trên mỗi card

#### Vị trí chơi:
- Người chơi xếp theo **vị trí cố định 1-12** (4 cột × 3 hàng)
- Hàng 1: ghế 1-4 | Hàng 2: ghế 5-8 | Hàng 3: ghế 9-12

---

## 📁 Cấu trúc dự án

```
wolvesville/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Redis config
│   │   ├── controllers/     # API controllers
│   │   ├── game/
│   │   │   ├── GameEngine.js    # Vòng lặp game chính (Redis)
│   │   │   ├── GameState.js     # Quản lý state trong Redis
│   │   │   ├── RoleAssigner.js  # Gán vai trò
│   │   │   ├── BotBrain.js      # AI cho bot
│   │   │   └── phases/
│   │   │       ├── NightPhase.js    # Xử lý hành động đêm (30s)
│   │   │       ├── DayPhase.js      # Xử lý bình minh (10s)
│   │   │       ├── DiscussPhase.js  # Cấu hình thảo luận (60s)
│   │   │       └── VotePhase.js     # Xử lý bỏ phiếu (30s)
│   │   ├── middleware/      # Auth & error middleware
│   │   ├── models/          # Sequelize models (MySQL)
│   │   ├── routes/          # Express routes
│   │   ├── socket/
│   │   │   ├── index.js         # Socket.IO setup
│   │   │   ├── lobbyHandler.js  # Phòng chờ
│   │   │   ├── gameHandler.js   # Hành động trong game
│   │   │   └── chatHandler.js   # Chat
│   │   └── server.js        # Server chính (MySQL + Redis)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── GamePage.jsx     # Giao diện game chính
│   │   │   ├── LobbyPage.jsx   # Phòng chờ
│   │   │   ├── LoginPage.jsx   # Đăng nhập
│   │   │   └── RegisterPage.jsx # Đăng ký
│   │   ├── store/
│   │   │   ├── authStore.js     # Zustand auth state
│   │   │   └── socketStore.js   # Zustand socket state
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── database/
│   └── schema.mysql.sql     # Schema MySQL
├── docker-compose.yml
├── .env                     # Biến môi trường
└── README.md                # File này
```

---

## 🎭 Vai trò trong game

### Phe Dân Làng 🟢

| Vai trò     | Icon | Mô tả                                                    |
|-------------|------|-----------------------------------------------------------|
| Dân Làng    | 🏘️   | Không có kỹ năng đặc biệt. Vote ban ngày để tìm Sói.    |
| Tiên Tri    | 🔮   | Mỗi đêm xem hào quang 1 người (Thiện/Ác).               |
| Bác Sĩ      | 💊   | Mỗi đêm cứu sống 1 người.                                |
| Thợ Săn     | 🏹   | Khi bị giết, bắn chết 1 người.                           |
| Phù Thủy    | 🧪   | Có 1 thuốc cứu và 1 thuốc độc (dùng 1 lần).             |
| Vệ Sĩ       | 🛡️   | Bảo vệ 1 người mỗi đêm, hy sinh nếu họ bị tấn công.    |
| Thám Tử     | 🔍   | Theo dõi 1 người ban đêm xem họ có hành động không.      |
| Thị Trưởng  | 👑   | Phiếu vote có giá trị gấp đôi khi tiết lộ danh tính.    |
| Xạ Thủ      | 🔫   | Có 2 viên đạn bạc, bắn ban ngày.                         |
| Cai Ngục    | ⛓️   | Giam 1 người mỗi đêm (vô hiệu hóa + bảo vệ).           |

### Phe Sói 🔴

| Vai trò       | Icon | Mô tả                                                  |
|---------------|------|---------------------------------------------------------|
| Sói Thường    | 🐺   | Mỗi đêm chọn giết 1 người. Biết đồng đội Sói.         |
| Alpha Sói     | 🐺   | Sói đầu đàn. Hào quang hiện Thiện khi bị Tiên Tri soi. |
| Sói Tiên Tri  | 🐺   | Soi hào quang ban đêm cho phe Sói.                     |

### Phe Độc Lập 🟡

| Vai trò        | Icon | Mô tả                                                  |
|----------------|------|---------------------------------------------------------|
| Kẻ Hề          | 🃏   | Thắng nếu bị dân làng treo cổ.                         |
| Sát Nhân        | 🔪   | Mỗi đêm giết 1 người. Thắng khi sống sót cuối cùng.   |
| Hỏa Tặc        | 🔥   | Đổ dầu ban đêm, châm lửa thiêu hàng loạt.             |
| Thần Tình Yêu  | 💘   | Ghép đôi 2 người đêm đầu, 1 chết thì cả 2 chết.      |

---

## ⚙️ Các lệnh hữu ích

```bash
# Backend
cd backend
npm run dev           # Dev server (cần MySQL + Redis)
npm start             # Production

# Frontend
cd frontend
npm run dev           # Dev server (http://localhost:3000)
npm run build         # Build production

# Docker
docker-compose up --build         # Build & chạy tất cả
docker-compose up -d              # Chạy nền
docker-compose down               # Dừng
docker-compose down -v            # Dừng + xóa data
```

---

## 🐛 Xử lý lỗi thường gặp

### Port đã bị chiếm
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MySQL connection refused
- Kiểm tra MySQL đang chạy: `mysql -u root -p`
- Kiểm tra port trong `.env` khớp với MySQL config
- Nếu dùng Docker: port map là `3308:3306`

### Redis connection refused
- Kiểm tra Redis đang chạy: `& "C:\Program Files\Redis\redis-cli.exe" ping`
- Đảm bảo password trong `.env` khớp

---

## 📝 Ghi chú quan trọng

- **Stack chính**: MySQL 8.0 + Redis 7 + Node.js + React (Vite)
- **Trước khi chạy**: Đảm bảo MySQL và Redis đã khởi động
- Game hỗ trợ **2-12 người chơi** (bao gồm bot)
- Bot AI tự động hành động ban đêm và bỏ phiếu ban ngày
- Phase timing khớp với Wolvesville gốc: Night 30s, Discussion 60s, Vote 30s

---

*Phát triển bởi Wolvesville VN Team* 🐺🇻🇳

