# PHỖNG.EXE — GDD Phase 2
> Phiên bản: 2026-11-10 | Tham chiếu: Balatro (LocalThunk, 2024)

---

## 1. Bảng Bộ — Tinh Chỉnh

### 1.1 Danh sách bộ mới (15 bộ, từ 22 xuống)

| # | ID code | Tên hiển thị | Chips | ×Mult | lvChips | lvMult | Thay đổi |
|---|---|---|---|---|---|---|---|
| 1 | `five` | Ngũ quý | 120 | ×9 | 45 | 3 | giữ nguyên |
| 2 | `run5_same` | Phu dọc 5 | 110 | ×9 | 45 | 3 | giữ nguyên |
| 3 | `tom` | Tôm | 90 | ×8 | 40 | 3 | giữ nguyên |
| 4 | `leo` | Lèo | 90 | ×8 | 40 | 3 | giữ nguyên |
| 5 | `four` | Tứ quý | 60 | ×7 | 25 | 2 | **GỘP** Thiên Khai (`four_same`) + Tứ quý (`four`), stats theo Balatro |
| 6 | `tam_yeu` | Tam Yêu | 80 | ×8 | 40 | 3 | giữ nguyên |
| 7 | `full` | Cù lũ | 40 | ×4 | 25 | 2 | **GỘP** Cù lũ cùng họ (`full_same`) + Cù lũ lẫn họ (`full`), stats theo Balatro |
| 8 | `run4_same` | Phu dọc 4 | 65 | ×6 | 30 | 3 | giữ nguyên |
| 9 | `run5` | Sảnh | 30 | ×4 | 25 | 2 | **ĐỔI TÊN** từ "Sảnh 5 lẫn họ", stats theo Balatro (Straight 30×4) |
| 10 | `three` | Phu bí | 30 | ×3 | 20 | 2 | **GỘP** Khàn (`three_same`) + Phu bí (`three`), stats theo Balatro |
| 11 | `flush5` | Thuần họ | 35 | ×4 | 25 | 2 | stats tăng nhẹ theo Balatro (Flush 35×4) |
| 12 | `run3_same` | Phu dọc 3 | 40 | ×4 | 25 | 2 | giữ nguyên |
| 13 | `two_pair` | Hai đôi | 20 | ×2 | 20 | 1 | **GỘP** Hai đôi cùng họ + khác họ, stats theo Balatro |
| 14 | `pair_mixed` | Đôi | 10 | ×2 | 15 | 1 | **GỘP** Đôi cùng họ + khác họ, stats theo Balatro |
| 15 | `single` | Lá lẻ | 5 | ×1 | 10 | 1 | giữ nguyên |

### 1.2 Các bộ bị xóa

| ID | Tên cũ | Lý do |
|---|---|---|
| `four_same` | Thiên Khai | Gộp vào `four` |
| `three_same` | Khàn | Gộp vào `three` |
| `full_same` | Cù lũ cùng họ | Gộp vào `full` |
| `two_pair_same` | Hai đôi cùng họ | Gộp vào `two_pair` |
| `pair_same` | Đôi cùng họ | Gộp vào `pair_mixed` |
| `run3` | Sảnh 3 lẫn họ | Bỏ — giữ Phu dọc 3 cùng họ |
| `run4` | Sảnh 4 lẫn họ | Bỏ — giữ Phu dọc 4 cùng họ |

### 1.3 Thay đổi logic engine (`engine.js`)

- Xóa các entry `pair_mixed→pair_same`, `two_pair→two_pair_same`, `full→full_same` khỏi map `SAME[]`
- `run3` và `run4` không còn trong `HAND_ORDER` nhưng vẫn giữ trong `SAME[]` làm base type để detect `run3_same` / `run4_same`
- Cập nhật `hands.json` theo bảng trên

### 1.4 Các file cần cập nhật theo

| File | Nội dung cập nhật |
|---|---|
| `src/data/hands.json` | Xóa 7 bộ, cập nhật tên + stats |
| `src/engine.js` | Xóa 3 entry trong `SAME[]` |
| `src/data/charms.json` | Bùa "Cù Lũ Nở Rộ" check "cả hai bản" → chỉ còn 1 bản |
| `src/data/bosses.json` | Gộp `pair_same`/`pair_mixed`, `two_pair_same`/`two_pair` |
| `src/bots.js` | Cập nhật strategy array |
| `src/charms.js` | Cập nhật các check `ctx.hand.type` |

---

## 2. Bùa Mới — Bổ Sung (21 bùa)

> Lấy cảm hứng từ Balatro joker archetypes còn thiếu trong PHỖNG.EXE hiện tại.

### 2.1 Nhóm Số (Rank-based)

| ID | Tên | Độ hiếm | Giá | Hiệu ứng |
|---|---|---|---|---|
| `so_giua` | Số Giữa | thuong | 4 | Lá Tứ, Ngũ, Lục ghi điểm: +10 chip mỗi lá |
| `leo_thang` | Leo Thang | thuong | 5 | Lá Thất, Bát, Cửu ghi điểm: bùa này +1 hệ số vĩnh viễn |
| `nhat_manh` | Nhất Mạnh | hiem | 7 | Lá Nhất ghi điểm: ×2 hệ số (mỗi lá Nhất) |
| `day_xich_so` | Dây Xích Số | hiem | 7 | Mỗi lá ghi điểm mà lá có số kế tiếp cũng ghi điểm: +12 chip |

### 2.2 Nhóm Kinh Tế (Economy)

| ID | Tên | Độ hiếm | Giá | Hiệu ứng |
|---|---|---|---|---|
| `con_trau` | Con Trâu | hiem | 8 | Khi tính điểm: +3 chip cho mỗi đồng đang có |
| `dao_van` | Đào Vạn | thuong | 4 | Lá Vạn ghi điểm: +$1 |
| `tieu_thuong` | Tiểu Thương | thuong | 4 | Mỗi lần dùng lượt bỏ bài: +$1 |
| `thuong_nhan` | Thương Nhân | thuong | 5 | Mỗi ải: 1 lần xáo lại shop miễn phí |

### 2.3 Nhóm Retrigger

| ID | Tên | Độ hiếm | Giá | Hiệu ứng |
|---|---|---|---|---|
| `hoi_ma_thuong` | Hồi Mã Thương | hiem | 7 | Lá **cuối cùng** được đánh: ghi điểm thêm 1 lần |
| `phan_chieu` | Phản Chiếu | hiem | 7 | Lá Yêu (Chi Chi / Thang Thang / Ông Lão) ghi điểm: tính thêm 1 lần |

### 2.4 Nhóm Đánh Đổi (Trade-off)

| ID | Tên | Độ hiếm | Giá | Hiệu ứng |
|---|---|---|---|---|
| `vo_vi` | Vô Vi | hiem | 8 | Tay bài -1 lá; +250 chip mỗi lần đánh |
| `tu_hanh` | Tu Hành | quy | 10 | 0 lượt bỏ bài mỗi ải; ×5 hệ số |
| `mao_hiem` | Mạo Hiểm | quy | 9 | Phù Linh không vỡ → ×3 hệ số lần đó; nếu vỡ → -1 ô bùa vĩnh viễn |

### 2.5 Nhóm Tích Lũy (Scaling)

| ID | Tên | Độ hiếm | Giá | Hiệu ứng |
|---|---|---|---|---|
| `bich_hoa` | Bích Họa | hiem | 7 | Mỗi bộ **khác nhau** đã đánh trong ván: +2 hệ số (tối đa +26, tức 13 bộ) |
| `linh_gia` | Lính Già | hiem | 7 | Mỗi bùa đã bán trong ván: +3 hệ số vĩnh viễn |
| `dau_vet` | Dấu Vết | hiem | 6 | Mỗi lượt bỏ bài đã dùng trong ải: +4 hệ số vĩnh viễn |
| `cong_dong_luc` | Cộng Động Lực | quy | 9 | Mỗi Boss đã thắng trong ván: ×0.5 hệ số tích lũy |

### 2.6 Nhóm Điều Kiện (Conditional)

| ID | Tên | Độ hiếm | Giá | Hiệu ứng |
|---|---|---|---|---|
| `bieu_tuong_doi` | Biểu Tượng Đôi | thuong | 5 | Đánh Đôi: ×2 hệ số |
| `bieu_tuong_ba` | Biểu Tượng Ba | thuong | 5 | Đánh Phu bí: ×3 hệ số |
| `bieu_tuong_tu` | Biểu Tượng Tứ | hiem | 7 | Đánh Tứ quý: ×4 hệ số |
| `tranh_thu` | Tranh Thủ | hiem | 7 | Bỏ qua ải thường (Small/Big blind, không phải Boss): +$10 mỗi lần |

> **Ghi chú thiết kế:**
> - `bieu_tuong_*` cộng hưởng với `co_doi` (chip) nhưng không trùng lặp (cái này cho ×mult)
> - `con_trau` tạo synergy với `heo_dat` (nâng trần lãi) và `dao_van`
> - `mao_hiem` yêu cầu Phase 2c (Phù Linh) hoàn thành trước
> - `cong_dong_luc`: ×0.5 tích lũy nghĩa là sau 4 boss = ×2.0 hệ số bổ sung

---

## 3. Hệ Thống Tiêu Hao (Consumables) — MỚI


> Lấy cảm hứng từ Tarot / Planet / Spectral Cards của Balatro, theme hóa theo văn hóa Á Đông / Tổ Tôm.

### 3.1 Thẻ Địa Chi (tương đương Planet Cards)
Nâng cấp một bộ bài lên +1 cấp (tăng chips và mult). Mỗi Địa Chi tương ứng một bộ cụ thể.

| Thẻ | Bộ được nâng |
|---|---|
| Tý | Đôi (`pair_mixed`) |
| Sửu | Hai đôi (`two_pair`) |
| Dần | Phu bí (`three`) |
| Mão | Tứ quý (`four`) |
| Thìn | Cù lũ (`full`) |
| Tỵ | Sảnh (`run5`) |
| Ngọ | Phu dọc 3/4/5 (`run_same`) — nâng cả 3 |
| Mùi | Thuần họ (`flush5`) |
| Thân | Ngũ quý (`five`) |
| Dậu | Tam Yêu / Lèo / Tôm — nâng cả 3 |
| Tuất | Bộ được đánh nhiều nhất trong ván |
| Hợi | Ngẫu nhiên một bộ |

**Nguồn gốc:** mua tại shop, trong pack thẻ, thưởng sau màn boss.

### 3.2 Thẻ Âm Dương (tương đương Tarot Cards)
Biến đổi lá bài trong tay: đổi họ, tăng số, thêm Phù/Ấn, xóa lá, kiếm tiền...

| Thẻ | Hiệu ứng |
|---|---|
| Càn | Đổi họ 2 lá sang Vạn |
| Khảm | Đổi họ 2 lá sang Sách |
| Cấn | Đổi họ 2 lá sang Văn |
| Chấn | Tăng số 1 lá lên +1 |
| Tốn | Thêm Ấn Đỏ vào 1 lá (retrigger) |
| Ly | Phá hủy 1 lá, +10$ |
| Khôn | Nhân đôi tiền hiện có (tối đa +20$) |
| Đoài | Tạo 1 Thẻ Địa Chi ngẫu nhiên |
| Thái Cực | Tạo bản sao 1 lá bài được chọn |
| Lưỡng Nghi | Thêm Phù vào 2 lá ngẫu nhiên |
| Tứ Tượng | Đổi 4 lá bài trong tay sang cùng họ ngẫu nhiên |
| Bát Quái | Tạo 1 bùa ngẫu nhiên |

**Nguồn gốc:** trong pack thẻ, shop, Ấn Tím khi bỏ bài.

### 3.3 Thẻ Linh Phù (tương đương Spectral Cards)
Hiếm, hiệu ứng mạnh và kỳ lạ — rủi ro/lợi nhuận cao. Không bán ở shop thường.

| Thẻ | Hiệu ứng |
|---|---|
| Nhất Dương | Tạo bản sao 1 lá, phá hủy 3 lá khác |
| Âm Hỏa | Tất cả lá trong tay thành cùng họ ngẫu nhiên |
| Hư Không | Thêm bùa Huyền Hiếm ngẫu nhiên; tiền về $0 |
| Phân Ly | Tạo bản sao 1 bùa, xóa tất cả bùa còn lại |
| Hóa Thân | Tất cả lá trong tay thành cùng số ngẫu nhiên |
| Thiên Mệnh | Nâng ngẫu nhiên 3 bộ lên +1 cấp |
| Vong Linh | Tăng vĩnh viễn số lá bài được đánh tối đa +1, giảm tiền $5 |

**Nguồn gốc:** pack hiếm đặc biệt, thưởng thách thức, không bao giờ xuất hiện trong shop thường.

---

## 4. Nâng Cấp Lá Bài (Card Enhancements) — MỚI

> Lấy cảm hứng từ Card Enhancements của Balatro. Mỗi lá bài có thể được gắn 1 Phù.

| ID | Tên | Hiệu ứng | Balatro gốc |
|---|---|---|---|
| `bonus` | Phù Chip | +30 chip khi ghi điểm | Bonus Card |
| `mult` | Phù Nhân | +4 hệ số khi ghi điểm | Mult Card |
| `glass` | Phù Linh | ×2 hệ số; 1/4 cơ hội vỡ sau khi ghi điểm | Glass Card |
| `wild` | Phù Vạn Năng | Tính là bất kỳ họ nào | Wild Card |
| `steel` | Phù Thép | ×1.5 hệ số khi **còn trong tay** (không cần đánh) | Steel Card |
| `gold` | Phù Vàng | +3$ cuối hiệp nếu còn trên tay | Gold Card |
| `stone` | Phù Đá | +50 chip; không còn số/họ | Stone Card |
| `lucky` | Phù May | 1/5 cơ hội +20 hệ số khi ghi điểm; 1/15 cơ hội +$20 | Lucky Card |

**Cách gắn Phù:** qua Thẻ Âm Dương, Thẻ Linh Phù, một số bùa đặc biệt, hoặc pack thẻ.

---

## 5. Ấn Lá Bài (Card Seals) — MỚI

> Lấy cảm hứng từ Card Seals của Balatro. Mỗi lá chỉ có thể mang 1 Ấn.

| ID | Tên | Hiệu ứng | Balatro gốc |
|---|---|---|---|
| `seal_gold` | Ấn Vàng | +3$ mỗi lần lá này ghi điểm | Gold Seal |
| `seal_red` | Ấn Đỏ | Ghi điểm thêm 1 lần (retrigger) | Red Seal |
| `seal_blue` | Ấn Xanh | Cuối hiệp: tạo 1 Thẻ Địa Chi ngẫu nhiên nếu lá còn trên tay | Blue Seal |
| `seal_purple` | Ấn Tím | Khi bỏ lá: tạo 1 Thẻ Âm Dương ngẫu nhiên | Purple Seal |

**Cách gắn Ấn:** qua Thẻ Âm Dương (Tốn → Ấn Đỏ), Thẻ Linh Phù, một số bùa đặc biệt.

---

## 6. Phiên Bản Lá Bài / Bùa (Editions) — MỚI

> Lấy cảm hứng từ Card Editions của Balatro. Áp dụng cho cả lá bài lẫn bùa.

| ID | Tên | Hiệu ứng lên lá bài | Hiệu ứng lên bùa | Balatro gốc |
|---|---|---|---|---|
| `foil` | Vàng Lá | +50 chip khi ghi điểm | +50 chip vào bộ | Foil |
| `holo` | Hào Quang | +10 hệ số | +10 hệ số vào bộ | Holographic |
| `poly` | Lục Sắc | ×1.5 hệ số | ×1.5 hệ số vào bộ | Polychrome |
| `negative` | Vô Hình | (chỉ cho bùa) | +1 ô bùa vĩnh viễn | Negative |

**Cách có:** mua bùa phiên bản đặc biệt trong shop, hoặc qua Thẻ Linh Phù "Aura".

---

## 7. Achievements — MỚI

### Nhóm Bộ Bài
| ID | Tên | Điều kiện |
|---|---|---|
| `ach_five` | Ngũ Quý Đầu Tiên | Đánh được Ngũ quý lần đầu |
| `ach_phu_doc` | Dọc Suốt | Đánh Phu dọc 5 lần đầu |
| `ach_triple_special` | Bộ Ba Hiếm | Đánh Tôm, Lèo, Tam Yêu trong cùng 1 ván |
| `ach_sweep` | Quét Sạch | Đánh 5 bộ khác nhau trong 1 màn |
| `ach_flush_all` | Thuần Chủng | Đánh Thuần họ 5 lần trong 1 ván |

### Nhóm Điểm Số
| ID | Tên | Điều kiện |
|---|---|---|
| `ach_1k` | Nghìn Điểm | Đạt 1,000 điểm trong 1 lần đánh |
| `ach_10k` | Vạn Điểm | Đạt 10,000 điểm trong 1 lần đánh |
| `ach_mult100` | Hệ Số Trăm | Đạt hệ số ×100 trong 1 lần đánh |
| `ach_chip1k` | Chip Nghìn | Có hơn 1,000 chip trong 1 lần đánh |

### Nhóm Thách Thức
| ID | Tên | Điều kiện |
|---|---|---|
| `ach_no_discard` | Bàn Tay Sạch | Thắng 1 màn không dùng bỏ bài |
| `ach_poor_win` | Nghèo Mà Sang | Thắng ván với chỉ 2 bùa đang hoạt động |
| `ach_no_buy` | Chay Tịnh | Thắng ván không mua gì trong shop |
| `ach_last_chance` | Chạy Nước Rút | Thắng màn boss với chỉ 1 lần đánh còn lại |
| `ach_glass_survive` | May Mắn Thật Sự | Phù Linh không vỡ 5 lần liên tiếp |
| `ach_boss_streak` | Vô Địch | Thắng liên tiếp 3 màn Boss không thua lần nào |

### Nhóm Thu Thập
| ID | Tên | Điều kiện |
|---|---|---|
| `ach_5charms` | Nhà Sưu Tập | Có đủ 5 bùa cùng lúc |
| `ach_all_charms` | Thư Viện Bùa | Mở khóa tất cả bùa trong game |
| `ach_all_phu` | Tín Đồ Phu | Mua tất cả loại Phu trong 1 ván |
| `ach_all_hands` | Bách Chiến | Đánh được tất cả 15 bộ ít nhất 1 lần |

### Nhóm Đặc Biệt
| ID | Tên | Điều kiện |
|---|---|---|
| `ach_lucky_triple` | Phước Lớn | Phù May kích hoạt 3 lần trong 1 lần đánh |
| `ach_wild50` | Lá Linh Huyền Thoại | Lá Phù Vạn Năng ghi điểm 50 lần tích lũy |
| `ach_retrigger` | Vòng Lặp Vô Tận | Ấn Đỏ kích hoạt 10 lần trong 1 lần đánh |
| `ach_spectral` | Duyên Âm | Dùng Thẻ Linh Phù lần đầu |

---

## 8. Thứ Tự Ưu Tiên Triển Khai

### Phase 2a — Bảng bộ (ưu tiên cao, làm ngay)
1. Cập nhật `hands.json` — 15 bộ, stats mới
2. Cập nhật `engine.js` — xóa entries trong `SAME[]`
3. Cập nhật `charms.json`, `charms.js`, `bosses.json`, `bots.js`

### Phase 2b — Bùa mới (ưu tiên cao, làm cùng 2a)
- Thêm 21 bùa mới vào `charms.json` + `charms.js`
- Ưu tiên: Nhóm Số, Kinh Tế, Điều Kiện trước (không cần hệ thống mới)
- Nhóm Đánh Đổi (`mao_hiem`) chờ Phase 2c (cần Phù Linh)

### Phase 2c — Achievements (ưu tiên trung bình)
- Thêm file `achievements.json` + logic track trong engine
- UI hiển thị achievements (màn hình collection)

### Phase 2d — Card Enhancements + Seals (ưu tiên trung bình)
- Thêm field `enhancement` và `seal` vào card object
- Logic scoring trong engine
- UI hiển thị trên lá bài
- Mở khóa bùa `mao_hiem` sau khi Phù Linh hoàn thành

### Phase 2e — Consumables (ưu tiên thấp, phức tạp nhất)
- Thẻ Địa Chi (Planet Cards) — đơn giản nhất trong nhóm này
- Thẻ Âm Dương (Tarot Cards)
- Thẻ Linh Phù (Spectral Cards)

### Phase 2f — Editions (ưu tiên thấp, cần Phase 2d xong trước)
- Thêm field `edition` vào card và charm object
- Visual effect (foil shimmer, holo glow, poly rainbow)

---

*GDD này là tài liệu sống — cập nhật khi có quyết định thiết kế mới.*
