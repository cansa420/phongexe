# Đặc tả hoạt ảnh tính điểm

Mô tả đúng như bản demo hiện tại (`web/ui.js`, hàm `animateScore` và các hàm hiệu ứng; CSS trong `web/index.template.html`, phần "hoạt ảnh tính điểm"). Mọi con số là điểm khởi đầu, chỉnh theo cảm giác khi chơi thật. Mọi hiệu ứng phải tắt hoặc rút gọn khi máy bật "giảm chuyển động".

## 0. Nguyên tắc

- Thứ tự cố định: **tính từng quân và bùa → chip × hệ số lao vào nhau → điểm nổ ra → nghỉ một nhịp → thanh điểm chạy**. Thanh điểm và số "Điểm" ở đầu màn hình **đứng yên ở giá trị cũ** cho đến bước cuối. Nếu để chúng hiện sẵn giá trị mới ngay khi vẽ lại màn hình thì thanh sẽ chạy hai lần.
- Chạm màn hình ở bất kỳ lúc nào thì tua nhanh sáu lần (mọi thời gian chờ chia 6, số lăn nhảy thẳng đến giá trị cuối). Có dòng nhắc "Chạm để tua nhanh" ở cuối màn hình.
- Phần thưởng cảm giác tăng theo hai thứ: **sức nặng của bộ** (làm lớn nhịp tính) và **điểm so với mục tiêu ải** (làm lớn cú nổ cuối).

## 1. Đầu lượt đánh: tên bộ

Sức nặng bộ `hv` = chip gốc × hệ số gốc của bộ ở cấp hiện tại.

| Loại | Điều kiện | Việc làm |
| --- | --- | --- |
| Thường | `hv` < 250 | Đặt tên bộ và cấp, tiếng bíp 300 Hz. |
| Vừa | `hv` ≥ 250 | Thêm biểu ngữ tên bộ phóng to giữa màn hình 1,1 giây, tiếng 520 Hz, chờ thêm 560 ms. |
| Lớn | `hv` ≥ 600 (Ngũ quý, Phu dọc 5, Tôm, Lèo, Thiên Khai, Tam Yêu) | Biểu ngữ 1,7 giây có tia sáng quay phía sau, nhoáng sáng nhẹ, rung màn hình 9 px, 26 hạt pháo hoa ở khung tính điểm, hợp âm 5 nốt, chờ thêm 800 ms. |

## 2. Từng bước cộng dồn

Khoảng chờ giữa các bước = `4200 / số bước`, kẹp trong khoảng theo loại bộ: lớn 240–400 ms, vừa 200–340 ms, thường 150–270 ms.

Mỗi bước (một quân ghi điểm, một bùa, một phù phép, một men):
- Quân hoặc bùa nảy lên (`pop`, 0,4 giây), số nổi bay lên: hộp xanh `+chip`, hộp đỏ `+hệ số`, hộp đỏ cam to `×hệ số`. Với men của bùa, số nổi ghi kèm tên men ("Men vàng +10").
- Số chip và hệ số **lăn dần** từ giá trị cũ lên giá trị mới trong 300 ms (ease-out), ô tương ứng phình 1,3 lần rồi về.
- Bộ đếm **"Liên hoàn ×n"** hiện ở góc khung tính điểm từ bước thứ 3, to dần, viền đổi màu theo mốc 5, 8, 12.
- Ô chip và ô hệ số **nóng dần**: kích thước tăng theo logarit của giá trị (chip tối đa +15%, hệ số tối đa +24%), và đổi trạng thái theo mốc:

| Mốc | Ô chip (xanh) | Ô hệ số (đỏ) |
| --- | --- | --- |
| 1 | chip ≥ 70: quầng xanh nhẹ | hệ số ≥ 10: quầng cam |
| 2 | chip ≥ 150: quầng sáng hơn, nền xanh sáng | hệ số ≥ 24: nền cam, nhấp nháy lửa 0,45 giây |
| 3 | chip ≥ 300: nền trắng xanh, nhịp sáng 0,5 giây | hệ số ≥ 60: nền vàng trắng, lửa dữ 0,3 giây |

- Khi cộng hệ số và hệ số đạt mốc ≥ 1, tàn lửa bay lên từ ô hệ số (3, 6, 10 hạt theo mốc 1, 2, 3).
- Âm: bíp `260 + 38 × n` Hz (n chạy đến tối đa 14), cộng 180 Hz nếu là bước nhân, bước nhân dùng sóng răng cưa to hơn và có tiếng quét 220 → 880 Hz trong 0,25 giây.
- Rung màn hình: bước cộng hệ số lẻ thứ tự rung nhẹ 2 px; bước nhân rung `min(14, 4 + 3 × số lần nhân)` px kèm nhoáng sáng nhẹ.
- Quân được tính lại ("Lại!"): nảy quân và bùa, tiếng bíp cao dần.
- Quân bị trùm vô hiệu: số nổi "0" màu xám. Bộ bị trùm phạt: số nổi "Bị phạt", tiếng trầm, rung 5 px.

## 3. Chip và hệ số lao vào nhau

- Chờ 420 ms, rồi ô chip trượt sang phải 36 px và phình 1,18, ô hệ số trượt sang trái 36 px và phình 1,18 (0,22 giây), tiếng quét 180 → 1200 Hz trong 0,3 giây, chờ 320 ms.
- Sau đó khung tính điểm đổi thành một ô điểm duy nhất ("merge") hiện bằng hiệu ứng phóng 0,3 → 1,3 → 1 trong 0,38 giây.

## 4. Cú nổ điểm: 5 mức theo tỉ lệ điểm / mục tiêu ải

| Mức | Điều kiện (điểm lượt này / mục tiêu) | Ô điểm | Hạt pháo hoa | Rung | Âm | Chữ nổi |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | < 10% | vàng đơn giản | 8 | 3 px | chuông 4 nốt | không |
| 1 | < 25% | vàng, hơi to | 18 | 6 px | chuông | "Khá!" |
| 2 | < 50% | vàng cam, quầng sáng | 34 | 11 px | tiếng đập trầm + chuông | "Hay!" |
| 3 | < 100% | cam rực, viền lửa nhấp nháy 0,5 giây | 60 + 18 tàn lửa | 17 px | hợp âm 5 nốt | "Tuyệt vời!" |
| 4 | ≥ 100% (một lượt đánh đã vượt cả mục tiêu) | **QUÁ TẢI**: chữ lớn nhất, nền trắng vàng sang đỏ, lửa dữ, màu dao động nhẹ ±14° | 120 + 36 tàn lửa | 26 px | hợp âm 7 nốt | "QUÁ TẢI!!" |

Mức ≥ 3 có thêm nhoáng sáng toàn màn hình (mức 4 nhoáng mạnh, kéo dài 0,8 giây).

## 5. Thanh điểm nạp (sau cú nổ)

1. Nghỉ **520 ms** để người chơi đọc con số vừa nổ ra.
2. Thanh điểm chạy từ giá trị cũ đến giá trị mới. Thời gian theo mức nổ: 0,5 / 0,8 / 1,1 / 1,45 / 1,9 giây, đường cong giảm tốc (hàm mũ 2,2).
3. Trong lúc chạy (lớp `charging`):
   - **Lõi rực sáng**: một dải trắng nóng nằm giữa thanh, chạy theo chiều dài của phần đã đầy.
   - **Đầu thanh phát sáng**: quầng tròn 34 px ở mép phải, phình xẹp 0,22 giây.
   - Thanh tỏa sáng cam, nhịp sáng 0,3 giây; viền khung thanh đổi vàng.
   - Tia lửa bắn ra từ đầu thanh (khoảng 55% số khung hình, mỗi lần 1 hạt).
   - Số "Điểm" đếm theo thanh; tiếng tích mỗi 55 ms, cao dần từ 300 đến 1000 Hz; một tiếng quét lên 160 → 900 Hz suốt thời gian chạy.
4. **Khi điểm vượt mục tiêu** (chỉ một lần): thanh chuyển sang sọc lửa chạy liên tục và rung nhẹ (lớp `over`), số "Điểm" phình xẹp và đổi màu bốc lửa, nhoáng sáng, rung 10 px, tiếng quét 300 → 1500 Hz, tàn lửa bay lên ở mép thanh, chữ nổi "VƯỢT MỤC TIÊU!" (nếu lượt này mới vượt) hoặc "TRÀN BAR!" (nếu trước đó đã vượt).
5. Chạy xong: nếu tổng điểm ≥ 1,5 lần mục tiêu thì hiện chữ nổi "×n mục tiêu". Chờ 900 ms nếu đã vượt (420 ms nếu chưa), rồi gỡ mọi lớp hiệu ứng.

## 6. Biểu ngữ vào ải (ngoài lượt tính điểm)

- Lớp tối `.bandim` phủ toàn màn hình, sáng ở giữa, tối ở rìa. Biểu ngữ hiện ở 36% chiều cao: tên ải, dưới là mục tiêu (ải thường) hoặc tên và hiệu ứng trùm (ải Trùm, màu cam đỏ).
- Hiện 0,35 giây, giữ **1,9 giây** (ải Trùm **2,9 giây**), mờ 0,45 giây. Chạm màn hình sau 0,5 giây để đóng sớm.

## 7. Các phần CSS và hàm cần dựng lại

| Việc | Hàm | CSS chính |
| --- | --- | --- |
| Số lăn | `rollTo` | không |
| Nóng dần | `heatBox` | `.cbox[data-heat]`, `.mbox[data-heat]`, `coolGlow`, `flame`, `inferno` |
| Liên hoàn | `setCombo`, `clearCombo` | `.combo`, `comboHit` |
| Tên bộ | `fanfare` | `.fanfare`, `.fanfare.g`, `raySpin`, `hueWob` |
| Nhoáng sáng | `flash` | `.flash`, `.flash.strong` |
| Lửa | `embers` | `.ember`, `emberUp` |
| Pháo hoa, rung | `burst`, `shake` | `.part`, `#app.shake` |
| Ô điểm cuối | trong `animateScore` | `.merge.t0` … `.merge.t4` |
| Thanh nạp | trong `animateScore` | `.bar i.charging` (`::before` lõi, `::after` đầu), `.target.over`, `barRun`, `scoreHot` |
| Biểu ngữ | `banner` | `.banner`, `.banner.trum`, `.bandim` |
| Âm | `blip`, `sweep`, `arpeggio`, `chime`, `thud` | dùng WebAudio, không cần file âm thanh |

Lưu ý riêng: khung hoạt ảnh phải có đủ `from` và `to` khi phần tử gốc có `opacity: 0`; tên kiểu không được trùng với `.boss` hay `.big` đang dùng chỗ khác (xem mục 5 của `CAP_NHAT_COWORK.md`).
