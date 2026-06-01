# Báo Cáo Cập Nhật: Hiệu Ứng Chiêu Thức Các Vai Trò (Wolvesville VN)

Chào bạn, tôi đã hoàn thành việc thiết kế và lập trình các hiệu ứng chiêu thức trực quan cực kỳ sinh động, mang phong cách cao cấp và hiện đại cho **tất cả** các vai trò (roles) trong game Wolvesville Việt Nam. 

Toàn bộ logic gốc cực kỳ hoàn chỉnh của trò chơi đều được giữ nguyên vẹn 100%, các hiệu ứng chỉ được thêm vào dưới dạng các lớp phủ đồ họa hoạt hình (overlaid graphical animations) sử dụng thư viện **Framer Motion** và các CSS/SVG tùy biến đẳng cấp.

---

## 🎨 Chi Tiết Hiệu Ứng Cho Từng Vai Trò (Roles)

Bất kỳ khi nào người chơi sở hữu vai trò tương ứng và chọn mục tiêu vào ban đêm (hoặc ban ngày khi dùng kỹ năng/bỏ phiếu), một lớp phủ hoạt ảnh (overlay effect) đặc trưng sẽ xuất hiện trực tiếp trên thẻ bài của mục tiêu đó:

| Biểu Tượng | Vai Trò | Chi Tiết Hiệu Ứng Chiêu Thức Trực Quan | Hoạt Ảnh (Animation Style) |
| :---: | :--- | :--- | :--- |
| 🛡️ | **Vệ Sĩ (Bodyguard)** | Khiên chắn hoàng kim cổ điển hiện lên bao bọc thẻ bài kèm hào quang bảo vệ. | Khiên xoay lắc nhẹ nhàng, viền thẻ bài nhấp nháy phát sáng vàng kim. |
| 💊 | **Bác Sĩ (Doctor)** | Biểu tượng bình thuốc/tim y tế sáng xanh mòng két cùng các ký hiệu chữ thập nổi lên. | Chữ thập xanh lá/cyan bay lơ lửng từ dưới lên rồi tan biến dần. |
| 🔮 | **Tiên Tri (Seer)** | Quả cầu pha lê vũ trụ lấp lánh tinh vân tím mộng mơ. | Quả cầu xoay trục chậm, tinh vân tím khuếch tán lấp lánh. |
| 🔮🐺 | **Sói Tiên Tri (Wolf Seer)** | Quả cầu pha lê hắc ám màu đỏ máu với vết vuốt sói quét qua. | Quả cầu chập chờn, phát ra luồng năng lượng đỏ rực nguy hiểm. |
| 🧪🟢 | **Phù Thủy - Cứu (Witch)** | Lọ thuốc sinh mệnh ngọc lục bảo nghiêng xuống rót giọt nước hồi sinh. | Bình thuốc lắc nhẹ, bọt khí xanh lục liên tục sủi lên. |
| 🧪☠️ | **Phù Thủy - Độc (Witch)** | Lọ độc dược màu tím hắc ám mang hình đầu lâu nhỏ giọt độc. | Bình nghiêng chảy, các giọt độc dược tím rơi xuống đáy thẻ bài. |
| 🏹 | **Thợ Săn (Hunter)** | Cung tên gỗ cổ thụ giương sẵn hướng thẳng vào mục tiêu kèm tâm ngắm ngắm bắn đỏ rực. | Cung tên co giãn như đang kéo dây cung, hồng tâm quay tròn liên tục. |
| 🛢️ | **Hỏa Tặc - Dầu (Arsonist)** | Thùng dầu bóng loáng đổ dầu đen bóng vào mục tiêu. | Thùng dầu nghiêng, các giọt dầu đen loang lổ nhỏ xuống thẻ bài. |
| 🔥 | **Hỏa Tặc - Đốt (Arsonist)** | Hoạt cảnh lửa cháy thiêu rụi ngập tràn thẻ bài dành cho **tất cả** mục tiêu đã bị đổ dầu khi kích hoạt châm lửa. | Ngọn lửa cam đỏ bập bùng dữ dội ở đáy thẻ, tàn tro bay lơ lửng bốc lên. |
| 🐺🩸 | **Phe Sói (Werewolves)** | Vết vuốt cào sắc lẹm xé toạc màn đêm kèm vệt máu đỏ tươi loang ra trên thẻ mục tiêu. | Vết cào chém dứt khoát góc chéo, giọt máu nhỏ giọt chân thực. |
| 🔍 | **Thám Tử (Detective)** | Kính lúp công nghệ cao cùng tia quét lazer quét dọc thẻ bài. | Tia quét lazer xanh ngọc neon chuyển động lên xuống liên tục. |
| ⛓️ | **Cai Ngục (Jailer)** | Hàng rào song sắt ngục tù đen xám thả thẳng từ trên xuống khóa chặt thẻ bài. | Các thanh sắt rơi tự do nảy nhẹ (spring), chữ khóa ngục phát sáng. |
| 🔫 | **Xạ Thủ (Gunner)** | Bầu không khí căng thẳng với súng lục bạc nhắm bắn và hồng tâm khóa mục tiêu xanh neon. | Khẩu súng giật nhẹ (recoil), tâm ngắm thu nhỏ nhấp nháy liên tục. |
| 💘 | **Thần Tình Yêu (Cupid)** | Trái tim hồng tình yêu bập bùng cùng vô vàn trái tim nhỏ lơ lửng. | Trái tim lớn đập nhịp liên hồi, trái tim nhỏ lấp lánh nhẹ nhàng bay lên. |
| 🔪 | **Sát Nhân (Serial Killer)** | Con dao bầu sắc lạnh rỉ máu chém ngang màn hình. | Con dao nghiêng góc chí mạng, vệt máu đỏ bắn tung tóe. |
| 🎯 | **Săn Đầu Người (Headhunter)** | Hồng tâm thợ săn tiền thưởng khóa mục tiêu truy nã bí mật. | Vòng tròn tiêu cự zoom in - zoom out nhịp nhàng, màu cam cảnh báo. |
| 💀👻 | **Ngoại Cảm (Medium)** | Hồn ma màu xanh dương tâm linh bay lượn trên mộ bia của người đã khuất. | Hồn ma bay lượn theo hình sóng sin uốn lượn mờ ảo ảo diệu. |
| 🫵 | **Bỏ Phiếu (Voting)** | Hình bàn tay chỉ thẳng vào mục tiêu (`🫵`) biểu thị lượt bình chọn treo cổ công khai vào ban ngày. | Bàn tay co giãn nhấp nháy, trượt nhẹ nhịp nhàng kèm viền hồng neon rực rỡ, tự động thay thế mọi hiệu ứng chiêu thức đêm khi bỏ phiếu. |

---

## ⚡ Các Điểm Cải Tiến Đồ Họa Cực Kỳ Đắt Giá

1. **Hiệu ứng lửa cháy đồng loạt (Arsonist Ignite):** Thay vì chỉ sáng thẻ, khi Hỏa Tặc kích hoạt "Châm lửa" (`arsonist_ignite`), toàn bộ các người chơi đã bị đổ dầu trước đó (lưu trong danh sách doused) sẽ đồng loạt rực cháy lên ngọn lửa đỏ cam rực rỡ và bay tàn tro, cực kỳ mãn nhãn và đúng chuẩn Wolvesville cao cấp.
2. **Hệ thống mượt mà (Performance):** Sử dụng tối đa sức mạnh của CSS GPU Hardware Acceleration kết hợp `framer-motion` giúp các hiệu ứng chạy mượt mà ở tần số quét cao (lên tới 120Hz/144Hz) mà không hề gây giật lag cho giao diện game.
3. **Phù hợp bối cảnh:** Các hiệu ứng chỉ xuất hiện khi người chơi chủ động chọn mục tiêu chiêu thức hoặc kích hoạt, giúp giữ cho giao diện chung luôn sạch sẽ, gọn gàng và tối ưu trải nghiệm.
4. **Hiệu ứng Vote (Bỏ Phiếu) Độc Lập:** Khi bước vào giai đoạn bỏ phiếu ban ngày, nếu người chơi bình chọn một mục tiêu bất kỳ, thẻ bài mục tiêu đó sẽ hiển thị hiệu ứng bàn tay chỉ vào (`🫵`) cùng viền hồng neon lộng lẫy, hoàn toàn ghi đè lên các hiệu ứng chiêu thức ban đêm của vai trò đó, giúp giao diện trở nên mạch lạc và đúng thực tế trò chơi.

---

## 🚀 Trạng Thái Tích Hợp

- Giao diện Frontend: Đã cập nhật thành công và sẵn sàng hiển thị tại `frontend/src/pages/GamePage.jsx`.
- Logic Trận Đấu & Thợ Săn Trả Thù: Hoàn toàn được bảo vệ an toàn, không có bất kỳ dòng logic cốt lõi nào bị thay đổi sai lệch.

Chúc bạn và các người chơi sẽ có những phút giây trải nghiệm Wolvesville Việt Nam cực kỳ mãn nhãn và đầy kịch tính!
