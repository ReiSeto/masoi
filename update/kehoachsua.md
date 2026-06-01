# Kế Hoạch Sửa Lại Logic Wolvesville

## 1. Giao diện Role (LobbyPage.jsx)
- **Nút trở lại:** Thêm một nút `Quay Lại` trong modal hoặc vùng hiển thị danh sách vai trò để set lại `activeTab` về `'play'` hoặc quay lại giao diện chính.
- **Mô tả vai trò (Tooltip/Hover):** Sử dụng `title` attribute hoặc một tooltip component (như framer-motion hoặc css hover) vào mỗi thẻ vai trò trong `ROLES_DISPLAY` để hiển thị `role.desc` (mô tả) khi người chơi đưa chuột vào.

## 2. Chọn lại mục tiêu bảo vệ (GamePage.jsx)
- Với các vai trò bảo vệ/chọn người (bác sĩ, vệ sĩ...), cho phép đổi target.
- Hiện tại, cần kiểm tra logic khi người chơi click vào một người khác trong ban đêm. Nếu action chưa kết thúc đêm, thì cần gọi hàm socket update lại target thay vì khóa luôn (hoặc cập nhật state local và gửi liên tục).

## 3. Xem kết quả check ngay lập tức (GamePage.jsx / Backend GameEngine)
- Các role như tiên tri, thám tử, sói tiên tri.
- Thay vì chỉ tính kết quả ở cuối phase đêm, ngay khi các role này chọn mục tiêu, socket sẽ lập tức phản hồi (emit) về một event chứa kết quả (VD: aura là gì, vai trò là gì) để cập nhật UI ngay lúc chọn.

## 4. Thanh kỹ năng chủ động cho các role đặc biệt (GamePage.jsx)
- Ở giao diện chính dưới danh sách 12 người, thay vì một thanh ngang đơn giản, chuyển thành vùng hiển thị **ô skill** (dựa theo role).
- **Thị trưởng:** Nút lật bài / show role.
- **Phù thủy:** 2 ô skill (1 bình cứu, 1 bình độc) với icon phù hợp, kích hoạt ban đêm.
- Các skill có thể click để ưu tiên (kích hoạt) tùy thuộc vào phase (ngày/đêm) và số lượt sử dụng còn lại.

## 5. Hiển thị đồng đội phe sói (GameEngine.jsx / RoleAssigner.js)
- Chỉ gửi danh sách phe sói cho những người cùng phe sói (hoặc Sói Tiên Tri, Alpha).
- Dân làng hay Độc lập không thể nhìn thấy phe sói trừ phi thành viên phe sói đó đã chết và bị lộ diện (như bất kì người chơi nào chết khác).

## 6. Các tính năng/logic phụ (nếu có)
- Tinh chỉnh CSS cho tooltips và layout.
- Rà soát các bug phát sinh.

## 7. Giải quyết vấn đề đè phase game cũ (Ghost Game)
- Cập nhật logic `GameEngine` và `lobbyHandler`: khi người chơi thoát, ngắt kết nối đúng cách khỏi GameEngine đang chạy.
- Nếu không còn người thật (human) nào trong game, tự động kết thúc (end game) để tránh chạy nền.

## 8. Cơ chế uy tín (Reputation System)
- Thêm trường `reputation` (mặc định 100) và `last_reputation_recovery` vào bảng `users`.
- Trừ 10 điểm uy tín nếu người chơi thoát khỏi game đang diễn ra (chỉ trừ khi trong phòng còn người thật khác, không tính bot).
- Phục hồi 1 điểm uy tín sau mỗi giờ khi đăng nhập.

## 9. Cập nhật Logo hiện đại
- Thay thế icon sói mặc định bằng một hình ảnh logo Sói hình học hiện đại, có các chi tiết neon hồng và cam để phù hợp với UI game.

## 10. Chọn role tùy chỉnh cho Chủ Phòng
- Cho phép chủ phòng (Host) chọn cấu hình vai trò tùy ý theo số lượng người chơi.
- Bổ sung UI trên `LobbyPage` để host pick từng role (có thể trùng lặp) và gửi `roleConfig` tới backend khi bắt đầu game.

## 11. Tinh chỉnh logic vai trò chuyên sâu (Jailer, Arsonist, Seer, Gunner)
- **Jailer (Cai Ngục):**
  - Khắc phục lỗi hiển thị hào quang Thiện ban ngày bằng cách ẩn event `seer_result` cho Cai Ngục, phát triển sự kiện `game:jailer_target` riêng tư và hiển thị badge `⛓️ Sẽ giam` màu xanh dương độc quyền trên thẻ bài mục tiêu.
  - Sửa lỗi trì hoãn xử tử: Chuyển từ kiểm tra `lastJailed` sang `nextJailed` trong đêm để Cai Ngục có thể lập tức đưa ra quyết định xử tử mục tiêu đang giam giữ ngay trong đêm đầu tiên giam.
- **Hỏa Tặc (Arsonist):**
  - Đảm bảo cơ chế châm lửa thiêu cháy mục tiêu sẽ loại bỏ người chơi lập tức và hiển thị RIP ngay sáng hôm sau.
  - Cập nhật cơ chế phòng ngự: Kháng sát thương tuyệt đối khi bị bầy Sói tấn công trực tiếp vào ban đêm, tương tự như Sát Nhân (Serial Killer).
- **Tiên Tri (Seer):**
  - Cải tiến tính năng soi: Thay vì chỉ hiển thị Hào quang (Thiện/Ác), Tiên Tri sẽ nhìn thấy chính xác thẻ bài vai trò (roleSlug) của mục tiêu ngay lập tức. Sói Tiên Tri vẫn giữ nguyên cơ chế xem hào quang như cũ để giữ tính cân bằng.
- **Xạ Thủ (Gunner):**
  - Thắt chặt giới hạn bắn ban ngày: Xạ Thủ chỉ được phép bắn tối đa 1 viên đạn trong mỗi ngày (mỗi vòng đấu). Để bắn viên đạn thứ hai, Xạ Thủ bắt buộc phải chờ sang ngày tiếp theo (cách 1 ngày) mới có thể kích hoạt lại kỹ năng.
  - Chuyển kỹ năng bắn thành ô kỹ năng chủ động 🔫 hiển thị dưới thanh công cụ ban ngày thay vì tự động mở popup tự động.

## 12. Cơ chế Xử tử (Cai ngục) và Phóng hỏa (Hỏa tặc) lập tức tử vong
- **Cai Ngục (Jailer):** Khi thực hiện kỹ năng xử tử (`jailer_execute`) ban đêm, mục tiêu đang bị giam sẽ bị giết ngay lập tức. Hệ thống phát thông báo xử tử tức thời và cập nhật danh sách sống/chết, kiểm tra thắng cuộc lập tức thay vì đợi đến sáng.
- **Hỏa Tặc (Arsonist):** Khi thực hiện kỹ năng phóng hỏa (`arsonist_ignite`) ban đêm, tất cả các mục tiêu đã bị đổ dầu sẽ bị thiêu cháy và tử vong lập tức. Trạng thái sống/chết được cập nhật và thông báo phóng hỏa được phát ngay trong đêm.

## 13. Tinh chỉnh Thám tử, Hủy vote & Cơ chế Treo cổ Quá bán (Lynch Threshold)
- **Thám Tử (Detective):** Đơn giản hóa thông báo kết quả check phe của 2 mục tiêu: Chỉ báo họ CÙNG một phe hoặc KHÔNG cùng một phe, ẩn đi phe phái cụ thể (Dân làng/Sói/Độc lập) để giữ tính bảo mật thông tin chuẩn game gốc.
- **Cơ chế Hủy vote (Phiếu trắng):** Cho phép người chơi hủy bỏ vote của mình (quay về trạng thái chưa vote ai/phiếu trắng) bằng cách click vào chính mục tiêu họ đang vote. Redis database sẽ xóa bản ghi vote của user và đồng bộ state local frontend.
- **Treo cổ Quá bán (Lynch Threshold):** 
  - Tích hợp công thức tính ngưỡng treo cổ: `Math.floor(aliveCount / 2)` (Một nửa số người sống, làm tròn xuống).
  - Người bị vote nhiều nhất chỉ bị treo cổ nếu số phiếu đạt hoặc vượt ngưỡng này.
  - Hiển thị trực quan thông tin số người sống và ngưỡng phiếu cần đạt ngay trên thanh tiêu đề chính của màn hình chơi game để tất cả người chơi nắm bắt thời gian thực.


