## Sửa lỗi hiệu ứng Cai ngục (Jailer)
- **Vấn đề**: Khi Cai ngục quyết định giam mục tiêu vào ban ngày nhưng sau đó bị giết, trạng thái `nextJailed` không được xóa đi, khiến cho mục tiêu tiếp tục bị hiển thị hiệu ứng giam cầm vào mỗi đêm tiếp theo trên màn hình (đặc biệt là trên màn hình của Cai ngục đã chết, hoặc những nơi lưu state).
- **Kế hoạch**:
  1. Trong backend (`GameEngine.js` và `NightPhase.js`), bổ sung kiểm tra nếu Cai ngục đã chết (`!p.isAlive`) nhưng vẫn còn lưu `nextJailed`, thì hệ thống tự động reset `nextJailed = null` để xóa bỏ hoàn toàn trạng thái này.
  2. Trong frontend (`GamePage.jsx`), bổ sung điều kiện `isAlive` của Cai ngục vào logic hiển thị kênh chat riêng tư `jail` và logic hiển thị hiệu ứng song sắt giam cầm trên avatar nhân vật. Đảm bảo Cai ngục chết thì không còn nhìn thấy hiệu ứng hay có quyền chat giam ngục.

## Kế hoạch Cập nhật Responsive Toàn Diện
- **Mục tiêu**: Đảm bảo toàn bộ dự án (LobbyPage, GamePage) có thể hoạt động hoàn hảo trên thiết bị di động (Mobile), Tablet và Desktop. Tăng cường UX/UI theo hướng hiện đại, chuẩn Wolvesville.
- **Chiến lược**:
  1. Thay thế các layout lưới (`grid-cols-4`, `grid-cols-5`) tĩnh thành dạng responsive thích ứng theo Tailwind (`sm:`, `md:`, `lg:`).
  2. Sử dụng Dynamic Viewport Height (`min-h-[100dvh]`) thay cho `min-h-screen` để tương thích tốt nhất với màn hình điện thoại có thanh địa chỉ tự ẩn.
  3. Cấu trúc lại luồng giao diện với thuộc tính `order`: trên Mobile, màn hình chơi Game Board sẽ được xếp lên đầu tiên thay vì nằm dưới sidebar lịch sử/chat. Cấu trúc `flex-col` trên di động, và `flex-row` khi có màn hình lớn.
  4. Hỗ trợ hiển thị sidebar cuộn mềm mại cho trải nghiệm đa nền tảng tối ưu nhất.

## Kế hoạch Sửa Lỗi Icon Sói (wolf-icon.svg)
- **Mục tiêu**: Căn giữa và tránh việc icon sói (wolf-icon.svg) bị lệch, mất góc khi hiển thị.
- **Chiến lược**: Thay đổi thuộc tính tọa độ `x`, `y` và thêm thuộc tính căn chỉnh `text-anchor`, `dominant-baseline` vào thẻ `<text>` trong file SVG để đưa ký tự vào chính giữa viewport.
