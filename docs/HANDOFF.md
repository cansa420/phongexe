# Tổ Tôm Trống Đồng: bản giao việc cho Cowork

Bản này (v3) là bản chuyển từ Tam Cúc sang bài Tổ tôm. Khung roguelike, giao diện và hoạt ảnh giữ nguyên từ bản Tam Cúc (v2); bộ bài, bảng bộ, bùa, trùm, Ấn, bộ bài khởi đầu và bot được làm lại. Bản Tam Cúc nằm ở thư mục `tamcuc` riêng, không bị đụng tới.

## 1. Mục tiêu và giả thuyết

Một game roguelike xếp bài kiểu Balatro, đặt trên bộ bài Tổ tôm 120 lá, đồ hoạ sơn mài và trống đồng Đông Sơn (không dùng màu Tết, giao diện Tết cập nhật sau). Điểm = chip × hệ số của bộ đánh ra; bùa nhân và cộng điểm; lên cấp bộ bằng lá Quẻ; mỗi ván 8 chặng × 3 ải, ải cuối chặng có trùm. Giả thuyết cần kiểm chứng bằng người chơi thật: bài Tổ tôm (3 họ, số nối tiếp nên có sảnh) cho nhiều lối chơi hơn bộ Tam cúc 32 quân.

## 2. Luật chơi chính xác

**Bộ bài** (`src/data/ranks.json`, `makeDeck` trong `src/engine.js`): 120 lá = 3 họ (Văn, Sách, Vạn) × 10 số × 4 bản. Số 1 đến 9 là Nhất đến Cửu; số 10 là lá **Yêu** có tên riêng theo họ: Chi Chi (Văn), Thang Thang (Sách), Ông Lão (Vạn). Trường `color` của lá bài giữ tên cũ nhưng nay là họ: `van`, `sach`, `wan`. Id lá: `van-n3-0` (họ, số, bản). Chip của lá = số trên lá (Nhất 1 đến Cửu 9), lá Yêu 12 chip. Lá Tạp (`junk`) 0 chip, không ghép bộ nào.

**Ván.** Tay 8 lá, mỗi ải 4 lượt đánh và 3 lượt bỏ bài, mỗi lượt chọn tối đa 5 lá. Quân ngoài bộ vẫn rời tay nhưng không ghi điểm.

**Bảng bộ** (`src/data/hands.json`, 22 bộ, xếp từ mạnh đến yếu theo điểm gốc; chip × hệ số ở cấp 1; "cùng họ" của đôi, bộ ba, tứ quý nghĩa là các lá **giống hệt nhau**: cùng số, cùng họ):

| Bộ | Điều kiện | Chip × HS | Khóa |
| --- | --- | --- | --- |
| Ngũ quý | 5 lá cùng số | 120 × 9 | khóa |
| Phu dọc 5 | 5 lá liên tiếp cùng họ (Yêu là số 10) | 110 × 9 | |
| Tôm | Thất Văn, Tam Sách, Tam Vạn | 90 × 8 | |
| Lèo | Bát Sách, Cửu Vạn, Chi Chi | 90 × 8 | |
| Thiên Khai | 4 lá giống hệt nhau | 85 × 8 | |
| Tam Yêu | Chi Chi, Thang Thang, Ông Lão | 80 × 8 | |
| Cù lũ cùng họ | bộ ba và đôi, cả 5 lá cùng họ | 65 × 6 | |
| Phu dọc 4 | 4 lá liên tiếp cùng họ | 65 × 6 | |
| Sảnh 5 lẫn họ | 5 lá liên tiếp, lẫn họ | 60 × 5 | khóa |
| Tứ quý lẫn họ | 4 lá cùng số | 50 × 5 | khóa |
| Khàn | 3 lá giống hệt nhau | 45 × 4 | |
| Sảnh 4 lẫn họ | 4 lá liên tiếp, lẫn họ | 45 × 4 | khóa |
| Thuần họ | 5 lá cùng họ, không liên tiếp | 40 × 4 | |
| Cù lũ lẫn họ | bộ ba và đôi | 40 × 4 | khóa |
| Phu dọc 3 | 3 lá liên tiếp cùng họ | 40 × 4 | |
| Hai đôi cùng họ | 2 đôi khác số, cả 4 lá cùng họ | 35 × 4 | |
| Phu bí | 3 lá cùng số, không giống hệt | 30 × 3 | |
| Sảnh 3 lẫn họ | 3 lá liên tiếp, lẫn họ | 25 × 3 | khóa |
| Hai đôi khác họ | | 25 × 3 | |
| Đôi cùng họ | 2 lá giống hệt nhau | 20 × 3 | |
| Đôi khác họ | 2 lá cùng số, khác họ | 10 × 2 | |
| Lá lẻ | 1 lá | 5 × 1 | |

Luật nhận diện nằm trong `candidates` và `detect` (`src/engine.js`): game xét mọi tổ hợp trong các lá đã chọn và lấy bộ có giá trị cao nhất = (chip bộ ở cấp hiện tại + chip các lá) × hệ số, chưa tính bùa. Sảnh không nối vòng (Yêu và Nhất không liền nhau). Lá Linh tính là cả ba họ. Bùa Nhất Thống đưa mọi bộ về bản cùng họ.

**Khóa bộ.** Sáu bộ có `"locked": true` trong `hands.json` (các sảnh lẫn họ, Cù lũ lẫn họ, Tứ quý lẫn họ, Ngũ quý) bắt đầu ở cấp 0 (khóa) và mở bằng lá Quẻ: `run.levelUp(id)` đưa cấp 0 lên 1. `detect(cards, allSame, levels)` bỏ qua bộ có `levels[id] === 0`. Quẻ ở chợ có 65% ra lá Mở khóa cho lá đầu (35% cho các lá sau); Gói Quẻ và Thẻ Quẻ luôn có ít nhất 1 bộ khóa nếu còn (`run._queHands(n)`). Xem trước tay bài báo `preview.lockedBetter` khi các lá đang chọn đủ cho một bộ còn khóa mà điểm cao hơn. Tắt khóa: `config.lockHands = false`.

**Cách tính điểm** (`Run._calc`): chip và hệ số gốc của bộ (đã cộng cấp) → từng lá ghi điểm cộng chip rồi phù phép của lá (Ngọc +30 chip, Kim +4 hệ số, Son ×1,5), sau mỗi lá các bùa "mỗi lá" chạy từ trái sang phải → các lá còn trên tay → bùa "cả bộ" → men của bùa (luôn cộng, không cần điều kiện của bùa). Thứ tự bùa và thứ tự lá trên tay là thứ tự tính điểm. Quy tắc phụ: lá Triện Đỏ tính thêm 1 lần; Tay Gãy hạ 1 cấp bộ trước khi tính; bộ bị trùm nhắm tới chỉ còn nửa chip, nửa hệ số gốc.

**Tiền, chợ, Gói, Phù, Ấn, bỏ qua ải, bộ bài khởi đầu, bùa Thần, độ khó** giữ nguyên cơ chế từ bản Tam Cúc (xem `src/data/config.json`, `phu.json`, `an.json`); khác biệt chính:
- **Tiền.** Khởi đầu 4 đồng; thưởng qua ải Thường 3, Lớn 4, Trùm 5, cộng 1 đồng mỗi lượt đánh dư và lãi 1 đồng mỗi 5 đồng đang giữ (tối đa 5; Heo Đất nâng trần lên 10).
- **Chợ** sau mỗi ải: 3 bùa, 1 Quẻ, 2 Ấn, 2 Gói, 1 Phù. Làm mới chỉ đổi bùa, Quẻ, Ấn.
- **Ấn** (`an.json`): Nhân Bản, Trừ Tà (bộ bài không dưới **60** lá), **Đảo Họ** (đổi họ kế: Văn → Sách → Vạn → Văn), phù phép Ngọc, Kim, Son, Thép, Linh (tính là cả ba họ), Lưu Ly, và ba Triện (Đỏ, Vàng, Lam).
- **Bỏ qua ải** nhận Thẻ: Quẻ, Tiền, Bùa, Gói, Đầu Tư, Tốc Hành, Thăng Cấp (chỉ nâng bộ đã mở).
- **Độ khó** là số lá Tạp lẫn vào bộ bài (Dễ, Thường, Khó mặc định, Ác mộng).
- **Tám bộ bài khởi đầu:** Chuẩn (120 lá), Văn Đỏ (+1 lượt bỏ), Sách Lục (+1 lượt đánh, −1 lượt bỏ), Vàng (+10 đồng), Đen (+1 ô bùa, −1 lượt bỏ), Số Cao (bỏ Nhất, Nhị, Tam: 84 lá), Thuần Văn (mọi lá họ Văn nên mọi bộ cùng họ, −1 lượt bỏ), Hỗn Loạn (120 lá ngẫu nhiên).

**Trùm** (`bosses.json`): 12 trùm trong kho, 7 xáo ngẫu nhiên cho chặng 1 đến 7, Hạn Bạt luôn ở chặng 8. Trùm nhắm theo lối chơi: **Thủy Quái Đứt Dây** phạt mọi sảnh, **Cáo Chín Đuôi** phạt Phu bí, Khàn, Cù lũ, tứ quý, ngũ quý, **Chằn Tinh** phạt đôi và hai đôi, **Giặc Cửu Yêu** vô hiệu lá Cửu và lá Yêu, **Quỷ Nhuộm** vô hiệu cả một họ ngẫu nhiên (và lá Linh), cùng các trùm giữ từ bản cũ: Thủy Tinh (không bỏ bài), Quỷ Một Mắt, Ma Da, Quỷ Móc, Quỷ Thu Thuế, Ma Trơi, Tay Gãy.

**45 bùa** (`charms.json` và `charms.js`), chia 5 lối chơi và nhóm chung:
- **Phu dọc (sảnh):** Nối Liền, Tăng Dần, Thông Suốt, Sảnh Dài, Cộng Dồn Sảnh, Bí Ngũ.
- **Bộ giống (đôi, ba, tứ):** Có Đôi Có Cặp, Cùng Số Khác Họ, Cù Lũ Nở Rộ, Khàn Mạnh, Tứ Quý Hội Tụ.
- **Cùng họ:** Một Họ, Đủ Ba Họ, Đồng Tông, Họ Văn / Sách / Vạn Lên Ngôi, Đổi Họ.
- **Lá Yêu:** Mê Yêu, Yêu Giữ Nhà, Yêu Đi Đầu, Gọi Thêm Yêu, Tôm Lèo Mở Đường, Ba Yêu Hội Tụ, Yêu Nặng Ký.
- **Giữ bài:** Ngồi Chờ, Ít Mà Chất, Giữ Đủ Ba Họ, Tranh Chi.
- **Chung:** Số Nhỏ, Số Lớn, Ngũ Phúc, Dội Trống, Kho Bài, Thăng Hạng May, Nhặt Ve Chai, Heo Đất, Bỏ Thêm, Lên Hạng, Đánh Thêm, Tay Dài, Phao Cứu Sinh.
- **Thần** (nhận sau trùm chặng 3 và 6): Nhất Thống, Bản Sao, Thêm Chỗ Ngồi.
Mô tả hiệu ứng nằm trong `charms.json`; mọi bùa có điều kiện đã được thử cả trường hợp cộng và không cộng trong `test/engine.test.js`.

## 3. Cảm giác và hiệu ứng

Giữ nguyên toàn bộ từ bản Tam Cúc. Đặc tả chi tiết (thời gian, số hạt, âm, mốc) nằm ở **`docs/ANIMATION_SPEC.md`**: tính từng lá, chip và hệ số lăn dần, ô nóng dần, "Liên hoàn", tên bộ phóng to cho bộ lớn, cú nổ điểm 5 mức đến QUÁ TẢI, thanh điểm nạp sau khi tính xong có lõi rực sáng, biểu ngữ vào ải, chú giải lá bài, chạm để tua nhanh.

## 4. Đồ hoạ

Mỗi lá có **một hình riêng** theo chủ đề của bộ bài Tổ tôm cổ, in nét mực đen, tô màu của họ (Văn đỏ son, Sách lục ngọc, Vạn chàm), tên số và họ bằng tiếng Việt ở dải trên (ví dụ "Cửu / Vạn"), số chip ở góc dưới trái, biểu tượng họ nhỏ ở góc trên trái, dấu son (vòng nét đứt) ở các lá đỏ truyền thống (Bát Vạn, Cửu Vạn, Bát Sách, Cửu Sách và ba lá Yêu). Không dùng chữ Hán. Kích thước lá bài không đổi so với bản Tam Cúc. Hình do mã vẽ lại theo tinh thần bài cổ (ghép từ mũ, áo, tay, vật cầm trong `web/ui.js`: `FIG`, `OBJECTS`, `drawFigure`), không chép nét vẽ từ bộ bài nào.

**Hình từng lá.** Bốn lá không có người: **Nhị Vạn** cành đào, **Ngũ Vạn** vọng lâu, **Bát Vạn** cá chép, **Ngũ Sách** thuyền buồm. Các lá còn lại là người trang phục kiểu cổ (tranh bài Tổ tôm vẽ người thời Edo của Nhật). Có nguồn văn bản xác nhận: Nhị Vạn cành đào, Ngũ Sách thuyền buồm, Bát Vạn cá chép, Ngũ Vạn vọng lâu (chùa), Cửu Vạn người vác hòm trên vai, Chi Chi ông to lớn vác hai quả chùy, Thang Thang người phụ nữ bế con, Ông Cụ cụ ông râu dài cầm gậy. Các lá còn lại lấy theo ảnh bộ bài cổ do chủ dự án cung cấp (chưa có nguồn chữ), cần họa sĩ đối chiếu với bộ bài thật:
- **Vạn:** 1 người múa, 2 cành đào, 3 cô gái cầm nón, 4 người đẩy xe, 5 vọng lâu, 6 người vác cuốc, 7 người bưng bát, 8 cá chép, 9 người vác hòm, Ông Lão.
- **Sách:** 1 người chống nạnh, 2 cụ già khoác áo, 3 người đội nón gánh bọc, 4 cô quỳ bưng khay, 5 thuyền buồm, 6 người bế con, 7 cô bưng mâm, 8 cô ngồi, 9 người xách đèn, Thang Thang.
- **Văn:** 1 cô gái đi dạo, 2 người vác bao, 3 người chống gậy mang bọc, 4 người bưng hộp, 5 người đội nón, 6 người chạy xách đèn, 7 người cầm chai, 8 cậu bé đi cà kheo, 9 người vác thang, Chi Chi.
Tên nhân vật hiện ở chú giải khi trỏ vào lá. Bản chính thức cần họa sĩ vẽ lại 30 hình, 45 bùa, 12 trùm và nền trống đồng. Bảng màu: nền đen nâu sơn mài `#150b08`, vàng ánh kim `#e2ad3c`, đỏ son `#d1391f` (Văn), lục ngọc `#1f8a78` (Sách), xanh chàm `#2b58b0` (Vạn), giấy dó `#f3e8cc`.

## 5. Cấu trúc mã

```
src/engine.js      Lõi luật (class Run). Không đụng giao diện, chạy cả Node lẫn trình duyệt.
src/charms.js      Hành vi từng bùa, tra theo id.
src/bots.js        4 bot chơi thử: Phu dọc, Bộ giống, Cùng họ, Lá Yêu.
src/rng.js         Số ngẫu nhiên có seed.
src/data/*.json    Mọi số liệu: lá, bộ, bùa, trùm, cấu hình, bảng mục tiêu điểm.
sim/               simulate (chạy hàng loạt), calibrate (chỉnh mục tiêu), report (sinh docs/BALANCE.md).
test/engine.test.js  Test luật.
web/               Giao diện (template + ui.js).
build-demo.js      Gộp thành dist/tamtom-demo.html, một file tự đủ.
```

API chính của `Run`: `new Run({seed, difficulty, deck})`, `phase` (`playing` | `skip` | `than` | `shop` | `pack` | `lost` | `won`), `deck`, `round`, `preview(ids)` (có `lockedBetter`), `play(ids)` (trả về từng bước tính điểm để làm hoạt ảnh), `discard(ids)`, `sortHand('rank'|'color')` (xếp theo số hoặc theo họ), `blinds()`, `skipAi`, `pickSkip`, `pickPack`, `buy(uid, targets)`, `sell`, `reroll`, `levelUp(id)`, `lockedHands()`, `unlockedHands()`. Xuất khẩu của engine thêm `HO`, `HO_VI`, `YEU_VI`, `cardName(card)`.

## 6. Mốc công việc

| Mốc | Việc | Kiểm tra được bằng |
| --- | --- | --- |
| M0 | Chạy lại công cụ ở máy mới | `npm test` đạt toàn bộ; `npm run sim`; `npm run build` ra `dist/tamtom-demo.html` |
| M1 | Chơi thử bằng người thật 10 ván, ghi lại bùa chán và bùa mạnh, và xem Tôm, Lèo, Tam Yêu có "trúng số" quá hiếm không | Bảng ghi chép, đối chiếu `docs/BALANCE.md` |
| M2 | Chỉnh số theo M1, chạy lại `npm run calibrate` và `npm run report` | Tỉ lệ thắng của bot không lệch quá 2 lần giữa 4 build |
| M3 | Vẽ 30 lá thật, 45 bùa, nền; âm thanh thật | Chụp màn hình một ải đang tính điểm |
| M4 | Đóng gói cho nền tảng đích | Android tầm thấp 60 khung hình/giây, bản web dưới 10 MB |

## 7. Sự kiện cần ghi và quảng cáo

Chưa nối dịch vụ nào. Sự kiện gợi ý: `run_start`, `ai_start`, `ai_clear`, `ai_fail`, `hand_played` (loại bộ, điểm), `discard_used`, `charm_bought`, `que_bought`, `que_unlock` (bộ được mở), `shop_reroll`, `run_end`. Quảng cáo đặt sau một hàm duy nhất `ShowRewarded(placement, onReward)` (sau khi thua, làm mới chợ).

## 8. Rủi ro cân bằng cần theo dõi

- Bộ bài 120 lá có 4 bản mỗi lá nên đôi giống hệt rất thường gặp, còn Khàn, Thiên Khai, Tôm, Lèo, Tam Yêu hiếm. Cần xem người chơi thật có thấy bộ hiếm đáng chờ hay chỉ là may rủi.
- Sảnh khóa (lẫn họ) và Cù lũ lẫn họ, Tứ quý lẫn họ phải mở bằng Quẻ: xem người chơi có bị thiếu bộ ở đầu ván không.
- Bot **Bộ giống** yếu hơn các bot khác vì chưa biết phối Khàn, Thiên Khai; số liệu bot chỉ là mặt bằng thấp.
- Bộ bài lớn (120 lá) làm Ấn Nhân Bản và Trừ Tà ít tác động hơn bản 32 lá; nếu thấy nhạt thì tăng số lá mỗi lần hoặc thêm Ấn mới.
- Điểm mục tiêu (`targets.json`) sinh từ mô phỏng; chạy lại `npm run calibrate` và `npm run report` mỗi lần đổi luật, bùa hoặc trùm.

## 9. Ý tưởng chưa làm

Giữ nguyên kho ý tưởng Balatro của bản Tam Cúc (nấc độ khó Stake, vật phẩm dùng một lần, nhãn dán bùa, thêm phù phép và trùm). Riêng Tổ tôm có thể thêm: bùa theo bộ đặc biệt khác của Tổ tôm (chi nảy, kính cụ, bạch định), bộ "ba đầu" (Nhất–Nhị–Tam lẫn họ), lá đỏ ("yêu đỏ") hiếm, chế độ chơi theo luật cổ truyền có ăn bài và ù.

## 10. Câu hỏi còn mở, kèm mặc định

- Có muốn luật cổ truyền (phu, ăn bài, ù) hay giữ kiểu poker có hương vị Tổ tôm? Mặc định: giữ kiểu poker.
- Phạt hay cấm hẳn bộ bị trùm nhắm tới? Mặc định: phạt còn nửa (`bossBan: "half"`).
- Đích phát hành là web, Android hay run.world? Mặc định: web trước.
- Lưu ván giữa chừng? Mặc định: chưa làm.
