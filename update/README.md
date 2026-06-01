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
