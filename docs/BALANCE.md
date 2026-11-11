# Báo cáo cân bằng (sinh tự động)

Sinh bởi `node sim/report.js 250`. **250 ván cho mỗi kiểu bot**, hạt giống cố định nên chạy lại ra cùng kết quả.

> Cảnh báo quan trọng: bot chỉ chọn nước đánh có điểm cao nhất và bỏ bài theo quy tắc đơn giản. Nó không biết đổi build giữa chừng, không tính trước trùm, không bán bùa khéo. Người chơi tinh ý sẽ thắng nhiều hơn bot. Hãy coi các con số dưới đây là **mặt bằng thấp**, rồi chỉnh lại bằng ván chơi thật.

## Bảng mục tiêu điểm hiện tại

| Chặng | Ải Thường | Ải Lớn | Ải Trùm |
| --- | --- | --- | --- |
| 1 | 300 | 490 | 550 |
| 2 | 630 | 1050 | 1200 |
| 3 | 1250 | 2100 | 2350 |
| 4 | 2450 | 4050 | 4550 |
| 5 | 4800 | 6200 | 6550 |
| 6 | 6900 | 8950 | 9400 |
| 7 | 9850 | 12800 | 13500 |
| 8 | 14200 | 18400 | 19300 |

Quy tắc sinh bảng: Ải Lớn = 0,52 × điểm trung vị bot đạt được; Ải Thường = 60% Ải Lớn; Ải Trùm = 112% Ải Lớn (chưa kể hiệu ứng cản của trùm).

## Kết quả theo kiểu bot

| Kiểu bot | Thắng cả ván | Số ải vượt qua (TB / 24) |
| --- | --- | --- |
| Không bùa | 0.0% | 4.1 |
| Mua ngẫu nhiên | 8.4% | 13.2 |
| Phu dọc (sảnh) | 26.4% | 15.1 |
| Bộ giống (đôi, ba, tứ) | 5.6% | 13.0 |
| Cùng họ | 29.6% | 18.5 |
| Lá Yêu | 9.2% | 13.6 |

Đọc nhanh: không bùa thì dừng sớm; theo đúng một build thắng nhiều hơn mua ngẫu nhiên. Số thắng của từng build ở bảng trên là mặt bằng thấp vì bot không biết phối bùa và xếp bài như người.

## Theo mức độ khó (lá Tạp)

Mục tiêu điểm được chỉnh khi **tắt** lá Tạp (mức nền). Lá Tạp là quân 0 chip, không ghép được bộ nào, lẫn ngẫu nhiên vào bộ bài đầu mỗi ải, số lượng tăng dần theo chặng. Các bảng bên dưới và phần trên dùng mức mặc định **Khó**.

| Mức | Lá Tạp | Phu dọc | Bộ giống | Cùng họ | Lá Yêu | Số ải TB (4 build) |
| --- | --- | --- | --- | --- | --- | --- |
| Dễ | không có | 37% | 15% | 39% | 14% | 15.7 |
| Thường | thêm 0,5 quân mỗi chặng (tối đa 6) | 24% | 10% | 32% | 13% | 15.3 |
| Khó | thêm 0,75 quân mỗi chặng (tối đa 8) | 26% | 5% | 31% | 11% | 15.0 |
| Ác mộng | thêm 1 quân mỗi chặng (tối đa 10) | 28% | 10% | 28% | 9% | 14.8 |

Gợi ý: người chơi giỏi hơn bot, nên mức **Khó** là mức mặc định để thử; nếu chơi thật vẫn thấy dễ thì nâng lên Ác mộng, nếu thấy quá gắt thì hạ xuống Thường.

## Bộ được đánh nhiều ít thế nào (4 build gộp, mức Khó)

| Bộ | Điều kiện | Chip × HS gốc | Tỉ lệ lượt đánh |
| --- | --- | --- | --- |
| Ngũ quý | 5 lá cùng số (cần lá giống hệt nhau), họ nào cũng được | 120 × 9 | 0.1% |
| Phu dọc 5 | 5 lá liên tiếp cùng một họ (Yêu là số 10) | 110 × 9 | 1.9% |
| Tôm | Thất Văn, Tam Sách, Tam Vạn | 90 × 8 | 0.8% |
| Lèo | Bát Sách, Cửu Vạn, Chi Chi | 90 × 8 | 0.7% |
| Thiên Khai | 4 lá giống hệt nhau (cùng số, cùng họ) | 85 × 8 | 0.3% |
| Tam Yêu | Chi Chi, Thang Thang, Ông Lão | 80 × 8 | 0.9% |
| Cù lũ cùng họ | Bộ ba và một đôi, cả 5 lá cùng một họ | 65 × 6 | 1.6% |
| Phu dọc 4 | 4 lá liên tiếp cùng một họ | 65 × 6 | 3.4% |
| Sảnh 5 lẫn họ | 5 lá liên tiếp, không cùng một họ | 60 × 5 | 1.1% |
| Tứ quý lẫn họ | 4 lá cùng số, không cùng một họ | 50 × 5 | 0.4% |
| Khàn | 3 lá giống hệt nhau (cùng số, cùng họ) | 45 × 4 | 1.0% |
| Sảnh 4 lẫn họ | 4 lá liên tiếp, không cùng một họ | 45 × 4 | 2.4% |
| Thuần họ | 5 lá cùng một họ, không liên tiếp | 40 × 4 | 25.6% |
| Cù lũ lẫn họ | Bộ ba và một đôi, không cùng một họ | 40 × 4 | 0.7% |
| Phu dọc 3 | 3 lá liên tiếp cùng một họ | 40 × 4 | 8.0% |
| Hai đôi cùng họ | Hai đôi khác số, cả 4 lá cùng một họ | 35 × 4 | 1.3% |
| Phu bí | 3 lá cùng số, không giống hệt nhau | 30 × 3 | 11.3% |
| Sảnh 3 lẫn họ | 3 lá liên tiếp, không cùng một họ | 25 × 3 | 4.5% |
| Hai đôi khác họ | Hai đôi khác số, không cùng một họ | 25 × 3 | 25.2% |
| Đôi cùng họ | 2 lá giống hệt nhau (cùng số, cùng họ) | 20 × 3 | 3.0% |
| Đôi khác họ | 2 lá cùng số, khác họ | 10 × 2 | 3.4% |
| Lá lẻ | Một lá | 5 × 1 | 2.6% |

Các bản **cùng họ** (giống hệt hoặc cùng một họ) chiếm 20.5% số lượt đánh. Mỗi bản cùng màu luôn cao hơn bản khác màu cùng họ (có test tự động `mọi họ có bản cùng màu` canh điều này).

## Theo bộ bài khởi đầu

Mức độ khó mặc định (Khó). Bộ bài là luật phụ, không phải nâng sức mạnh: mỗi bộ đẩy người chơi về một lối đánh.

| Bộ bài | Hiệu lực | Phu dọc | Bộ giống | Cùng họ | Lá Yêu | Số ải TB (4 build) |
| --- | --- | --- | --- | --- | --- | --- |
| Bộ Chuẩn | 120 lá, không thay đổi | 25% | 5% | 32% | 9% | 14.9 |
| Bộ Văn Đỏ | +1 lượt bỏ bài mỗi ải | 33% | 6% | 33% | 15% | 15.5 |
| Bộ Sách Lục | +1 lượt đánh nhưng bớt 1 lượt bỏ bài mỗi ải | 41% | 9% | 45% | 22% | 16.9 |
| Bộ Vàng | Khởi đầu thêm 10 đồng | 41% | 13% | 43% | 15% | 16.9 |
| Bộ Đen | +1 ô bùa nhưng bớt 1 lượt bỏ bài mỗi ải | 35% | 9% | 52% | 15% | 14.9 |
| Bộ Số Cao | Bỏ hết lá Nhất, Nhị, Tam (còn 84 lá): chip cao hơn nhưng sảnh thấp khó ra | 42% | 29% | 34% | 23% | 18.5 |
| Bộ Thuần Văn | Mọi lá đều họ Văn nên mọi bộ đều cùng họ, nhưng bớt 1 lượt bỏ bài và không còn Tôm, Lèo, Tam Yêu (trừ khi có lá Linh) | 53% | 35% | 59% | 40% | 19.7 |
| Bộ Hỗn Loạn | 120 lá có số và họ ngẫu nhiên: Ngũ quý dễ ra nhưng khó đoán | 33% | 13% | 31% | 11% | 15.1 |

## Tỉ lệ qua từng ải (4 build gộp, ván thua thật)

| Chặng | Thường | Lớn | Trùm |
| --- | --- | --- | --- |
| 1 | 100% | 100% | 97% |
| 2 | 100% | 98% | 92% |
| 3 | 99% | 96% | 93% |
| 4 | 99% | 94% | 89% |
| 5 | 99% | 95% | 87% |
| 6 | 98% | 92% | 85% |
| 7 | 94% | 86% | 81% |
| 8 | 95% | 90% | 78% |

## Tỉ lệ qua theo từng trùm

| Trùm | Hiệu ứng | Lần gặp | Tỉ lệ qua |
| --- | --- | --- | --- |
| Chằn Tinh | Đôi, Hai đôi (cả hai họ) bị phạt (còn nửa chip, nửa hệ số gốc) | 384 | 93% |
| Thủy Tinh | Không có lượt bỏ bài | 467 | 78% |
| Cáo Chín Đuôi | Phu bí, Khàn, Cù lũ, Tứ quý, Thiên Khai và Ngũ quý bị phạt (còn nửa chip, nửa hệ số gốc) | 444 | 95% |
| Thủy Quái Đứt Dây | Mọi sảnh và phu dọc bị phạt (còn nửa chip, nửa hệ số gốc) | 364 | 92% |
| Quỷ Một Mắt | Bớt 1 lượt đánh | 359 | 92% |
| Ma Da | Tay bài bớt 2 quân | 427 | 80% |
| Giặc Cửu Yêu | Lá Cửu và lá Yêu không cho chip và không kích hoạt bùa | 456 | 91% |
| Quỷ Móc | Mỗi lần đánh, 2 quân ngẫu nhiên còn trên tay bị móc mất | 351 | 99% |
| Quỷ Thu Thuế | Mất 1 đồng cho mỗi quân bạn đánh ra | 442 | 95% |
| Ma Trơi | Mỗi lượt, một bùa ngẫu nhiên bị vô hiệu | 376 | 93% |
| Tay Gãy | Mỗi lần đánh, bộ đó bị hạ 1 cấp trước khi tính (tối thiểu cấp 1) | 413 | 91% |
| Quỷ Nhuộm | Một họ ngẫu nhiên (Văn, Sách hoặc Vạn) bị vô hiệu cả ải: lá họ đó và lá Linh không ghi điểm | 381 | 93% |
| Hạn Bạt | Tay bài bớt 1 quân và bớt 2 lượt bỏ bài | 226 | 78% |

## Tỉ lệ thắng khi cuối ván có sở hữu bùa (tham khảo, bị nhiễu vì bùa mạnh thường là bùa cuối ván)

| Bùa | Độ hiếm | Build | Số ván sở hữu (cả 6 kiểu bot) | Thắng khi sở hữu |
| --- | --- | --- | --- | --- |
| Đồng Tông | quy | ho | 2 | 100% |
| Cộng Dồn Sảnh | hiem | sanh | 67 | 87% |
| Thêm Chỗ Ngồi | than | than | 252 | 38% |
| Phao Cứu Sinh | quy | chung | 3 | 33% |
| Nhất Thống | than | than | 382 | 30% |
| Họ Sách Lên Ngôi | thuong | ho | 173 | 28% |
| Họ Văn Lên Ngôi | thuong | ho | 202 | 27% |
| Họ Vạn Lên Ngôi | thuong | ho | 175 | 25% |
| Đủ Ba Họ | thuong | ho | 174 | 24% |
| Tăng Dần | thuong | sanh | 224 | 24% |
| Bản Sao | than | than | 788 | 24% |
| Nối Liền | thuong | sanh | 221 | 22% |
| Sảnh Dài | hiem | sanh | 74 | 22% |
| Một Họ | thuong | ho | 184 | 21% |
| Lên Hạng | thuong | chung | 273 | 21% |
| Tay Dài | hiem | chung | 168 | 18% |
| Thăng Hạng May | hiem | chung | 66 | 18% |
| Thông Suốt | hiem | sanh | 57 | 18% |
| Đánh Thêm | hiem | chung | 194 | 15% |
| Bỏ Thêm | thuong | chung | 426 | 14% |
| Kho Bài | thuong | chung | 247 | 10% |
| Mê Yêu | thuong | yeu | 186 | 9% |
| Đổi Họ | hiem | ho | 11 | 9% |
| Ngũ Phúc | thuong | chung | 46 | 9% |
| Yêu Nặng Ký | quy | yeu | 12 | 8% |
| Gọi Thêm Yêu | hiem | yeu | 66 | 8% |
| Yêu Giữ Nhà | thuong | yeu | 173 | 8% |
| Dội Trống | hiem | chung | 67 | 7% |
| Yêu Đi Đầu | hiem | yeu | 84 | 7% |
| Ít Mà Chất | hiem | giu | 14 | 7% |
| Nhặt Ve Chai | thuong | chung | 184 | 7% |
| Khàn Mạnh | hiem | bo | 86 | 7% |
| Có Đôi Có Cặp | thuong | bo | 221 | 7% |
| Ngồi Chờ | thuong | giu | 46 | 7% |
| Cùng Số Khác Họ | thuong | bo | 204 | 6% |
| Heo Đất | thuong | chung | 175 | 6% |
| Ba Yêu Hội Tụ | hiem | yeu | 54 | 6% |
| Số Lớn | thuong | chung | 36 | 6% |
| Tôm Lèo Mở Đường | hiem | yeu | 56 | 5% |
| Cù Lũ Nở Rộ | hiem | bo | 80 | 5% |
| Số Nhỏ | thuong | chung | 46 | 4% |
| Bí Ngũ | quy | sanh | 6 | 0% |
| Tứ Quý Hội Tụ | quy | bo | 6 | 0% |
| Giữ Đủ Ba Họ | quy | giu | 0 | - |
| Tranh Chi | quy | giu | 0 | - |

## Việc cần làm tiếp về cân bằng

- Chơi thử bằng người thật 10–20 ván, ghi lại bùa nào "đã", bùa nào chán, rồi đối chiếu bảng trên.
- Build mạnh nhất và yếu nhất cách nhau nhiều lần (xem bảng thắng ở trên). Bot **Bộ giống** thường yếu vì bot chỉ biết giữ đôi, chưa biết phối Khàn, Thiên Khai; người chơi giỏi hơn bot.
- Sảnh (phu dọc) là lối chơi dễ ra nhất ở bộ bài 120 lá, còn Tôm, Lèo, Tam Yêu rất hiếm nhưng điểm rất cao: cần xem người chơi thật có thấy "trúng số" hay không.
- Chặng 7 và 8 vẫn là chỗ tụt ở mức Dễ (xem tỉ lệ qua từng ải). Có thể thêm một nguồn nhân hệ số cuối ván.
- Trùm khắc build: **Thủy Quái Đứt Dây** khắc Phu dọc, **Cáo Chín Đuôi** khắc Bộ giống, **Giặc Cửu Yêu** khắc Lá Yêu, **Quỷ Nhuộm** khắc Cùng họ. Màn Chợ đã báo trước trùm của chặng.
- Mỗi lần đổi bùa, bộ hoặc trùm: chạy lại `node sim/calibrate.js 250 3 0.52` rồi `node sim/report.js`.
