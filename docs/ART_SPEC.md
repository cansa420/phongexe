# PHỖNG.EXE: thông số ảnh để bạn làm bên ngoài

Tài liệu này đi kèm 91 ảnh **tạm** trong `assets/` (30 lá bài, 16 nền chặng, 45 icon bùa). Bạn làm ảnh thật, **đặt đúng tên tệp** vào đúng thư mục, ghi đè ảnh tạm, rồi chạy `node build-demo.js`. Không phải sửa mã.

## 1. Quy tắc chung cho mọi ảnh

| Mục | Quy định |
| --- | --- |
| Định dạng | PNG 32-bit, có kênh trong suốt (nền chặng thì đặc, không trong suốt) |
| Pixel | Vẽ ở **kích thước gốc nhỏ** như bảng dưới, không khử răng cưa, không làm mờ, không xoay nghiêng góc lẻ. Game tự phóng to theo bội số nguyên (nearest neighbour), nên đừng xuất sẵn bản đã phóng |
| Bảng màu | 6 màu gốc của GDD mục 9.2, thêm các bậc pha trộn của mục 9.3 (ảnh tạm dùng đúng bảng này). Mỗi nhân vật trên lá nên dùng **tối đa 5 màu** (GDD mục 9.7) |
| Viền | Viền ngoài 1 px màu Đen `#191b1f` cho nhân vật, vật thể, icon (ảnh tạm đã làm mẫu) |
| Chữ | **Không vẽ chữ hay số vào ảnh** (trừ nhãn số nhỏ trên icon bùa, xem mục 4). Tên lá, số chip, ký hiệu họ do giao diện vẽ để luôn đúng tiếng Việt và đổi được |
| Cấm | Họa tiết trống đồng, vòng tròn đồng tâm kiểu trống đồng, chữ Hán/Nôm, hoa đào/mai/quất Tết, rồng phượng kiểu Trung Hoa (GDD mục 9.6) |
| Ánh sáng | Sáng từ trên-trái, tối ở phải-dưới |

### Bảng màu

| Tên | Mã | Dùng cho |
| --- | --- | --- |
| Đỏ son | `#963F38` | Họ Văn, trùm, cảnh báo |
| Xanh chàm | `#293C4A` | Nền panel, họ Vạn |
| Men ngọc | `#45a79e` | Họ Sách, chip, điểm tích cực |
| Kem | `#e7dcc2` | Mặt bài, chữ, viền sáng |
| Đen | `#191b1f` | Viền, bóng, vùng tối |
| Vàng cổ | `#B99A60` | Tiền, lá Yêu, khung hiếm |

Bậc pha trộn đang dùng: chàm-sáng `#45545c`, chàm-tối `#232f39`, đỏ-sáng `#aa665b`, đỏ-tối `#5e2f2d`, ngọc-sáng `#76b7a9`, ngọc-tối `#316865`, vàng-tối `#716143`, vàng-sáng `#d3c09d`, kem-tối `#b3ac99`.
Lưu ý: chàm gần như cùng độ sáng với đen, nên đừng tách lớp chỉ bằng hai màu này; dùng viền sáng hoặc chàm-sáng.

## 2. Ba mươi lá bài (nhân vật)

- Thư mục: `assets/cards/`, tên `{van|sach|wan}_{1..10}.png`, thêm `junk.png` cho lá Tạp.
- **Kích thước chuẩn: 64 × 138 px** (rộng : cao = 1 : 2,16), nền trong suốt. Đây là tỉ lệ đúng của vùng tranh trong khung lá nên ảnh lấp đầy vùng tranh, không thừa lề. Lá lớn nhất trong game (lá trên bàn đánh, màn ngang) cho vùng tranh khoảng 73 × 158 px trên màn hình, nên 64 × 138 chỉ phóng khoảng 1,15 lần. Muốn nét hơn cứ vẽ to gấp đôi hoặc gấp ba cùng tỉ lệ (128 × 277, 192 × 415): mã tự co theo vùng tranh, không phải sửa gì. Ảnh tạm hiện còn 48 × 88 và vẫn dùng được cho tới khi bạn thay.
- **Bố cục lá:** tên lá (Cửu, Thất...) ở đầu lá, nhân vật to ở giữa, tên họ (Sách, Văn, Vạn), số chip và ký hiệu họ ở chân lá. Cả đầu và chân do giao diện vẽ trên nền màu họ, nên **ảnh chỉ là vùng nhân vật ở giữa**, không vẽ chữ, không vẽ khung.
- Người đứng: đặt chân ở hàng y = 130 (trên 138 hàng). Chừa lề 2 px mỗi cạnh; nhân vật cao tối đa khoảng 120 px để có chỗ cho tay cầm, mũ, đồ vật.
- Họ quyết định màu áo chủ đạo: Văn = đỏ son, Sách = men ngọc, Vạn = chàm-sáng (có viền kem hoặc xám sáng để tách nền).
- Số 10 là lá Yêu, có tên riêng: Chi Chi (Văn), Thang Thang (Sách), Ông Lão (Vạn). Nhân vật Yêu nên to và dễ nhận nhất họ.

| Tệp | Lá | Chủ đề (theo V3, họa sĩ đối chiếu bộ bài cổ) |
| --- | --- | --- |
| `van_1.png` | Nhất Văn | Cô gái đi dạo |
| `van_2.png` | Nhị Văn | Người vác bao |
| `van_3.png` | Tam Văn | Người chống gậy mang bọc |
| `van_4.png` | Tứ Văn | Người bưng hộp |
| `van_5.png` | Ngũ Văn | Người đội nón |
| `van_6.png` | Lục Văn | Người chạy xách đèn |
| `van_7.png` | Thất Văn | Người cầm chai |
| `van_8.png` | Bát Văn | Cậu bé đi cà kheo |
| `van_9.png` | Cửu Văn | Người vác thang |
| `van_10.png` | Chi Chi Văn | Chi Chi: ông to lớn vác hai quả chùy |
| `sach_1.png` | Nhất Sách | Người chống nạnh |
| `sach_2.png` | Nhị Sách | Cụ già khoác áo |
| `sach_3.png` | Tam Sách | Người đội nón gánh bọc |
| `sach_4.png` | Tứ Sách | Cô quỳ bưng khay |
| `sach_5.png` | Ngũ Sách | Thuyền buồm |
| `sach_6.png` | Lục Sách | Người bế con |
| `sach_7.png` | Thất Sách | Cô bưng mâm |
| `sach_8.png` | Bát Sách | Cô ngồi |
| `sach_9.png` | Cửu Sách | Người xách đèn chống gậy |
| `sach_10.png` | Thang Thang Sách | Thang Thang: mẹ bế con |
| `wan_1.png` | Nhất Vạn | Người múa |
| `wan_2.png` | Nhị Vạn | Cành đào |
| `wan_3.png` | Tam Vạn | Cô gái cầm nón |
| `wan_4.png` | Tứ Vạn | Người đẩy xe |
| `wan_5.png` | Ngũ Vạn | Vọng lâu |
| `wan_6.png` | Lục Vạn | Người vác cuốc |
| `wan_7.png` | Thất Vạn | Người bưng bát |
| `wan_8.png` | Bát Vạn | Cá chép |
| `wan_9.png` | Cửu Vạn | Người vác hòm |
| `wan_10.png` | Ông Lão Vạn | Ông Lão: cụ ông râu dài chống gậy |
| `junk.png` | Lá Tạp | Lá nhiễu "mã lỗi": nhìn là biết vô dụng, tông xám chàm |

## 2b. Khung lá bài (ảnh)

- Thư mục `assets/frames/`: `van.png` (đỏ son), `sach.png` (men ngọc), `wan.png` (chàm), `back.png` (lưng lá, dùng cho cọc rút). Ảnh gốc 4 lá để cắt: `_source.png`.
- Mỗi khung **64 × 134 px**, nền trong suốt, góc vát. Giao diện cắt 9 ô (trên 30, dưới 30, hai bên 8 px) nên phần ruột giữa giãn được theo tỉ lệ lá (`--ratio` trong `web/skin.css`). Đầu lá (tên) cao 15 px, chân lá (chip, họ) cao 13 px, vùng tranh là phần kem ở giữa.
- Muốn đổi khung: thay `assets/frames/_source.png` bằng ảnh 4 lá cạnh nhau (nền đen thuần, thứ tự Văn, Sách, Vạn, lưng) rồi chạy `node tools/slice-frames.js` và `node build-demo.js`. Nếu khung mới có đầu lá, chân lá khác độ cao thì chỉnh các hằng `--u * 30`, `--u * 15`, `--u * 13` ở cuối `web/skin.css`.

## 3. Tám nền chặng

- Thư mục: `assets/bg/`. Mỗi chặng **hai tệp**: `stage{1..8}_p.png` (dọc) và `stage{1..8}_l.png` (ngang).
- **Dọc 9:16: 180 × 320 px.** **Ngang 16:9: 320 × 180 px.** Cả hai là bội số nguyên của độ phân giải thật (×6 ra 1080×1920 và 1920×1080; ×4 ra 720×1280 và 1280×720). Nền đặc, không trong suốt.
- Giao diện đặt nền phủ kín (cover, căn đáy) và **phủ một lớp tối dần từ trên xuống** để chữ đọc được. Vì vậy:
  - **Phần quan trọng của cảnh ở nửa trên** (khoảng 5% đến 60% chiều cao). Đường chân trời đặt ở khoảng **60% (dọc)** và **64% (ngang)** chiều cao.
  - Nửa dưới là mặt đất, ít chi tiết và tương phản thấp, vì tay bài và nút đè lên.
  - Giữ vùng giữa-trên thoáng, vì hàng bùa và lá đã đánh nằm ở đó.
- Màn ngang có hai cột panel hai bên (22% trái, 14% phải): đừng đặt chi tiết quan trọng sát mép trái/phải.
- Mỗi nền chỉ đổi **màu chủ đạo và họa tiết**, vẫn dùng đúng bảng màu. Trùm ở mỗi chặng được xáo ngẫu nhiên nên nền chỉ gợi ý, không gắn cứng với trùm.

| Chặng | Tệp | Tên | Bối cảnh | Màu chủ đạo |
| --- | --- | --- | --- | --- |
| 1 | `stage1_p/l` | Cổng Làng Quang Tử | Cổng làng, gốc đa cổ thụ mọc dây cáp quang | Yên tĩnh, dạy chơi. Chàm + men ngọc |
| 2 | `stage2_p/l` | Chợ Đêm Hàng Mã | Chợ đêm gian hàng mã, đèn lồng LED | Ấm, đông. Đỏ son + vàng đồng |
| 3 | `stage3_p/l` | Bến Nước Optic | Bến đò, sóng nước là sợi quang nháy | Lạnh, nhấp nháy. Men ngọc + chàm |
| 4 | `stage4_p/l` | Đình Server | Đình làng là phòng máy chủ, cột gỗ là giá rack | Trang nghiêm. Đỏ son + đen |
| 5 | `stage5_p/l` | Rừng Mã Nguồn | Rừng tre mọc ra dòng code, ma trơi là ngọn đèn | Bí ẩn. Men ngọc + đen |
| 6 | `stage6_p/l` | Phố Cổ Chập Chờ | Phố cổ, biển hiệu lỗi, mái ngói chớp tắt | Hỗn loạn vui. Vàng đồng + chàm |
| 7 | `stage7_p/l` | Tháp Bút Lỗi | Tháp Bút bị "ghi" ngược, chữ chảy từ ngọn xuống | Trầm, nghiêm. Chàm + đỏ son |
| 8 | `stage8_p/l` | Đồng Khô Mất Điện | Cánh đồng nứt nẻ, cột điện đổ, trời đỏ; trùm cuối Hạn Bạt | Khốc liệt. Đỏ son + đen |

Gợi ý nếu muốn có chuyển động sau này: tách nền thành 3 lớp (trời, giữa, đất) cùng kích thước để làm cuộn thị sai. Chưa cần ở bản này.

## 4. Bốn mươi lăm icon bùa

- Thư mục: `assets/charms/`, tên `{id}.png`.
- **Kích thước gốc: 32 × 32 px**, nền trong suốt, **không vẽ khung**: khung theo độ hiếm (Thường, Hiếm, Quý, Thần) và nền ô do giao diện vẽ.
- Hình chiếm khoảng 24 × 24 px ở giữa. Giao diện hiển thị ở 44 đến 64 px nên phải đọc được ở cỡ nhỏ: **một hình lớn, rõ, ít chi tiết**.
- Icon tạm có nhãn số nhỏ ở góc dưới phải (+8, x2.5...) vẽ bằng phông 3×5 để tiện đọc hiệu ứng. Giữ hoặc bỏ tùy bạn; nhãn **không** thay cho mô tả chữ trong game.
- Màu hình theo lối chơi: Phu dọc = ngọc-sáng, Bộ giống = kem, Cùng họ = đỏ-sáng, Lá Yêu = vàng, Giữ bài = kem-chàm, Chung = vàng-sáng, Thần = vàng.
- Bùa Thần (3 cái) nên nổi bật hơn hẳn (có thể thêm viền sáng vàng trong chính hình).

| Tệp | Tên bùa | Độ hiếm | Lối chơi | Hiệu ứng (để bạn hình dung) |
| --- | --- | --- | --- | --- |
| `noi_lien.png` | Nối Liền | Thường | Phu dọc | Mỗi lá ghi điểm trong sảnh hoặc phu dọc: +8 chip |
| `tang_dan.png` | Tăng Dần | Thường | Phu dọc | Đánh sảnh hoặc phu dọc (từ 3 lá liên tiếp): +5 hệ số |
| `thong_suot.png` | Thông Suốt | Hiếm | Phu dọc | Đánh phu dọc (sảnh cùng một họ): +60 chip |
| `sanh_dai.png` | Sảnh Dài | Hiếm | Phu dọc | Sảnh hoặc phu dọc từ 4 lá trở lên: ×1.5 hệ số |
| `cong_don_sanh.png` | Cộng Dồn Sảnh | Hiếm | Phu dọc | Mỗi lá ghi điểm trong sảnh: bùa này +1 hệ số vĩnh viễn, và cộng vào điểm |
| `bi_ngu.png` | Bí Ngũ | Quý | Phu dọc | Sảnh hoặc phu dọc đủ 5 lá: ×2 hệ số |
| `co_doi.png` | Có Đôi Có Cặp | Thường | Bộ giống | Bộ có các lá cùng số (đôi, hai đôi, phu bí, Khàn, cù lũ, tứ quý, ngũ quý): +40 chip |
| `cung_so_khac_ho.png` | Cùng Số Khác Họ | Thường | Bộ giống | Phu bí, tứ quý hoặc ngũ quý lẫn họ: +10 hệ số |
| `cu_lu_no_ro.png` | Cù Lũ Nở Rộ | Hiếm | Bộ giống | Đánh cù lũ (cả hai bản): ×2 hệ số |
| `khan_manh.png` | Khàn Mạnh | Hiếm | Bộ giống | Đánh Khàn hoặc Thiên Khai (3 hoặc 4 lá giống hệt nhau): ×2.5 hệ số |
| `tu_quy_hoi_tu.png` | Tứ Quý Hội Tụ | Quý | Bộ giống | Đánh tứ quý, Thiên Khai hoặc ngũ quý: ×3 hệ số |
| `mot_ho.png` | Một Họ | Thường | Cùng họ | Bộ từ 3 lá ghi điểm và cùng một họ: +5 hệ số |
| `du_ba_ho.png` | Đủ Ba Họ | Thường | Cùng họ | Bộ từ 3 lá ghi điểm có đủ cả Văn, Sách, Vạn: +50 chip |
| `dong_tong.png` | Đồng Tông | Quý | Cùng họ | Bộ từ 4 lá ghi điểm và cùng một họ: ×2 hệ số |
| `ho_van.png` | Họ Văn Lên Ngôi | Thường | Cùng họ | Mỗi lá Văn ghi điểm: +3 hệ số |
| `ho_sach.png` | Họ Sách Lên Ngôi | Thường | Cùng họ | Mỗi lá Sách ghi điểm: +20 chip |
| `ho_wan.png` | Họ Vạn Lên Ngôi | Thường | Cùng họ | Mỗi lá Vạn ghi điểm: +10 chip và +2 hệ số |
| `doi_ho.png` | Đổi Họ | Hiếm | Cùng họ | Lá bị bỏ chuyển sang họ kế (Văn → Sách → Vạn → Văn), có dấu ấn vàng đến hết ải, rồi xáo lại vào bộ bài |
| `me_yeu.png` | Mê Yêu | Thường | Lá Yêu | Mỗi lá Yêu (Chi Chi, Thang Thang, Ông Lão) ghi điểm: +8 hệ số |
| `yeu_giu_nha.png` | Yêu Giữ Nhà | Thường | Lá Yêu | Mỗi lá Yêu còn trên tay: +5 hệ số |
| `yeu_di_dau.png` | Yêu Đi Đầu | Hiếm | Lá Yêu | Nếu lá ghi điểm bên trái nhất là lá Yêu: ×2 hệ số |
| `goi_them_yeu.png` | Gọi Thêm Yêu | Hiếm | Lá Yêu | Đầu mỗi ải thêm 1 lá Yêu tạm vào bộ bài |
| `tom_leo_mo_duong.png` | Tôm Lèo Mở Đường | Hiếm | Lá Yêu | Đánh Tôm hoặc Lèo: ×3 hệ số |
| `ba_yeu_hoi_tu.png` | Ba Yêu Hội Tụ | Hiếm | Lá Yêu | Đánh Tam Yêu (Chi Chi, Thang Thang, Ông Lão): ×4 hệ số |
| `yeu_nang_ky.png` | Yêu Nặng Ký | Quý | Lá Yêu | Lá Yêu ghi điểm được tính 25 chip |
| `ngoi_cho.png` | Ngồi Chờ | Thường | Giữ bài | Mỗi lá còn trên tay: +4 chip |
| `it_ma_chat.png` | Ít Mà Chất | Hiếm | Giữ bài | Đánh từ 3 lá trở xuống: ×2 hệ số |
| `giu_du_ba_ho.png` | Giữ Đủ Ba Họ | Quý | Giữ bài | Giữ trên tay đủ cả Văn, Sách, Vạn: ×2 hệ số |
| `tranh_chi.png` | Tranh Chi | Quý | Giữ bài | Lượt đánh cuối cùng của ải: ×2.5 hệ số |
| `so_nho.png` | Số Nhỏ | Thường | Chung | Mỗi lá Nhất, Nhị, Tam ghi điểm: +12 chip |
| `so_lon.png` | Số Lớn | Thường | Chung | Mỗi lá Thất, Bát, Cửu ghi điểm: +2 hệ số |
| `ngu_phuc.png` | Ngũ Phúc | Thường | Chung | Đánh đủ 5 lá và cả 5 đều ghi điểm: +8 hệ số |
| `doi_trong.png` | Dội Trống | Hiếm | Chung | Lá ghi điểm bên trái nhất được tính thêm 2 lần nữa |
| `kho_bai.png` | Kho Bài | Thường | Chung | +1 chip cho mỗi 5 lá còn trong bộ rút |
| `thang_hang_may.png` | Thăng Hạng May | Hiếm | Chung | Sau khi đánh: 1/4 cơ hội nâng bộ vừa đánh lên 1 cấp |
| `nhat_ve_chai.png` | Nhặt Ve Chai | Thường | Chung | Mỗi lá Tạp bị bỏ: +2 đồng |
| `heo_dat.png` | Heo Đất | Thường | Chung | Trần tiền lãi cuối ải tăng từ 5 lên 10 đồng |
| `bo_them.png` | Bỏ Thêm | Thường | Chung | +2 lượt bỏ bài mỗi ải |
| `len_hang.png` | Lên Hạng | Thường | Chung | Cuối ải: bộ được đánh nhiều nhất trong ải lên 1 cấp |
| `danh_them.png` | Đánh Thêm | Hiếm | Chung | +1 lượt đánh mỗi ải |
| `tay_dai.png` | Tay Dài | Hiếm | Chung | Tay bài thêm 1 lá (9 lá thay vì 8) |
| `phao_cuu_sinh.png` | Phao Cứu Sinh | Quý | Chung | Hết lượt mà đạt từ 70% mục tiêu: vẫn qua ải, bùa này tự mất |
| `nhat_thong.png` | Nhất Thống | Thần | Thần | Mọi bộ đánh ra được tính như bộ cùng họ trong bảng điểm bộ (không tính cho điều kiện "cùng họ" của bùa khác) |
| `ban_sao.png` | Bản Sao | Thần | Thần | Sao chép hiệu ứng của bùa bên phải (không chép bùa nhân ×, không chép bùa Thần) |
| `them_cho_ngoi.png` | Thêm Chỗ Ngồi | Thần | Thần | Mỗi lần hạ một ải trùm: +1 ô bùa (tối đa 6 ô) |

## 4b. Icon vật phẩm khác: Ấn, Triện, Phù, Quẻ, Thẻ bỏ qua, Gói

Mọi loại dưới đây dùng **một quy cách chung**, giống icon bùa:

- **Kích thước gốc: 32 × 32 px (tỷ lệ 1 : 1)**, nền trong suốt, **không vẽ khung, không vẽ chữ**. Hình chiếm khoảng 24 × 24 px ở giữa, một hình lớn, rõ, ít chi tiết, đọc được ở cỡ 44 đến 64 px.
- Giao diện đặt icon vào ô **3 : 4** (Ấn, Quẻ, Phù, Thẻ, Gói) hoặc **4 : 5** (Bùa), vẽ khung, màu nền, tên và mô tả. Vì vậy phần dưới ô luôn dành cho chữ, đừng vẽ hình tràn xuống đáy.
- Viền ngoài 1 px màu Đen `#191b1f`, tô 3 đến 4 tông theo bảng màu ở mục 1. Ánh sáng từ trên-trái.
- Nhóm màu gợi ý để nhìn là phân biệt ngay: Ấn = đỏ son, Phù = vàng đồng, Quẻ = chàm, Thẻ bỏ qua = kem, Gói = theo loại (Bùa vàng, Quẻ chàm, Quân men ngọc).

Thư mục và tên tệp (đặt đúng tên, ghi đè ảnh tạm):

| Loại | Thư mục | Số ảnh | Tên tệp |
| --- | --- | --- | --- |
| Ấn | `assets/an/` | 12 | theo cột Tệp bảng 1 |
| Phù | `assets/phu/` | 7 | theo cột Tệp bảng 2 |
| Thẻ bỏ qua | `assets/skip/` | 7 | theo cột Tệp bảng 3 |
| Gói | `assets/pack/` | 3 | `bua.png`, `que.png`, `quan.png` |
| Quẻ | `assets/que.png` | 1 | biểu tượng chung cho mọi thẻ Quẻ |

**Bảng 1. Ấn (12)** gồm 9 Ấn và 3 Triện (Triện cũng là một Ấn, đóng lên lá bài).

| Tệp | Tên | Hiệu ứng |
| --- | --- | --- |
| `nhan_ban.png` | Ấn Nhân Bản | Thêm một bản sao một lá vào bộ bài |
| `tru_ta.png` | Ấn Trừ Tà | Xoá tối đa 2 lá khỏi bộ bài |
| `dao_sac.png` | Ấn Đảo Họ | Đổi họ tối đa 2 lá sang họ kế |
| `ngoc.png` | Ấn Ngọc | Lá Ngọc: +30 chip |
| `kim.png` | Ấn Kim | Lá Kim: +4 hệ số |
| `son.png` | Ấn Son | Lá Son: ×1,5 hệ số |
| `thep.png` | Ấn Thép | Lá Thép: giữ trên tay thì ×1,5 hệ số |
| `linh.png` | Ấn Linh | Lá Linh: tính là cả ba họ |
| `luu_ly.png` | Ấn Lưu Ly | Lá Lưu Ly: ×2 hệ số, có thể vỡ |
| `trien_do.png` | Triện Đỏ | Lá được tính thêm 1 lần |
| `trien_vang.png` | Triện Vàng | +3 đồng mỗi lần lá ghi điểm |
| `trien_lam.png` | Triện Lam | Còn trên tay khi hạ ải thì nâng 1 cấp một bộ |

Nên vẽ thêm một **dấu ấn nhỏ** (Ngọc, Kim, Son, Thép, Linh, Lưu Ly, Triện Đỏ, Vàng, Lam) kích thước 12 × 12 px, tên `assets/an/mark_{id}.png`, để đóng lên góc lá bài đã phù phép. Hiện giao diện chưa dùng, có thể làm sau.

**Bảng 2. Phù (7)**, nâng cấp vĩnh viễn.

| Tệp | Tên | Hiệu ứng |
| --- | --- | --- |
| `them_luot.png` | Phù Thêm Lượt | +1 lượt đánh mỗi ải |
| `them_bo.png` | Phù Thêm Bỏ | +1 lượt bỏ bài mỗi ải |
| `cho_rong.png` | Phù Chợ Rộng | Chợ bán thêm 1 bùa |
| `lai_day.png` | Phù Lãi Dày | Trần tiền lãi +5 đồng |
| `gia_re.png` | Phù Giảm Giá | Chợ rẻ hơn 25% |
| `cho_que.png` | Phù Chợ Quẻ | Chợ bán thêm 1 Quẻ |
| `o_bua.png` | Phù Thêm Ô Bùa | +1 ô bùa |

**Bảng 3. Thẻ bỏ qua (7)**, nhận khi bỏ qua một ải.

| Tệp | Tên | Hiệu ứng |
| --- | --- | --- |
| `que.png` | Thẻ Quẻ | Chọn 1 trong 2 Quẻ miễn phí |
| `tien.png` | Thẻ Tiền | Nhận ngay 6 đồng |
| `bua.png` | Thẻ Bùa | 1 bùa Hiếm miễn phí |
| `goi.png` | Thẻ Gói | Mở ngay 1 Gói Bùa |
| `dautu.png` | Thẻ Đầu Tư | +12 đồng sau khi hạ trùm kế tiếp |
| `nhanh.png` | Thẻ Tốc Hành | +2 đồng cho mỗi ải đã bỏ qua |
| `cap.png` | Thẻ Thăng Cấp | Nâng 2 cấp một bộ ngẫu nhiên |

**Gói (3)**: `bua.png` (Gói Bùa, chọn 1 trong 3 bùa), `que.png` (Gói Quẻ), `quan.png` (Gói Quân, chọn quân bài). **Quẻ (1)**: `assets/que.png`, hình quẻ bát quái hoặc ba vạch gãy, dùng chung cho mọi thẻ Quẻ (tên bộ do giao diện ghi).

Ghi chú: các tệp này **chưa có ảnh tạm** và giao diện chưa đọc chúng. Khi bạn làm xong, mình nối vào mã (thay biểu tượng SVG hiện tại) và đổi nền ô theo ảnh.

## 5. Còn thiếu (chưa nằm trong đợt này, nên làm tiếp)

Giao diện đang dùng hình vẽ vectơ hoặc ô màu tạm cho những món sau. Khi bạn sẵn sàng, mình sẽ ghi thông số tương tự mục 2 đến 4:

- Phỗng (linh vật), Bà Hàng Mã, Ông Đồ Lỗi, 12 trùm và Hạn Bạt (chân dung hoặc sprite).
- Logo PHỖNG.EXE và biểu tượng ứng dụng (đầu Phỗng nhìn nghiêng, hai mắt LED). Logo hiện là chữ phông Pixelify Sans.
- Lưng lá bài (cọc rút), (icon 12 Ấn, 7 Phù, 7 Thẻ bỏ qua, 3 Gói, Quẻ đã có thông số ở mục 4b), biểu tượng ba họ (hiện là SVG đơn giản).
- Âm thanh và nhạc (GDD mục 13).

## 6. Cách thay ảnh và kiểm tra

1. Chép ảnh của bạn đè lên tệp cùng tên trong `assets/`.
2. `node build-demo.js` rồi mở `dist/index.html` (hoặc `node tools/serve.js` rồi vào http://localhost:5173/dist/index.html).
3. Thử màn dọc và ngang: thêm `?layout=port` hoặc `?layout=land` vào địa chỉ để ép hướng.
4. Xem toàn bộ ảnh một lượt ở `assets/_preview.html` (qua máy chủ ở bước 2).
5. Muốn sinh lại ảnh tạm: `node tools/gen-assets.js` (ghi đè ảnh của bạn nếu cùng tên, nên sao lưu trước).

> Ghi chú tỉ lệ: lá bài trong game là chữ nhật đứng **1 : 2,4** (đổi bằng biến CSS --ratio trong web/skin.css); bài Tổ tôm thật còn dài hơn (khoảng 1 : 3), nếu muốn sát hơn thì tăng --ratio và vùng ảnh cao thêm.
