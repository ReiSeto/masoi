# Skill: Cập nhật Logic Game (Backend)

## 🎯 Mục tiêu
Triển khai hoặc chỉnh sửa cơ chế trò chơi, logic vai trò và vòng lặp phase một cách an toàn, đảm bảo tính nhất quán của dữ liệu.

## 🧠 Nguyên tắc cốt lõi

### 1. Quản lý Trạng thái (Redis)
- **LUÔN LUÔN** đồng bộ trạng thái game (Game State) với Redis. 
- Tránh việc chỉ lưu state trên memory Node.js (`let`, `const` toàn cục) vì khi scale server hoặc crash, state sẽ mất. 
- Mọi thay đổi về máu, trạng thái sống/chết, danh sách bị vote... phải được `await gameState.save()` hoặc tương đương.

### 2. Thứ tự Ưu tiên (Action Priority)
Khi xử lý các hành động ban đêm (Night Phase), phải tuân thủ nghiêm ngặt thứ tự ưu tiên của Wolvesville gốc (đã được ghi chú trong `rules/design.md`).
- *Ví dụ:* Các vai trò bảo vệ (Vệ sĩ, Cai ngục) phải được xử lý trước các vai trò tấn công (Ma sói, Kẻ giết người).

### 3. Bảo mật Thông tin (Socket.IO Emission)
- **Private Data:** Các thông tin nhạy cảm (như vai trò của người khác, kết quả soi của Tiên Tri, chat riêng của Cai Ngục/Sói) CHỈ được emit đến đúng `socket.id` của người có quyền nhận.
- **Public Data:** `io.to(roomId).emit(...)` chỉ dùng cho các sự kiện công khai (người chơi chết, bắt đầu phase mới, tin nhắn chat tổng).

### 4. Cập nhật AI (BotBrain)
- Khi thêm một vai trò hoặc cơ chế mới, **BẮT BUỘC** phải cập nhật `backend/src/game/BotBrain.js`.
- Đảm bảo Bot biết cách sử dụng kỹ năng đó (ví dụ: Bot Vệ sĩ biết chọn mục tiêu để bảo vệ, Bot Hỏa tặc biết khi nào nên tưới xăng, khi nào nên châm lửa).

### 5. An toàn Vòng lặp (Game Engine Safety)
- Hàm chạy vòng lặp (Game Loop) cực kỳ nhạy cảm. Phải bọc `try/catch` cẩn thận ở các phase. 
- Một lỗi logic ở 1 role không được làm crash toàn bộ phòng chơi.

## 🛠️ Quy trình triển khai
1. Sửa/Thêm biến trạng thái trong `GameState.js`.
2. Bổ sung logic xử lý vào file Phase tương ứng (vd: `NightPhase.js` hoặc `VotePhase.js`).
3. Cập nhật `RoleAssigner.js` nếu thêm role mới.
4. Xử lý event lắng nghe trong `socket/gameHandler.js`.
5. Cập nhật `BotBrain.js` để tích hợp AI.
6. **BẮT BUỘC:** Ghi đè những việc đã làm được vào file `kehoachsua.md` và `baocaosua.md`. Sau đó, cập nhật lại tiến độ vào file `.claude/rules/workflow.md`.
