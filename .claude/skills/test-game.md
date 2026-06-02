# Skill: Kiểm tra (Test) Game Wolvesville

## 🎯 Mục tiêu
Đảm bảo mọi tính năng, logic vai trò và cơ chế phase (Ngày/Đêm) hoạt động ổn định, không có lỗi (regression) sau mỗi lần cập nhật.

## 📋 Hướng dẫn thực hiện (Quy trình Test)

### 1. Chuẩn bị môi trường
- Đảm bảo **MySQL** và **Redis** đang chạy.
- Khởi động Backend (`npm run dev` trong `backend`).
- Khởi động Frontend (`npm run dev` trong `frontend`).
- Truy cập `http://localhost:3000` và đăng nhập bằng tài khoản test (ví dụ: `tester@wolvesville.vn`).

### 2. Thiết lập Trận đấu
- Tạo phòng mới và lấy mã phòng.
- Thêm Bot AI vào phòng để đủ số lượng người chơi tối thiểu (thường là để test các vai trò đặc biệt cần có số lượng người chơi nhất định).
- (Tùy chọn) Chỉnh sửa DB hoặc can thiệp vào `RoleAssigner.js` để ép (force) cấp các vai trò cần test cho Bot hoặc người chơi thực.

### 3. Kiểm tra Cơ chế Cốt lõi (Core Mechanics)
- **Vòng lặp thời gian:** Quan sát sự chuyển đổi mượt mà giữa Đêm (30s) -> Bình minh (10s) -> Thảo luận (60s) -> Bỏ phiếu (30s).
- **Đồng bộ hóa:** Mở 2 tab ẩn danh (2 client) để đảm bảo state được đồng bộ realtime qua Socket.IO mà không bị giật lag hay lệch thông tin.

### 4. Kiểm tra Bot AI (`BotBrain.js`)
- Bot có tự động hành động ban đêm theo đúng kỹ năng của vai trò không?
- Bot có tham gia bỏ phiếu ban ngày hợp lý không? 
- Xử lý tình huống hoà vote (tie-break) có chính xác không?

### 5. Kiểm tra Logic Vai trò (Role Logic)
- Kích hoạt kỹ năng ban đêm của vai trò đang test.
- Đảm bảo logic bảo vệ, tấn công, soi sáng tuân thủ đúng thứ tự ưu tiên (Priority Order).
- Đảm bảo thông tin nội bộ (như danh sách Sói, chat Jailer, kết quả Tiên Tri) không bị leak cho các client khác.

### 6. Xử lý Lỗi & Báo cáo
- Quan sát Console (cả Frontend và Backend) để bắt các unhandled exceptions.
- Nếu có lỗi, tiến hành debug và sửa ngay. Tuyệt đối không để crash vòng lặp (GameEngine).
- **BẮT BUỘC:** Sau khi test xong, ghi đè toàn bộ kết quả đã làm được vào file `baocaotest.md` (ở thư mục gốc). Sau đó, tổng hợp và cập nhật tiến độ vào file `.claude/rules/workflow.md`.
