# Skill: Cập nhật Hiệu ứng & UI (Frontend)

## 🎯 Mục tiêu
Tạo ra trải nghiệm người dùng (UX) mượt mà, sống động với các hiệu ứng hình ảnh/âm thanh mà không làm gián đoạn gameplay.

## 🎨 Nguyên tắc cốt lõi

### 1. Tech Stack Hiệu Ứng
- **Framer Motion (`<motion.div>`)**: Sử dụng cho các animation phức tạp như nảy (spring), mờ dần (fade), trượt (slide). Tránh dùng CSS animation thuần nếu state phức tạp.
- **Tailwind CSS**: Dùng để styling nhanh chóng. Đảm bảo UI tương thích tốt trên giao diện lưới 4x3 (Grid) của điện thoại và desktop.
- **Lucide React**: Sử dụng bộ icon này cho các vai trò và hành động.

### 2. Quản lý Thời gian (Timing)
- Các hiệu ứng đặc biệt (ví dụ: lửa cháy của Hỏa tặc, chấn song sắt của Cai ngục, phát súng của Xạ thủ) nên diễn ra trong khoảng **1.5 đến 2 giây** để người chơi kịp nhận biết.
- Sử dụng `setTimeout` kết hợp với React state (hoặc Zustand) để tự động dọn dẹp (clear) hiệu ứng sau khi hết thời gian, đưa UI về trạng thái bình thường.

### 3. Không Cản trở Tương tác (Non-blocking)
- Các hiệu ứng Overlay (hiển thị chữ to, biểu tượng chèn lên màn hình) **phải** được set thuộc tính `pointer-events-none` trong Tailwind.
- Không để các text như "Đã chọn Vote", "Đang bảo vệ" che khuất thao tác click của người chơi khác.
- Z-Index phải được quản lý kỹ lưỡng (VD: Overlay toàn màn hình > Tooltip > Avatar người chơi).

### 4. Đồng bộ với Socket
- Lắng nghe các event từ Backend (như `skill_effect`, `player_voted`, `phase_change`) trong `socketStore.js` hoặc `useEffect`.
- Kích hoạt state của hiệu ứng ngay lập tức khi nhận được event để giảm cảm giác độ trễ (latency).

### 5. Thông báo (Toast Notifications)
- Sử dụng `react-hot-toast` cho các thông báo hệ thống ngắn gọn (VD: "Bạn đã bị cấm ngôn", "Chưa thể sử dụng kỹ năng lúc này").
- Đừng lạm dụng toast, ưu tiên hiệu ứng hình ảnh (Visual Effects) trực tiếp lên thẻ nhân vật (Player Card).

## 🛠️ Quy trình triển khai
1. Định nghĩa Event Socket mới (nếu cần) từ Backend.
2. Cập nhật `store` (Zustand) ở Frontend để lưu trạng thái hiệu ứng (VD: `arsonistTargets`, `jailedTarget`).
3. Tạo Component hoặc cập nhật `PlayerCard.jsx` để render thẻ `<motion.div>` bọc hiệu ứng.
4. Đặt `setTimeout` để dọn dẹp state hiệu ứng.
5. Thử nghiệm trên UI đảm bảo animation mượt, không che nút bấm.
6. **BẮT BUỘC:** Ghi đè những thay đổi hiệu ứng đã làm được vào file `kehoachsua.md` và `baocaosua.md`. Sau đó, cập nhật lại tiến độ vào file `.claude/rules/workflow.md`.
