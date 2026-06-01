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

