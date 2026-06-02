# Nghiên cứu Game Wolvesville (https://www.wolvesville.com/)
Tài liệu này tổng hợp các tính năng, cơ chế trò chơi và hệ thống nhân vật của Wolvesville để phục vụ cho kế hoạch cập nhật dự án.

## 1. Tổng quan & Hệ thống Vai trò (Roles)
Trò chơi có tổng cộng **146 vai trò**, được chia thành các phe phái:
- **Phe Dân Làng (Village Team - 78 vai trò):** Giành chiến thắng khi tất cả các phe phái đe dọa và sát thủ đơn độc bị tiêu diệt.
- **Phe Ma Sói (Werewolf Team - 34 vai trò):** Giành chiến thắng khi số lượng Ma Sói lớn hơn hoặc bằng số lượng người chơi khác và các sát thủ đơn độc đã chết.
- **Phe Bầu chọn Đơn độc (Solo Voting Team - 3 vai trò):** (Ví dụ: Thằng Ngốc - Fool, Kẻ Săn Đầu Người - Headhunter). Giành chiến thắng khi đạt được điều kiện bầu chọn cụ thể của vai trò đó.
- **Phe Sát thủ Đơn độc (Solo Killer Team - 22 vai trò):** Giành chiến thắng bằng cách trở thành người sống sót cuối cùng.
- **Các danh mục khác:** Không phe phái, Phân công Ngẫu nhiên, Theo mùa, Sự kiện và các vai trò độc quyền của chế độ Classic.

## 2. Các Chế độ Chơi (Game Modes)
- **Quick Game (Chơi Nhanh):** Chế độ tiêu chuẩn, mang tính giải trí.
- **Sandbox:** Nơi thử nghiệm các tính năng mới và vai trò mới (Yêu cầu: 60+ Uy tín, chơi bằng tiếng Anh).
- **Advanced Game (Nâng cao):** Chơi ở mức độ cạnh tranh hơn nhưng không áp lực điểm xếp hạng (Yêu cầu: 70+ Uy tín, 50+ trận thắng).
- **Ranked Games (Đấu Xếp hạng):** Môi trường cạnh tranh cao cấp sử dụng hệ thống **Skill Points (SP)** (Yêu cầu: 80+ Uy tín, 50+ trận thắng).
  - Có các trận phân hạng, giảm trừ SP khi chết ở đêm đầu tiên (-50%) và các phần thưởng ngoại trang theo mùa (ví dụ: trang phục Đấu Sĩ) hoặc phần thưởng Đá Quý.
  - Phí tham gia là 5 Vàng; người thắng nhận phần thưởng Vàng dựa trên phe phái (+10 cho Dân Làng lên đến +60 cho Sát thủ Đơn độc).

## 3. Custom Lobbies & Crazy Games (Phòng Tùy chỉnh & Trò chơi Đột biến)
- Chủ phòng có thể mua **Custom Games** (2000 Gems cho bản Cơ bản, 3100 Gems cho bản Premium) để tạo phòng chơi Riêng tư hoặc Công khai với 9, 16 hoặc 25 người chơi.
- Chủ phòng Premium có thể bật các bộ điều chỉnh **Crazy Games** như:
  - **Role Drafting** (Chọn vai trò), **Double Trouble**, **Grid/Row Wars**, **Assassins Convention**, và **Unleashed Elements**.
  - Các luật chơi tùy chỉnh: **Bắt buộc Vote Ban Ngày**, **Xóa Chat mỗi Ngày**, **Vote Ẩn danh**, **Ẩn Vai trò khi chết**, và **Di chúc (Last Will)**.

## 4. Chu kỳ Ngày/Đêm & Cơ chế Giải quyết Hành động
- **Ban Ngày (Day Phase - 90 giây):** Gồm 60s Thảo luận + 30s Bầu chọn. Để treo cổ một người chơi, cần có đa số phiếu đại diện cho ít nhất 50% số người chơi còn sống.
- **Ban Đêm (Night Phase - 30 giây):** Các vai trò có kỹ năng chủ động sẽ thực hiện bảo vệ, điều tra hoặc tấn công.
- **Thứ tự Ưu tiên Kỹ năng Ban Đêm:**
  1. Forger (Vật phẩm) -> 2. Solo Killers -> 3. Bandit (Đồng phạm) -> 4. Corruptor -> 5. Alchemist -> 6. Illusionist -> 7. Medium (Hồi sinh) -> 8. Sect Leader -> 9. Zombie -> 10. Arsonist -> 11. Siren -> 12. Cupid (Ghép cặp).
- **Thứ tự Ưu tiên Tấn công** (khi một người chơi nhận nhiều đòn tấn công cùng lúc):
  `Cannibal` > `Serial Killer` > `Shapeshifter` > `Bandit/Accomplice` > `Werewolf` > `Berserk Frenzy` > `Evil Detective` > `Sect Sacrifice` > `Headless Horseman` > `Deep Sea Terror` > `Red Lady` > `Sect Ritual` > `Instigator`.

## 5. Hệ thống Tiến trình & Thẻ Vai trò (Role Cards System)
- **Nâng cấp Độ hiếm:** Người chơi có thể kết hợp thẻ để nâng cấp ô thẻ và mở khóa tính năng:
  - **Common (Thường):** 1 ô Perk.
  - **Rare (Hiếm):** 2 ô Perk.
  - **Epic (Sử thi):** Mở khóa một **vai trò nâng cao (advanced role)** cho thẻ gốc, cho phép người chơi chuyển đổi qua lại giữa vai trò gốc và nâng cao.
  - **Legendary (Huyền thoại):** 4 ô Perk + Biểu tượng Vàng/Bạc.
  - **Mythical (Thần thoại):** 5 ô Perk + Mở khóa **toàn bộ** các vai trò nâng cao cho thẻ gốc đó.
- **Nâng cấp Kỹ năng Phụ (Perk Upgrades):** Các Perk (như Tăng XP, Tăng Vàng, Ghi chú Người chơi, Báo cáo Khám nghiệm Tử thi, Thống kê Chat, và Highlight Tin nhắn Ban ngày) có thể được nâng cấp lên tối đa Bậc 3 bằng cách hiến tế các thẻ trùng lặp.
- **Voucher Đổi Perk:** Dùng để quay lại (re-roll) và tùy chỉnh các thuộc tính của ô.

## Kế hoạch Cập nhật Dự án (Đề xuất)
1. **Bổ sung Hệ thống Thẻ Vai trò & Tiến trình:** Triển khai tính năng nâng cấp (Common -> Mythical) để mở khóa các vai trò nhánh (Advanced Roles).
2. **Cập nhật Logic Xử lý Ban Đêm:** Điều chỉnh thứ tự ưu tiên các kỹ năng ban đêm dựa trên quy chuẩn của bản gốc.
3. **Phát triển Chế độ Chơi Mới:** Bắt đầu bằng Chế độ Sandbox và Đấu Xếp Hạng (tích hợp hệ thống tính điểm Skill Points/SP).
4. **Cải tiến Lobbies:** Cho phép người chơi tạo Custom Lobbies, tùy biến luật chơi (ẩn danh, xóa chat ngày, bắt buộc vote...).
