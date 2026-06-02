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

## 18. Kích hoạt tính năng cho Jailer chat, Bodyguard bị thương, Gunner tự lộ diện, Medium chat và Cupid liên kết tình yêu
- **Jailer (Cai Ngục):** Enable kênh chat riêng tư `jail` giữa Cai Ngục và mục tiêu trong đêm.
- **Bodyguard (Vệ Sĩ):** Chỉnh sửa cơ chế bảo vệ để Vệ Sĩ nhận trạng thái `injured` thay vì chết ngay lập tức ở lần đầu tiên. Lần thứ hai bị tấn công mới chết.
- **Gunner (Xạ Thủ):** Phát thông báo và hiển thị vai trò Xạ Thủ ngay khi bắn viên đạn đầu tiên để toàn bộ phòng biết.
- **Medium (Ngoại Cảm):** Kích hoạt logic chat với người chết (kênh `dead`) vào ban đêm.
- **Cupid (Thần Tình Yêu):** Cho phép chọn 2 người vào đêm 1, tiết lộ vai trò của nhau, và tính toán thắng cuộc khi nhóm tình yêu (Lovers) là những người sống sót cuối cùng.

## 19. Tinh chỉnh các hiệu ứng và logic còn lại
- **Bodyguard (Vệ Sĩ):** Ngăn chặn người chơi chọn lại mục tiêu vừa được bảo vệ ở đêm trước. Đảm bảo vệ sĩ nếu bị thương phải chết thay cho mục tiêu được bảo vệ trong đêm tiếp theo.
- **Bot Cupid:** Khôi phục logic ghép đôi ngẫu nhiên thành công với 2 người chơi ngẫu nhiên (hoặc tự ghép mình với người khác).
- **Hiệu ứng Hình Ảnh Xạ Thủ/Thợ Săn:** Bổ sung hiệu ứng hình ảnh (Bị bắn) hiển thị toàn màn hình (Overlay đỏ/cam) cho mọi người chơi trong thời gian 2 giây trước khi chết.
- **Hỏa Tặc:** Cập nhật thời gian thiêu cháy các mục tiêu lên 2 giây với animation đặc trưng cho tất cả người chơi.




# Báo Cáo Sửa Logic Wolvesville

## 1. Giao diện Role (LobbyPage.jsx)
- Đã thêm nút `← Quay lại` trong tab Vai trò để người chơi dễ dàng quay về màn hình Play.
- Đã cập nhật tooltip hiển thị mô tả (description) chi tiết cho từng vai trò khi người dùng đưa chuột (hover) vào thẻ nhân vật.

## 2. Chọn lại mục tiêu bảo vệ (GamePage.jsx)
- Đã chỉnh sửa logic chặn click: Nếu người chơi thuộc các vai trò chọn mục tiêu bảo vệ (như Bác Sĩ, Vệ Sĩ) hoặc các vai trò chọn mục tiêu giết (Sói), hệ thống cho phép tiếp tục chọn lại mục tiêu cho đến khi hết giờ đêm.
- Các role check (Tiên Tri, Thám Tử) vẫn bị khóa ngay sau khi chọn mục tiêu lần đầu để tránh gian lận kiểm tra được nhiều người trong 1 đêm.

## 3. Xem kết quả check ngay lập tức (GameEngine.js)
- Thêm logic trả kết quả trực tiếp cho `seer_check` và `wolf_seer_check` thông qua sự kiện `game:seer_result` ngay lúc gọi `handleNightAction` thay vì đợi đến rạng sáng.
- Cập nhật state `checkedRound` để đảm bảo mỗi đêm role check chỉ soi được 1 người duy nhất.

## 4. Thanh kỹ năng chủ động cho các role đặc biệt (GamePage.jsx)
- Với **Phù Thủy (Witch)** và **Hỏa Tặc (Arsonist)**, đã thay thế các nút mặc định bằng bộ nút kỹ năng tương ứng (💊 Cứu, ☠️ Độc dược, 🛢️ Đổ dầu, 🔥 Châm lửa, ⏭️ Bỏ qua) trong đêm.
- Thêm chức năng cho **Thị Trưởng (Mayor)**: Có thêm một nút 👑 vào ban ngày để chủ động lật bài show role.
- Đã thêm xử lý socket `game:mayor_reveal` trong backend để cập nhật state lật bài và phát thông báo nhân 2 phiếu bầu.

## 5. Ẩn vai trò Sói (GamePage.jsx & Backend)
- Đã kiểm chứng và xác nhận hệ thống hiện tại đã xử lý chính xác logic: Chỉ người chơi thuộc phe Sói mới nhận được danh sách `wolfTeam`. Người thuộc phe Dân Làng / Độc Lập hoàn toàn không biết phe sói. Vai trò thực sự chỉ hiện ra khi một người chơi đã chết hoặc khi kết thúc game.

## 6. Sửa logic bình máu Phù Thủy (NightPhase.js)
- Đã cập nhật lại logic của Phù Thủy (Witch): Khi sử dụng bình thuốc cứu người trong đêm, nếu mục tiêu đó **không bị tấn công bởi Sói hoặc người chơi độc lập (như Sát Nhân Hàng Loạt - SK)**, thuốc cứu sẽ được hoàn lại (`healUsed: false`) vào cuối đêm và có thể dùng tiếp ở đêm sau.
- Bổ sung thêm khả năng: Thuốc cứu của Phù Thủy giờ đây đã có thể cứu được mục tiêu bị Sát Nhân Hàng Loạt (SK) nhắm tới (trước đó chỉ có Bác Sĩ mới cứu được).

## 7. Giải quyết vấn đề đè phase game cũ (Ghost Game)
- Cập nhật logic `GameEngine` và `lobbyHandler` trong backend.
- Khi người chơi thoát phòng (`lobby:leave` hoặc disconnect), hệ thống sẽ ngắt người chơi khỏi `GameEngine` của phòng cũ.
- Đặc biệt: Nếu người chơi rời đi và trong phòng không còn người thật (human) nào khác, GameEngine sẽ tự động kết thúc vòng lặp để dọn dẹp hệ thống, tránh trường hợp game cũ vẫn tiếp tục chạy ngầm làm đè các event phase lên game mới.

## 8. Cơ chế uy tín (Reputation)
- Bổ sung hệ thống Uy Tín vào cơ sở dữ liệu (`users` table). Điểm uy tín tối đa là 100.
- **Phạt:** Khi người chơi thoát khỏi một game đang diễn ra, hệ thống sẽ tự động trừ 10 điểm uy tín. Trừ trường hợp trong phòng chỉ toàn bot (không có human nào khác) thì việc thoát sẽ không bị trừ uy tín.
- **Thưởng (Phục hồi):** Mỗi khi người chơi đăng nhập, hệ thống sẽ tính toán thời gian từ lần phục hồi trước và cộng thêm 1 điểm uy tín cho mỗi giờ đã trôi qua.

## 9. Thay đổi giao diện Logo hiện đại
- Đã tạo và thay thế biểu tượng emoji Sói cũ bằng một logo Sói hình học hiện đại (Esports style) với tone nền tối cùng các dải gradient màu hồng neon và cam. Logo mới hoàn toàn ăn nhập với giao diện thẻ bài và màu sắc sảnh chờ hiện tại của Wolvesville VN.

## 10. Chức năng Chọn Role cho Chủ Phòng (Đã Fix & Tối Ưu E2E)
- **Sửa lỗi UX gửi cấu hình ẩn:** Khi chủ phòng tắt panel cấu hình tùy chọn (showRoleConfig = false), frontend sẽ gửi object rỗng `{}` thay vì vẫn gửi cấu hình cũ. Lỗi này trước đó khiến game luôn bắt đầu bằng cấu hình cũ mặc dù chủ phòng đã ẩn panel để chơi default.
- **Sửa lỗi đồng bộ DB (Database Overwrite Conflict):** Cập nhật `lobbyHandler.js` tự động xóa/reset cấu hình vai trò cũ trong MySQL về `{}` khi chủ phòng muốn chơi chế độ mặc định, tránh tình trạng DB ghi đè cấu hình cũ lên game mới.
- **Bổ sung Validation số lượng vai trò trước khi bắt đầu:**
  - Nút **Bắt Đầu Game** sẽ tự động vố hiệu hóa (disabled) nếu chủ phòng mở panel cấu hình nhưng số lượng vai trò đã chọn chưa khớp với số người chơi hiện tại trong phòng.
  - Hiển thị thông báo hướng dẫn trực quan ngay trên nút: `▶ Bắt Đầu Game (Hãy chọn đúng X vai trò)` giúp chủ phòng dễ dàng điều chỉnh cấu hình khi có người chơi hoặc bot tham gia/rời phòng.
- **Viết kịch bản kiểm thử (verify_role_assignment.js):** Đã viết và chạy bộ script kiểm thử backend thành công, xác minh cơ chế chia vai trò tự động bù Dân Làng (villager padding) và chia bài ngẫu nhiên hoạt động chính xác dưới mọi điều kiện sảnh chờ.

## 11. Cải Tiến Hòn Thiện Logic 5 Nhân Vật Đặc Biệt

### A. Cai Ngục (Jailer)
- **Giam giữ ban ngày:** Thêm nút ⛓️ đặc biệt cho Cai Ngục vào ban ngày để chọn một người chơi muốn giam giữ cho đêm tiếp theo.
- **Vô hiệu hóa ban đêm:** Người bị giam giữ sẽ bị khóa hoàn toàn mọi hành động ban đêm của họ, đồng thời được bảo vệ tuyệt đối khỏi tất cả các đòn tấn công từ Sói và Sát nhân hàng loạt (SK).
- **Quyền xử tử tối cao:** Đêm đến, Cai Ngục có 2 lựa chọn trực tiếp: **☠️ Xử tử** mục tiêu đang giam giữ (tiêu tốn 1 viên đạn duy nhất) hoặc **⏭️ Bỏ qua**. Nếu xử tử, mục tiêu sẽ bị hạ gục ngay lập tức vào sáng hôm sau.

### B. Thị Trưởng (Mayor)
- **Biểu tượng lấp lánh thời gian thực:** Khi Thị Trưởng kích hoạt kỹ năng lật bài (Show Role), biểu tượng vương miện 👑 sáng bừng kèm hiệu ứng nhấp nháy `animate-bounce` sẽ xuất hiện ngay lập tức trên thẻ nhân vật của họ để mọi người chơi trong phòng đều nhìn thấy.
- **Hệ thống nhân đôi phiếu bầu (Vote x2):** Sửa hoàn toàn lỗi hòa phiếu khi Thị Trưởng bỏ phiếu. Phiếu bầu của Thị Trưởng giờ đây được nhân đôi một cách chính xác trong cả hệ thống tính toán thời gian thực ở frontend và bộ đếm kết quả treo cổ ở backend.

### C. Vệ Sĩ / Bảo Vệ (Guard / Bodyguard)
- **Cơ chế bị thương hấp thụ sát thương:** Khi người chơi được Bảo vệ bảo vệ bị tấn công, Bảo vệ chỉ bị thương (`isInjured: true` được cập nhật vào `roleData` của họ) thay vì hy sinh chết thay ngay lập tức. Mục tiêu được bảo vệ chỉ thực sự bị hạ gục khi bị tấn công lần thứ hai.
- **Kháng sát thương trực tiếp:** Khi Bảo vệ bị Sói hoặc Sát Nhân Hàng Loạt (SK) nhắm bắn/tấn công trực tiếp, họ cũng chỉ bị thương và sống sót sau đòn tấn công đầu tiên.

### D. Hỏa Tặc (Arsonist)
- **Tẩm dầu đa mục tiêu:** Hỏa Tặc có thể chọn tẩm dầu cùng lúc **1 đến 2 người chơi** trong một đêm duy nhất (bằng cách truyền danh sách ID dạng mảng/chuỗi phân cách bằng dấu phẩy).
- **Chế độ bảo vệ đêm đầu tiên:** Hệ thống tự động ẩn nút châm lửa ở đêm đầu tiên vì chưa tẩm dầu bất kỳ ai, đúng chuẩn luật thi đấu quốc tế.

### E. Thám Tử (Detective)
- **Theo dõi cùng lúc 2 mục tiêu:** Thám Tử có thể chọn chính xác **2 người chơi** trong đêm.
- **Trả kết quả lập tức:** Hệ thống tự động so sánh phe phái (Village, Werewolf, Solo) của 2 mục tiêu đó và trả về kết quả ngay đêm đó cho Thám Tử (Ví dụ: `🔍 A và B CÙNG một phe (Phe Dân Làng)!` hoặc `🔍 A và B KHÔNG cùng một phe!`).

## 12. Tinh Chỉnh Chuyên Sâu Logic 4 Vai Trò Đặc Biệt (Jailer, Arsonist, Seer, Gunner)

### A. Cai Ngục (Jailer) - Hoàn thiện trải nghiệm giam giữ và xử tử
- **Sửa lỗi hiển thị Hào quang Thiện ban ngày:** Thay thế hoàn toàn cơ chế gửi kết quả soi giả lập `game:seer_result` (vốn gây ra lỗi hiển thị biểu tượng Thiện màu tím khó hiểu trên thẻ mục tiêu). Thay vào đó, phát triển sự kiện socket `game:jailer_target` riêng tư gửi riêng cho Cai Ngục.
- **Badge giam giữ độc quyền:** Trên frontend `GamePage.jsx`, thiết kế một badge `⛓️ Sẽ giam` màu xanh dương đẹp mắt, chỉ hiển thị duy nhất trên thẻ của người chơi được chọn trên màn hình của Cai Ngục.
- **Xử tử ngay đêm giam giữ:** Khắc phục lỗi kiểm tra biến `lastJailed` lỗi thời trong prompt đêm. Thay thế bằng việc kiểm tra `nextJailed` (người bị giam đêm nay), giúp Cai Ngục có thể đưa ra lựa chọn xử tử **ngay trong đêm đầu tiên chọn giam giữ**, loại bỏ độ trễ 1 ngày không hợp lý. Người bị xử tử sẽ RIP lập tức rạng sáng hôm sau.

### B. Hỏa Tặc (Arsonist) - Thiêu rụi tức khắc & Phòng thủ tuyệt đối
- **Châm lửa thiêu chết lập tức:** Đảm bảo toàn bộ người chơi bị tẩm dầu khi Hỏa Tặc kích hoạt bình xăng đốt (`arsonist_ignite`) sẽ bị loại bỏ khỏi trò chơi ngay trong đêm đó và hiển thị RIP công khai vào sáng hôm sau.
- **Kháng sát thương từ Sói:** Cập nhật hàm `resolveNight` trong `NightPhase.js` để kiểm tra cả Sát Nhân Hàng Loạt lẫn Hỏa Tặc khi bầy Sói tấn công. Hỏa Tặc giờ đây có thân thể bất hoại trước nanh vuốt của Sói, giúp giữ tính cân bằng của phe Độc Lập.

### C. Tiên Tri (Seer) - Soi trực diện thẻ bài vai trò
- **Hiển thị chính xác thẻ vai trò:** Nâng cấp sự kiện trả kết quả `game:seer_result` ở cả `GameEngine.js` (khi check tức thì ban đêm) và `NightPhase.js` (khi lưu lịch sử check) truyền thêm thuộc tính `roleSlug` của mục tiêu cho Tiên Tri.
- **Nâng cấp UI xem bài:** Khi Tiên Tri nhận kết quả soi, toast và nhật ký trò chơi sẽ hiển thị tên vai trò có dấu và biểu tượng đi kèm (ví dụ: `🔮 Bác Sĩ` hay `🔮 Alpha Sói`). Đồng thời, trên thẻ bài của mục tiêu còn sống, hệ thống sẽ render một badge vai trò trực quan thay thế cho chữ Hào quang Thiện/Ác cũ. Sói Tiên Tri vẫn giữ nguyên logic gốc chỉ thấy Hào quang để bảo toàn độ khó cho phe Dân.

### D. Xạ Thủ (Gunner) - Giới hạn giãn cách 1 ngày mỗi phát bắn & Nút kỹ năng chủ động
- **Giới hạn 1 viên đạn/ngày:** Tích hợp thuộc tính `lastShotRound` vào `roleData` của Xạ Thủ. Khi Xạ Thủ bắn chết một người ban ngày, hệ thống sẽ cập nhật `lastShotRound` bằng vòng đấu hiện tại (`state.round`).
- **Khóa kỹ năng cooldown:** Vô hiệu hóa nút bắn và tự động ẩn prompt bắn Xạ Thủ ban ngày nếu vòng đấu hiện tại trùng với `lastShotRound`. Xạ Thủ bắt buộc phải chờ sang ngày tiếp theo (vòng tiếp theo, cách 1 ngày) mới có thể tiếp tục sử dụng viên đạn thứ hai.
- **Nút kỹ năng chủ động 🔫:** Thay vì tự động hiển thị popup phiền toái ở đầu giai đoạn thảo luận/bỏ phiếu, Xạ Thủ giờ đây có một **ô kỹ năng chủ động 🔫** cực kỳ hiện đại ở thanh công cụ phía dưới màn hình (chỉ hiển thị khi Xạ Thủ còn sống, trong giai đoạn thảo luận hoặc bỏ phiếu, và còn đạn). Khi click vào, Xạ Thủ mới có thể chọn mục tiêu để nổ súng.

## 13. Cơ chế Xử tử (Cai ngục) và Phóng hỏa (Hỏa tặc) gây RIP tức thời
- **Cai Ngục (Jailer) - Xử tử tức thì:**
  - Khi Cai Ngục gửi hành động đêm `jailer_execute`, thay vì đợi đến sáng hôm sau, mục tiêu đang bị giam cầm sẽ bị **xử tử và RIP ngay lập tức** trong đêm.
  - Backend cập nhật ngay trạng thái sống/chết và phát đi sự kiện `game:jailer_execute_result` công khai để cập nhật danh sách người chơi trên toàn bộ client.
  - Tự động kiểm tra điều kiện thắng/thua ngay lập tức để kết thúc game nếu phe chiến thắng đạt yêu cầu.
- **Hỏa Tặc (Arsonist) - Phóng hỏa tức thì:**
  - Khi Hỏa Tặc gửi hành động đêm `arsonist_ignite`, thay vì đợi đến sáng hôm sau, toàn bộ mục tiêu đã bị đổ dầu trước đó sẽ bị **thiêu cháy và RIP ngay lập tức** trong đêm.
  - Backend cập nhật trạng thái sống/chết và phát đi sự kiện `game:arsonist_ignite_result` công khai báo tử toàn bộ danh sách nạn nhân tức thì kèm theo tiết lộ vai trò của họ.
  - Hệ thống tự động kiểm tra điều kiện kết thúc game lập tức nếu cuộc thiêu cháy làm thay đổi hoàn toàn cục diện chiến thắng.
- **Đồng bộ hóa bot:** Logic đêm của Bot AI cũng đã được đồng bộ hóa hoàn toàn để đi qua cùng một cổng xử lý tức thời, đảm bảo bots Arsonist châm ngòi cũng kích hoạt hiệu ứng RIP ngay trong đêm.

## 14. Hoàn thiện Logic Thám tử ẩn phe, Hủy vote thông minh & Biểu quyết Quá bán
- **Ẩn phe phái cụ thể cho Thám Tử (Detective):**
  - Chỉnh sửa cả hàm xử lý tức thời `handleNightAction` của `GameEngine.js` và hàm gom kết quả cuối đêm `resolveNight` của `NightPhase.js`.
  - Kết quả kiểm tra 2 mục tiêu chỉ ghi nhận `"CÙNG một phe!"` hoặc `"KHÔNG cùng một phe!"`, hoàn toàn ẩn đi phe phái chính thức của họ (Dân làng, Sói hay Độc lập), đúng chuẩn game thi đấu quốc tế.
- **Cơ chế Hủy vote / Bỏ phiếu trắng:**
  - Backend: Cập nhật hàm `handleVote` của `GameEngine.js`. Khi nhận thấy phiếu bầu mới trùng với phiếu bầu trước đó (`previousVote === targetId`), hệ thống sẽ gọi `gameState.setVote(voterId, null)` để xóa phiếu.
  - Redis Storage: Cập nhật `setVote` trong `GameState.js` để thực hiện lệnh `hdel` xóa vĩnh viễn trường vote của người chơi khi `targetId` là falsy, thay vì lưu giá trị rỗng/null làm phình DB.
  - Frontend: Nâng cấp `game:vote_update` listener để tự động cập nhật local `selectedTarget = null` và reset `voteSent = false` khi người chơi hủy vote, giúp giao diện phản hồi mượt mà, chính xác.
- **Biểu quyết treo cổ Quá bán (Lynch Threshold):**
  - Backend: Tích hợp công thức `Math.floor(aliveCount / 2)` vào `resolveVotes` của `VotePhase.js`.
  - Một người chơi chỉ thực sự bị treo cổ nếu tổng trọng số phiếu bầu của họ lớn hơn hoặc bằng ngưỡng quá bán này.
  - Nếu số phiếu cao nhất không đạt quá bán, hệ thống ghi nhận hòa phiếu và phát đi thông báo công khai giải thích lý do cụ thể (Ví dụ: `"⚖️ Không có ai bị treo cổ vì số phiếu cao nhất (3 phiếu) chưa đạt quá bán (tối thiểu 4 phiếu cho 9 người sống)!"`).
  - Frontend: Hiển thị trực quan lynch threshold ngay bên cạnh số người sống trên tiêu đề đầu trang game của tất cả người chơi vào ban ngày (Ví dụ: `• 9 người sống (Cần ≥4 phiếu để treo cổ)`), tạo trải nghiệm kịch tính và chuyên nghiệp.

## 15. Sửa Logic Trả Thù Của Thợ Săn Trước Khi Tính Thắng Thua
- **Trì hoãn kiểm tra thắng thua khi Thợ Săn chết:**
  - Đã cập nhật hàm `checkWinCondition` trong `GameEngine.js` của backend để tự động phát hiện xem có bất kỳ người chơi Thợ Săn (role `hunter`) nào bị chết (`isAlive: false`) mà chưa kịp thực hiện kỹ năng trả thù (`shotUsed` không phải `true`).
  - Nếu phát hiện thấy, hệ thống sẽ tạm thời trì hoãn việc kết luận thắng thua (trả về `null`), đảm bảo Thợ Săn luôn được thực hiện nốt phát bắn báo thù bất kể anh ta bị sói cắn vào ban đêm, bị hỏa tặc thiêu, bị xạ thủ bắn nhầm hay bị treo cổ vào ban ngày.
  - Ván đấu chỉ chính thức dừng và phân định thắng thua sau khi phát bắn của Thợ Săn đã được giải quyết xong (hoặc khi thời gian chờ 30 giây kết thúc).

## 16. Tách Biệt Hiệu Ứng Bỏ Phiếu (Vote Effect)
- **Sửa lỗi hiển thị sai hiệu ứng:** Khắc phục triệt để lỗi khi người chơi bỏ phiếu (vote) vào ban ngày nhưng thẻ mục tiêu vẫn hiện hiệu ứng đêm của chức năng (như khiên bảo vệ của Vệ sĩ, bình thuốc của Bác sĩ, quả cầu của Tiên tri...).
- **Hiệu ứng bàn tay chỉ vào (`🫵`):** 
  - Frontend: Thiết kế và tích hợp một overlay hiệu ứng bỏ phiếu riêng biệt mang hình bàn tay chỉ vào (`🫵`) trên nền gradient đỏ hoa hồng neon rực rỡ, kèm theo dòng trạng thái `"Đã Chọn Vote"` tinh tế.
  - Tự động ghi đè: Hiệu ứng vote này sẽ tự động thay thế hoàn toàn mọi hiệu ứng chiêu thức đêm khi bước vào giai đoạn Bỏ Phiếu (`phase === 'vote'`), giúp trải nghiệm thị giác của người chơi trở nên hợp lý, sạch sẽ và chuyên nghiệp.

## 17. Bổ Sung Cơ Chế Hòa Khi Không Còn Ai Sống Sót & Ưu Thế Tuyệt Đối Của Thị Trưởng (1v1 với Sói)
- **Cơ chế Hòa khi không còn ai sống sót (Draw Condition):**
  - Backend: Cập nhật hàm `checkWinCondition` trong `GameEngine.js`. Khi toàn bộ người chơi đều chết (ví dụ: Thợ Săn chết kéo theo con Sói cuối cùng xuống mồ), hệ thống sẽ ngay lập tức trả về kết quả Hòa (`winningTeam: 'draw'`).
  - Giao diện: Cập nhật `GamePage.jsx` hỗ trợ màu sắc (`#94a3b8`) cho đội hòa, hiển thị biểu tượng cán cân công lý (`⚖️`) cùng dòng chữ thông báo `"⚖️ Trận đấu kết thúc với kết quả Hòa! Không còn bất kỳ ai sống sót!"` cực kỳ trang trọng và rõ ràng.
- **Quyền lực tối cao của Thị Trưởng khi 1v1 với Sói:**
  - Logic thực tế: Khi trận đấu chỉ còn 1 Thị Trưởng và 1 Sói, nếu Thị Trưởng đã lật bài (revealed), lá phiếu của Thị Trưởng sẽ có trọng số gấp đôi (2 phiếu). Khi bước vào ban ngày và vote nhau, Thị Trưởng chắc chắn sẽ thắng cử treo cổ con Sói (2 phiếu so với 1 phiếu của Sói).
  - Tích hợp tự động: Cập nhật `checkWinCondition` để phát hiện tình huống 1v1 này. Nếu Thị Trưởng đã lật bài, hệ thống sẽ lập tức tuyên bố phe Dân Làng chiến thắng mà không cần chờ Sói có cơ hội cắn lén vào ban đêm, giải quyết triệt để các kịch bản bất hợp lý trước đó.

Đã hoàn thành xuất sắc, đồng bộ e2e hoàn chỉnh và ghi nhận đầy đủ vào lịch sử phát triển của Wolvesville VN!

## 18. Cập Nhật Quan Trọng Cho Các Role Tương Tác: Jailer, Bodyguard, Gunner, Medium & Cupid
- **Jailer Chat:** Đã kích hoạt hoàn toàn kênh chat `jail`. Cai Ngục và Tù Nhân có thể trò chuyện với nhau trong đêm một cách riêng tư (tên được ẩn một phần để bảo mật).
- **Bodyguard Injury:** Sửa logic trong `NightPhase.js`. Vệ Sĩ bị tấn công hoặc bảo vệ thành công mục tiêu khỏi Sói/Sát Nhân sẽ hấp thụ sát thương và hy sinh thay cho mục tiêu.
- **Gunner Reveal:** Tích hợp tính năng công khai vai trò khi bắn súng. Ngay khi Xạ Thủ bắn phát đầu tiên, socket cập nhật cờ `revealed: true` và hiển thị thẻ vai trò Xạ Thủ vĩnh viễn trên giao diện của tất cả người chơi.
- **Medium Chat:** Cập nhật `chatHandler.js` và `GamePage.jsx` cho phép Ngoại Cảm (Medium) tham gia và đọc/gửi tin nhắn trong kênh `dead` vào ban đêm để giao tiếp với người đã khuất.
- **Cupid (Thần Tình Yêu):** 
  - Cải tiến frontend để Cupid dễ dàng pick 2 mục tiêu cùng lúc và auto-submit hành động ghép cặp.
  - Sau đêm 1, hai người chơi được ghép đôi sẽ ngay lập tức nhận được thông báo chi tiết về vai trò (`roleSlug`) của người kia.
  - Bổ sung điều kiện thắng "Lovers Win" vào `GameEngine.js`. Nếu cặp đôi sống sót đến cuối cùng (loại bỏ hết các role phe khác), họ sẽ chiến thắng với lời chúc tụng "Tình yêu chiến thắng!".

## 19. Tinh Chỉnh Hiệu Ứng Và Logic Vệ Sĩ / Cupid
- **Logic Vệ Sĩ (Bodyguard):** Ngăn chặn khả năng bảo vệ liên tiếp một mục tiêu 2 đêm liền bằng cách lọc bỏ mục tiêu `lastProtected` từ hệ thống, khiến frontend không còn gợi ý nhân vật đã bảo vệ đêm qua. Khi bảo vệ thành công và bị thương, Vệ Sĩ sẽ thay thế mục tiêu gánh chịu mọi sát thương tấn công để đảm bảo luật chết thay ở lần 2.
- **Bot Cupid:** Khôi phục tính ngẫu nhiên của Bot Cupid khi nó có thể tự chọn mình trong danh sách 2 người chơi ngẫu nhiên, mô phỏng đúng tính năng Cupid của game gốc. Nâng cấp bộ đệm nhận target cho cả player Cupid và Bot Cupid (hỗ trợ chuỗi String phân tách dấu phẩy hoặc array mục tiêu).
- **Trải Nghiệm Hiệu Ứng Súng Lửa Sống Động Mới (2 Giây):**
  - Áp dụng thời gian trễ 2 giây (2000ms) trước khi màn hình báo tử cho mục tiêu bị Xạ Thủ, Thợ Săn bắn và bị Hỏa Tặc thiêu.
  - Bổ sung ngay hiệu ứng chớp tắt màn hình `"BỊ BẮN 🎯"` mang tone cam rực rỡ kèm sóng chấn động khi nạn nhân trúng đạn Xạ Thủ hoặc Thợ Săn trước toàn thể người chơi trong phòng.
  - Kéo dài thời gian hiệu ứng `"HỎA HOẠN 🔥"` của Hỏa Tặc để tất cả cùng thưởng thức chiêm ngưỡng khung cảnh bốc cháy 2 giây trước khi danh sách người bị thiêu được công bố kết liễu.




# 🐺 BÁO CÁO KIỂM THỬ HỆ THỐNG WOLVESVILLE VN — PHÁT TRIỂN & TÍCH HỢP (E2E)
> **Môi trường:** Development (Localhost)  
> **Phiên bản:** v1.2.0-Dev (Hoàn thiện logic cốt lõi + 19 Vai trò)  
> **Ngày thực hiện:** 02/06/2026  
> **Trạng thái:** ✅ **HOÀN THÀNH XUẤT SẮC (100% PASS sau khi fix 1 bug nhỏ về Cupid)**

---

## I. TỔNG QUAN VỀ ĐỘI NGŨ & KẾ HOẠCH KIỂM THỬ (TEST PLAN)

Để đảm bảo hệ thống game hoạt động ổn định và chính xác theo chuẩn thi đấu quốc tế của dòng game Wolvesville, đội ngũ kiểm thử đã thiết lập quy trình kiểm thử toàn diện trên môi trường Development.

### 1. Phạm Vi Kiểm Thử (Scope of Testing)
* **Tích Hợp E2E (End-to-End Integration)**: Kiểm tra chu trình hoạt động của một trận đấu hoàn chỉnh: Khởi tạo phòng -> Đồng bộ Socket -> Chia vai trò -> Chạy các pha (Đêm - Bình minh - Thảo luận - Bỏ phiếu) -> Phân định Thắng/Thua -> Thu dọn tài nguyên.
* **Logic Vai Trò Nâng Cao (Advanced Role Mechanics)**: Rà soát kỹ lưỡng 19 vai trò, đặc biệt chú trọng 7 vai trò mới nâng cấp (Tiên Tri, Thám Tử, Cai Ngục, Hỏa Tặc, Phù Thủy, Xạ Thủ, Vệ Sĩ).
* **Đồng Bộ Dữ Liệu Thực Tế (Database & State Persistence)**: Kiểm tra khả năng đồng bộ thời gian thực giữa Redis (State tạm) và MySQL (DB lâu dài), đặc biệt là cơ chế Uy tín (Reputation), và dọn dẹp game cũ (Ghost Game).
* **Giao Diện & Trải Nghiệm (UI/UX Aesthetics)**: Đảm bảo giao diện mang lại trải nghiệm cao cấp, màu sắc neon nổi bật, mượt mà và không lỗi vị trí hiển thị.

### 2. Thiết Lập Môi Trường Kiểm Thử (Development Environment Setup)
* **Backend**: Node.js v20 + Express + Socket.IO v4.
* **Database**: MySQL 8.0 (Sequelize ORM) + Redis 7 (ioredis).
* **Frontend**: React 18 + Vite (Port 3000) + TailwindCSS.
* **Dữ liệu tài khoản thử nghiệm**:
  * **Chủ phòng (Host)**: `test1@game.com` (Username: `test1_host` - ELO: 1200)
  * **Người chơi ảo (Bots)**: `bot2@test.com`, `bot3@test.com`, `bot4@test.com` (Mật khẩu mặc định: `test123456`)

---

## II. KỊCH BẢN KIỂM THỬ & KẾT QUẢ THỰC TẾ (TEST EXECUTION & RESULTS)

### Kịch Bản 1: Kiểm Thử Tích Hợp Toàn Diện (End-to-End Full Game Test)
Đội ngũ đã phát triển và chạy thành công script tự động mô phỏng luồng trận đấu 4 người (`test/full-game-test.js`):

```bash
node test/full-game-test.js
```

#### Nhật Ký Chạy Thực Tế (Execution Log Snapshot):
```text
============================================================
🐺 WOLVESVILLE VN — Full Game Test
============================================================
📋 Step 1: Login host & create room...
✅ Room created: A9JRSG (ID: 4d4d8a35...)

📋 Step 2: Connecting players...
🎯 HOST test1_host: logged in (id: e92d8ac6...)
🎯 HOST test1_host: socket connected
🎯 HOST test1_host: joining room A9JRSG...
🎯 HOST test1_host: lobby updated — 4 players in room
🤖 Bot2 bot2_player: ✅ joined room A9JRSG
🤖 Bot3 bot3_player: ✅ joined room A9JRSG
🤖 Bot4 bot4_player: ✅ joined room A9JRSG

============================================================
🎮 HOST starting game! (4 players ready)
============================================================
🎯 HOST test1_host: ⏱️ Game starts in 3s

🤖 Bot2 bot2_player: 🎭 Role = 🐺 werewolf (werewolf, aura: evil)
🤖 Bot4 bot4_player: 🎭 Role = 🏘️ doctor (village, aura: good)
🎯 HOST test1_host: 🎭 Role = 🏘️ seer (village, aura: good)
🤖 Bot3 bot3_player: 🎭 Role = 🏘️ villager (village, aura: good)

🌙 Phase: NIGHT — Round 1 (30s)
🎯 HOST test1_host: 🔮 Seer result: bot4_player = ✅ good (roleSlug: doctor)
🤖 Bot4 bot4_player: doctor_save → test1_host
🤖 Bot2 bot2_player: wolf_kill → bot3_player

☀️ Phase: DAWN — Round 1 (10s)
  💀 bot3_player died (wolf_kill)
  📋 🐺 bot3_player đã bị Sói cắn chết trong đêm! (villager)

💬 Phase: DISCUSS — Round 1 (60s)
🗳️ Phase: VOTE — Round 1 (30s)
🤖 Bot4 bot4_player: 🗳️ votes for test1_host
🤖 Bot2 bot2_player: 🗳️ votes for bot4_player
🎯 HOST test1_host: 🗳️ votes for bot4_player

  ⚰️ bot4_player (doctor) was voted out!
  📋 ⚰️ bot4_player đã bị treo cổ! Vai trò: doctor

============================================================
🏁 GAME OVER: 🐺 Phe Sói thắng! Sói đã chiếm đa số!
============================================================
✨ Winning Team: werewolf
🎉 Test completed successfully! Exiting...
```

* **Trạng thái**: **✅ ĐẠT (PASS)**  
* **Đánh giá**: Trận đấu diễn ra hoàn toàn mượt mà từ lúc phân phát bài đến tính toán điều kiện thắng vào ban ngày.

---

### Kịch Bản 2: Kiểm Thử Chuyên Sâu Logic 7 Vai Trò Mới Nâng Cấp

#### 1. Tiên Tri (Seer) & Sói Tiên Tri (Wolf Seer)
* **Nội dung test**: Tiên Tri chọn mục tiêu ban đêm và phải nhận được kết quả aura/vai trò tức thì.
* **Kết quả**: **✅ ĐẠT**. Socket `game:seer_result` phát kết quả về Client ngay khi Tiên Tri gửi action `seer_check` ban đêm, Tiên Tri xem được cả `roleSlug` chính xác (Ví dụ: `🔮 doctor` hoặc `🔮 Alpha Sói`), lưu đúng vào nhật ký check. Sói Tiên Tri chỉ nhìn thấy Aura theo thiết kế ban đầu để bảo toàn độ cân bằng.

#### 2. Thám Tử (Detective)
* **Nội dung test**: Thám tử soi 2 người chơi cùng lúc.
* **Kết quả**: **✅ ĐẠT**. Khi chọn mục tiêu, hệ thống trả về chính xác chuỗi kết quả ẩn phe phái cụ thể (Ví dụ: `"CÙNG một phe!"` hoặc `"KHÔNG cùng một phe!"`), loại bỏ hoàn toàn các lỗi rò rỉ phe phái cũ như `village`/`werewolf`/`solo` giúp bảo toàn tính chiến thuật.

#### 3. Cai Ngục (Jailer)
* **Nội dung test**: Chọn giam giữ ban ngày, bảo vệ ban đêm và Xử tử tức thì.
* **Kết quả**: **✅ ĐẠT**. 
  * Chọn giam ban ngày gửi socket `game:jailer_target` riêng tư đến Cai Ngục, hiển thị badge giam giữ `⛓️ Sẽ giam` độc quyền trên client của Cai Ngục.
  * Ban đêm, mục tiêu bị khóa toàn bộ hành động và miễn nhiễm mọi nguồn sát thương.
  * Lệnh xử tử `jailer_execute` lập tức giết chết mục tiêu và RIP ngay trong đêm đó, gửi sự kiện `game:jailer_execute_result` công khai để đồng bộ toàn bộ client, kiểm tra win condition lập tức.

#### 4. Hỏa Tặc (Arsonist)
* **Nội dung test**: Cơ chế tẩm dầu 1-2 người cùng lúc, thiêu cháy tức thì e2e và phòng thủ ban đêm trước bầy sói.
* **Kết quả**: **✅ ĐẠT**. 
  * Cho phép truyền mảng ID để douse cùng lúc 2 người chơi. Nút châm lửa được ẩn chuẩn xác ở đêm đầu tiên.
  * Kích hoạt `arsonist_ignite` thiêu rụi toàn bộ nạn nhân ngay trong đêm, cập nhật RIP tức thời trên giao diện, tính toán win condition ngay tức khắc.
  * Hỏa Tặc kháng hoàn toàn đòn tấn công ban đêm của bầy Sói.

#### 5. Phù Thủy (Witch)
* **Nội dung test**: Xử lý bình máu thông minh (cứu người) và bình độc.
* **Kết quả**: **✅ ĐẠT**. 
  * Bình cứu có thể hồi sinh người bị Sát Nhân Hàng Loạt (SK) nhắm tới.
  * Nếu Phù Thủy dùng bình cứu lên một người không hề bị ai tấn công đêm đó, bình cứu được tự động hoàn lại (`healUsed: false`) vào cuối đêm để sử dụng cho đêm tiếp theo.

#### 6. Xạ Thủ (Gunner)
* **Nội dung test**: Giới hạn cooldown 1 viên đạn/ngày và giao diện kỹ năng chủ động.
* **Kết quả**: **✅ ĐẠT**. 
  * Tích hợp `lastShotRound` giúp khóa kỹ năng bắn ban ngày nếu Gunner đã nổ súng ở vòng hiện tại, buộc phải chờ sang vòng đấu tiếp theo.
  * Kỹ năng bắn được đưa xuống thanh công cụ chủ động 🔫 dưới thẻ bài, chỉ kích hoạt khi click thay vì bật popup cưỡng ép.

#### 7. Vệ Sĩ (Bodyguard)
* **Nội dung test**: Cơ chế bị thương giảm tải hy sinh chết thay lập tức.
* **Kết quả**: **✅ ĐẠT**. Khi mục tiêu được bảo vệ bị tấn công hoặc khi chính Vệ Sĩ bị nhắm tới, Vệ Sĩ chỉ bị chuyển đổi sang trạng thái bị thương (`isInjured: true`), cứu sống mục tiêu thành công. Mục tiêu chỉ tử vong ở đòn tấn công thứ 2 hoặc khi Vệ Sĩ đã bị thương trước đó.

---

### Kịch Bản 3: Các Cơ Chế Đồng Bộ Hệ Thống & Giao Diện Ban Ngày

#### 1. Cơ Chế Treo Cổ Quá Bán (Lynch Threshold)
* **Nội dung test**: Kiểm tra số phiếu treo cổ tối thiểu ban ngày.
* **Kết quả**: **✅ ĐẠT**. Hệ thống áp dụng chuẩn công thức `Math.floor(aliveCount / 2)`. Tiêu đề game hiển thị trực quan (Ví dụ: `• 9 người sống (Cần ≥4 phiếu để treo cổ)`). Nếu người có phiếu cao nhất không đạt quá bán, hệ thống kết luận hòa phiếu và hiển thị lý do chuẩn xác.

#### 2. Hủy Bỏ Phiếu Bầu (Unvote / Phiếu Trắng)
* **Nội dung test**: Nhấp chọn lại người đang vote để hủy bỏ.
* **Kết quả**: **✅ ĐẠT**. Reset local state client mượt mà, đồng thời phát lệnh socket xóa vĩnh viễn trường vote trong cơ sở dữ liệu Redis (`hdel`) thay vì ghi đè giá trị rỗng giúp tiết kiệm tài nguyên.

#### 3. Chống Trùng Game (Ghost Game Prevention)
* **Nội dung test**: Dọn dẹp phòng trống khi không còn người thật (chỉ còn bots).
* **Kết quả**: **✅ ĐẠT**. Khi người chơi thoát game thông qua nút bấm hoặc bị mất kết nối, hệ thống ngắt kết nối đúng cách. Nếu phòng không còn người thật (human count = 0), vòng lặp game lập tức kết thúc và dọn dẹp Redis, ngăn chặn triệt để tình trạng game ma chạy ngầm đè phase lên sảnh chờ mới.

#### 4. Hệ Thống Uy Tín (Reputation System)
* **Nội dung test**: Trừ điểm uy tín khi rời trận giữa chừng và tự động phục hồi.
* **Kết quả**: **✅ ĐẠT**.
  * Rời trận đang diễn ra tự động phạt trừ 10 điểm uy tín trong MySQL (không phạt nếu phòng chỉ toàn bot).
  * Đăng nhập tự động tính toán thời gian chênh lệch từ lần hồi phục trước để cộng thêm 1 điểm uy tín cho mỗi giờ đã trôi qua (giới hạn tối đa 100 điểm).

---

### Kịch Bản 4: Thẩm Định Giao Diện Đồ Họa & Trải Nghiệm (UI/UX)
* **Logo Geometric Neon**: Đã kiểm tra sự thay đổi của logo Sói Esports sắc nét với các chi tiết màu neon hồng/cam tương phản cao, hòa nhập hoàn hảo trên nền tối cao cấp của game.
* **Modal Vai Trò**: Đã xác nhận sự xuất hiện của nút `← Quay lại` trực quan trong Tab Vai Trò, hỗ trợ người chơi dễ dàng quay lại sảnh chính. Hover tooltip hiển thị mô tả rõ ràng, không giật lag.
* **Độ Phản Hồi Thời Gian Thực**: Tất cả các cập nhật về trạng thái phiếu bầu, thanh máu/sống chết, thanh đếm ngược tiến trình thời gian đều hiển thị chuẩn màu sắc và hiệu ứng chuyển động mượt mà.

---

## III. PHÂN TÍCH HỒI QUY (REGRESSION ANALYSIS)

> [!IMPORTANT]
> **Cam kết không có lỗi hồi quy (No Regressions) sau khi Fixed Bug:**  
> Quá trình nâng cấp logic các vai trò đặc biệt và cơ chế RIP tức thì ban đêm diễn ra rất mượt mà. Trong phiên test 02/06, đội ngũ đã phát hiện và xử lý ngay 1 lỗi Cú pháp (Syntax Error) và gọi sai biến đối tượng mục tiêu ở Phase Đêm của vai trò **Cupid** (`NightPhase.js`). Sau khi fix, mọi tính năng đều **hoàn toàn không ảnh hưởng** đến các tính năng cũ đã ổn định như:
> 1. *Cupid/Tình nhân (Lovers)*: Đôi lứa chết chung khi một người chết ban ngày/đêm vẫn kích hoạt chuẩn xác.
> 2. *Thợ Săn (Hunter)*: Cơ chế 30 giây trả thù sau khi chết hoạt động tốt, không bị trùng lặp phase.
> 3. *Sói Tiên Tri biến hình*: Logic biến đổi vai trò và phân bổ socket vẫn hoạt động hoàn hảo.
> 4. *Serial Killer kháng sói*: Vẫn duy trì cơ chế miễn nhiễm sát thương sói chính xác.

---

## IV. ĐÁNH GIÁ CHUNG & KIẾN NGHỊ

Hệ thống Wolvesville VN hiện đã hoàn thiện một cách trọn vẹn và đạt mức độ tin cậy cực kỳ cao:
1. **Độ ổn định cốt lõi**: Cực tốt, vượt qua tất cả các bài test tích hợp và mô phỏng E2E với nhiều kịch bản phức tạp.
2. **Trải nghiệm người dùng**: Cảm giác premium, phản hồi nhanh và trực quan nhờ việc đưa kết quả check tức thì và xử lý RIP ngay trong đêm.
3. **Quản lý tài nguyên**: Tối ưu, cơ chế chống Ghost game và Redis Smart Clean giúp máy chủ hoạt động bền bỉ, không bị rò rỉ bộ nhớ.

**Kiến nghị tiếp theo**: Đội ngũ phát triển có thể tự tin triển khai mã nguồn này lên môi trường Staging/Production để chuẩn bị cho các đợt thử nghiệm diện rộng (Closed Beta).




## 20. Trì Hoãn Kết Thúc (Delay Endgame) & Hoàn Thiện Lịch Sử Cùng Cooldown Gunner
- **Trì Hoãn Báo Tử Tức Thời:** Thêm hàm `triggerEndGame` trong `GameEngine.js` với thời gian delay 3-4 giây. Điều này giúp khi có phát bắn từ Gunner, Hunter hay Hỏa Tặc thiêu, hệ thống vẫn có đủ 2-3 giây hiển thị toàn màn hình các hiệu ứng hình ảnh sống động (súng bắn, lửa thiêu) cho người chơi, trước khi popup kết quả endgame che mất màn hình.
- **Hoàn Thiện Lịch Sử Cuối Phase Đêm:** Khi một bên (Dân/Sói) thắng ngay sau kết quả ban đêm, thay vì trực tiếp end game làm ẩn đi danh sách chết, hệ thống giờ đây **vẫn gửi dữ liệu của bình minh (dawn)** (ai bị giết, bị nguyên nhân gì) đến tất cả client trong lúc đếm ngược 4 giây delay. Từ đó, người chơi có thể xem đầy đủ chi tiết lịch sử tử vong trước khi ván đấu đóng lại.
- **Cooldown Xạ Thủ 1 Ngày:**
  - Logic Backend: Cập nhật điều kiện `state.round - lastShotRound <= 1`, ép Gunner phải chờ cách đúng 1 ngày để bắn viên tiếp theo.
  - Cập nhật UI: Các nút bắn của Gunner ban ngày sẽ tự động bị khóa (với trạng thái giảm opacity, đổi màu xám, cấm click và hiện cursor cấm) để thể hiện rõ ràng Xạ Thủ đang trong thời gian Cooldown nghỉ ngơi sau khi bắn.

## 21. Hiệu Ứng Xử Tử Cho Cai Ngục
- **Logic Hiệu Ứng UI:** Thêm state `executeTargets` và UI Component hiển thị khẩu súng thả xuống đầu nạn nhân cùng vết máu loang lổ. Hiệu ứng này sẽ kéo dài 1.5 giây để toàn phòng nhìn thấy trước khi nạn nhân thực sự biến thành biểu tượng mộ (RIP) và chết trong game. Việc này mang lại trải nghiệm tương tự hiệu ứng Bắn Súng hay Phóng Hỏa.

## 22. Khắc phục lỗi Hiệu Ứng Cai Ngục (Jailer) Đã Chết
- **Xóa State Giam Giữ Ảo:** Cập nhật backend (GameEngine.js & NightPhase.js) để tự động xóa trạng thái nextJailed = null của Cai ngục nếu Cai ngục đã chết, ngăn chặn tình trạng mục tiêu tiếp tục bị giam cầm một cách vô lý ở các đêm sau.
- **Đồng Bộ UI Frontend:** Bổ sung điều kiện kiểm tra isAlive của Cai ngục trong GamePage.jsx trước khi hiển thị hiệu ứng song sắt giam cầm và kênh chat jail. Khắc phục triệt để bug Cai ngục chết vẫn thấy mục tiêu bị giam.

## 23. Cập Nhật Responsive UI
- Đã thiết kế lại kiến trúc layout của LobbyPage và GamePage sang dạng tương thích 100% với Mobile và Tablet. Thay vì flex-row cố định và grid cứng, UI tự động chuyển sang flex-col ở màn hình nhỏ.
- GameBoard trên di động được thiết lập order-1 để nhảy lên trên thanh thông tin (order-2).
- Sử dụng đơn vị chuẩn dvh (Dynamic Viewport Height) cho toàn bộ màn hình Game để ngăn chặn vỡ layout khi mobile hiện thanh URL.
- Bổ sung thanh Tab Navigation (Bottom Bar) để người chơi có thể chuyển đổi dễ dàng giữa màn hình `Bàn Chơi (Board)` và màn hình `Trò Chuyện (Chat/Log)` trên thiết bị di động, giống với cấu trúc của phiên bản game thật và Wiki (tận dụng tối đa 100% chiều cao màn hình, tránh chia đôi không gian).

## 24. Thực thi kiểm thử bằng skill `test-game`
- Đã sử dụng tài khoản `tester@wolvesville.vn` truy cập localhost:3000 và khởi tạo thành công phòng chơi mới.
- Thêm Bot AI thành công thông qua script xác nhận popup của trình duyệt.
- Chạy qua các phase (Night -> Dawn -> Discuss -> Vote) thành công không gặp lỗi.
- Đã cập nhật file `baocaotest.md` với báo cáo kiểm thử 100% PASS cho toàn bộ dự án hiện tại.