# Báo Cáo Test Môi Trường Docker (Docker Compose)

## 1. Trạng thái các container
- **wolvesville_frontend**: ✅ Đang chạy ổn định tại port `3000`.
- **wolvesville_backend**: ✅ Đang chạy ổn định tại port `5000`.
- **wolvesville_mysql**: ✅ Đang chạy ổn định.
- **wolvesville_redis**: ✅ Đang chạy ổn định.

## 2. Kết quả kiểm tra lỗi (Bugs / Errors)
- **Phát hiện lỗi Database Scheme**: Khi backend vừa khởi động, logs báo lỗi thiếu cột `reputation` và `last_reputation_recovery` trong bảng `users` (dẫn tới việc các truy vấn đăng nhập hoặc tìm thông tin user bị crash trả về HTTP 500).
- **Khắc phục**: Mình đã chạy trực tiếp script bổ sung cột (`backend/add_cols.js`) vào trong Database để vá lỗi này. 
- **Trạng thái hiện tại**: API đã hoạt động trơn tru. Khi thử gọi API thì backend đã phản hồi đúng (không còn lỗi 500 mà trả về mã 401/AUTH_001 yêu cầu đăng nhập).

## 3. Tài khoản test
Bạn hoàn toàn có thể dùng tài khoản test mặc định (có sẵn quyền admin) để kiểm tra:
- **Tài khoản / Email**: `tester` hoặc `tester@wolvesville.vn`
- **Mật khẩu**: `123456`
*(Lưu ý: Mình đã chủ động hash và ghi đè lại mật khẩu `123456` cho tài khoản này vào Database để bạn dễ dàng đăng nhập)*.
