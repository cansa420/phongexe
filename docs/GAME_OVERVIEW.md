# PHỖNG.EXE — Bản mô tả game

**Thể loại:** roguelike xếp bài chấm điểm (kiểu Balatro), chơi một người
**Nền tảng:** trình duyệt web, tối ưu cho điện thoại (dọc và ngang), có thể thêm ra màn hình chính như một ứng dụng
**Ngôn ngữ:** tiếng Việt
**Chơi thử:** https://cansa420.github.io
**Phong cách:** pixel art, bối cảnh làng Việt pha cyberpunk

---

## 1. Giới thiệu ngắn

PHỖNG.EXE là game xếp bài roguelike dựng trên **bộ bài Tổ tôm 120 lá** của Việt Nam. Người chơi ghép các lá bài thành "bộ" (đôi, sảnh, cù lũ, tứ quý…), mỗi bộ cho một lượng **chip** nhân với một **hệ số**. Mục tiêu là đạt đủ điểm cho từng ải, qua tám chặng và hạ trùm cuối. Giữa các ải, người chơi vào **Chợ** mua bùa, nâng cấp bộ bài và xây dựng lối chơi riêng. Mỗi ván là một lần chơi hoàn toàn khác nhau.

Câu chuyện nền: đợt sập nguồn nén ký ức cả dân làng vào 120 lá bài Tổ tôm (gọi là "hồn làng"). Server của đình làng nhiễm virus "Nhà Cái" và bắt hồn làng làm con tin, muốn chuộc thì phải đánh bài thắng nó. Nhân vật dẫn truyện là **Phỗng**, bức tượng đá canh đình làng, chọn người chơi để cùng đập 12 con bug và trùm cuối **Hạn Bạt**.

Game lấy cảm hứng cấu trúc từ Balatro nhưng đặt trên chất liệu văn hóa Việt: bộ bài Tổ tôm với ba họ Văn, Sách, Vạn, các lá Yêu mang tên riêng (Chi Chi, Thang Thang, Ông Lão), các bộ cổ như Tôm, Lèo, Tam Yêu, cùng hệ thống bùa, ấn, quẻ lấy từ tín ngưỡng và đời sống làng quê.

---

## 2. Bộ bài Tổ tôm

- **120 lá** gồm 3 họ (**Văn, Sách, Vạn**) × 10 số × 4 bản.
- Số 1 đến 9 gọi là Nhất, Nhị, Tam, Tứ, Ngũ, Lục, Thất, Bát, Cửu. Chip bằng đúng số trên lá.
- **Số 10 là lá Yêu**, có tên riêng theo họ: Chi Chi (Văn), Thang Thang (Sách), Ông Lão (Vạn). Lá Yêu cho 12 chip.
- Ở các độ khó cao có thêm **lá Tạp** (0 chip, không ghép được bộ nào) trộn vào tay bài để gây rối.

---

## 3. Cách chơi một ải

1. Mỗi ải bắt đầu với **tay 8 lá**, có **4 lượt đánh** và **3 lượt bỏ bài**.
2. Mỗi lượt, người chơi chọn **tối đa 5 lá** để đánh. Game tự nhận ra bộ cao nhất trong số lá đã chọn và tính điểm.
3. **Điểm của lượt = tổng chip × hệ số.** Chip lấy từ bộ và từ các lá ghi điểm; hệ số lấy từ bộ, bùa và các hiệu ứng khác.
4. Đạt **điểm mục tiêu** trước khi hết lượt đánh thì qua ải. Hết lượt mà chưa đủ điểm thì thua ván.
5. Lượt đánh dư được đổi thành tiền thưởng. Tiền còn nhiều cũng được thêm lãi (tối đa 5 đồng mỗi ải).
6. Tay bài có thể **xếp theo số** hoặc **xếp theo họ** chỉ bằng một nút, kèm hoạt ảnh các lá bay về chỗ mới.

### Cấu trúc ván

- **8 chặng**, mỗi chặng có **3 ải**: Ải Thường, Ải Lớn và **Ải Trùm**.
- Ải Thường và Ải Lớn có thể **bỏ qua** để nhận thẻ thưởng (Quẻ, Tiền, Bùa, Gói bùa, Đầu tư, Tốc hành, Thăng cấp).
- Mục tiêu điểm tăng dần theo chặng, từ vài trăm điểm ở chặng đầu lên hơn 19.000 điểm ở chặng cuối.
- Hạ trùm cuối chặng thì mở **Chợ** và có thể gặp **Thần**, nhân vật ban các lựa chọn đặc biệt.
- Ải cuối cùng là trùm **Hạn Bạt**.

---

## 4. Bảng bộ (15 bộ)

Mỗi bộ có chip và hệ số cơ bản, và có thể **lên cấp** bằng lá Quẻ để mạnh hơn trong cả ván.

| Bộ | Điều kiện | Chip × hệ số (cấp 1) |
|---|---|---|
| Ngũ quý | 5 lá cùng số | 120 × 9 |
| Phu dọc 5 | 5 lá liên tiếp cùng họ (Yêu là số 10) | 110 × 9 |
| Tôm | Thất Văn, Tam Sách, Tam Vạn | 90 × 8 |
| Lèo | Bát Sách, Cửu Vạn, Chi Chi | 90 × 8 |
| Tam Yêu | Chi Chi, Thang Thang, Ông Lão | 80 × 8 |
| Tứ quý | 4 lá cùng số | 60 × 7 |
| Phu dọc 4 | 4 lá liên tiếp cùng họ | 65 × 6 |
| Cù lũ | Bộ ba và một đôi | 40 × 4 |
| Sảnh | 5 lá liên tiếp, họ nào cũng được | 30 × 4 |
| Thuần họ | 5 lá cùng họ, không liên tiếp | 35 × 4 |
| Phu dọc 3 | 3 lá liên tiếp cùng họ | 40 × 4 |
| Phu bí | 3 lá cùng số | 30 × 3 |
| Hai đôi | Hai đôi khác số | 20 × 2 |
| Đôi | 2 lá cùng số | 10 × 2 |
| Lá lẻ | 1 lá | 5 × 1 |

Ba bộ **Tôm, Lèo, Tam Yêu** là các bộ cổ của Tổ tôm, những tổ hợp lá cụ thể chứ không chỉ là quy luật số học, nên có sức mạnh ngang Ngũ quý và là điểm nhấn riêng của game.

---

## 5. Hệ thống xây dựng lối chơi

### Bùa (66 bùa)
Bùa là vật phẩm cố định gắn vào ô bùa (khởi đầu 5 ô, tối đa 7), cho chip, hệ số hay hiệu ứng đặc biệt mỗi lượt đánh. Chia theo độ hiếm: **Thường, Hiếm, Quý** (và nhóm Thần chỉ gặp ở sự kiện đặc biệt). Chia theo lối chơi gồm sảnh, bộ cùng số, cùng họ, lá Yêu, giữ bài trên tay, kinh tế, tích lũy, đánh đổi và đánh lặp lại. Bùa có thể mang **men** hiếm như Men ngọc, Men vàng, Sơn mài hay Men rạn (thêm một ô bùa).

### Ấn (12 loại)
Ấn dùng để chỉnh sửa chính bộ bài: nhân bản lá, xóa lá yếu, đổi họ, hoặc biến lá thường thành lá đặc biệt: **Ngọc** (+30 chip), **Kim** (+4 hệ số), **Son** (×1,5 hệ số), **Thép** (giữ trên tay thì ×1,5 hệ số), **Linh** (tính là cả ba họ), **Lưu Ly** (×2 hệ số nhưng có thể vỡ). Ngoài ra còn ba **Triện** (đỏ, vàng, lam) đóng lên lá để lặp điểm, sinh tiền hoặc nâng cấp bộ.

### Tiêu hao (30 vật phẩm)
Phù, Quẻ và các vật phẩm dùng một lần, mua ở Chợ hoặc nhận từ gói. Phù áp hiệu ứng lên quân bài trên tay; Quẻ nâng cấp bộ. Vật phẩm cất trong ô Tiêu hao và dùng ngay trong ván.

### Chợ
Giữa các ải người chơi mua bùa, ấn, tiêu hao, gói bùa và mở rộng ô; có thể làm mới hàng bằng tiền. Có các Phù nâng cấp vĩnh viễn như thêm lượt đánh, thêm lượt bỏ, giảm giá 25% hay thêm ô bùa.

---

## 6. Trùm và thử thách

Mỗi chặng kết thúc bằng một trùm, mỗi trùm là một "con bug" mang tên quái vật dân gian Việt Nam và một luật phá ván riêng. Có **12 trùm** thường và trùm cuối:

- **Chằn Tinh:** Đôi và Hai đôi bị phạt.
- **Thủy Tinh:** không có lượt bỏ bài.
- **Cáo Chín Đuôi:** Phu bí, Cù lũ, Tứ quý, Ngũ quý bị phạt.
- **Thủy Quái Đứt Dây:** mọi sảnh và phu dọc bị phạt.
- **Quỷ Một Mắt:** bớt một lượt đánh.
- **Ma Da:** tay bài bớt 2 quân.
- **Giặc Cửu Yêu:** lá Cửu và Yêu không cho chip.
- **Quỷ Móc:** mỗi lần đánh, 2 quân trên tay bị móc mất.
- **Quỷ Thu Thuế:** mất tiền cho mỗi quân đánh ra.
- **Ma Trơi:** mỗi lượt một bùa bị vô hiệu.
- **Tay Gãy:** bộ đánh ra bị hạ một cấp.
- **Quỷ Nhuộm:** một họ bị vô hiệu cả ải.
- **Hạn Bạt (trùm cuối):** tay bớt 1 quân và bớt 2 lượt bỏ.

Người chơi phải thay đổi chiến thuật tùy từng trùm, ví dụ chuyển sang bộ không bị phạt hay chuẩn bị bùa phù hợp.

---

## 7. Bộ bài khởi đầu và độ khó

**8 bộ bài khởi đầu**, mỗi bộ đổi cách chơi:
Bộ Chuẩn, Bộ Văn Đỏ (thêm lượt bỏ), Bộ Sách Lục (thêm lượt đánh), Bộ Vàng (thêm tiền khởi đầu), Bộ Đen (thêm ô bùa), Bộ Số Cao (bỏ lá 1, 2, 3, chip cao nhưng khó ra sảnh), Bộ Thuần Văn (mọi lá đều họ Văn), Bộ Hỗn Loạn (số và họ ngẫu nhiên).

**4 độ khó:** Dễ, Thường, Khó, Ác mộng. Độ khó đổi mục tiêu điểm (×0.85 đến ×1.5), số lượt bỏ bài, tiền khởi đầu và số lá Tạp.

Độ khó và bộ bài mở khóa dần theo tiến trình chơi.

---

## 8. Tiến trình và thành tích

- **23 thành tích** chia theo nhóm bộ bài, điểm số và thử thách (ví dụ đánh Ngũ quý lần đầu, ghi 10.000 điểm trong một lượt, thắng ải mà không bỏ bài).
- Lưu **điểm kỷ lục**, thống kê bộ đã đánh, ván đang chơi (thoát ra vẫn tiếp tục được).
- Có **hướng dẫn trong ván** 7 bước và phần mở đầu câu chuyện, xem lại được trong Cài đặt.

---

## 9. Hình ảnh, âm thanh và trải nghiệm

- **Pixel art** thống nhất, gồm các lá bài nhân vật mang phong cách làng Việt cyberpunk, 8 bối cảnh ải, hàng chục icon bùa, logo và icon ứng dụng.
- **Màn hình tải** dựng từ tranh nền gian nhà gỗ đỏ có dàn màn hình CRT, tách thành nhiều lớp chuyển động (mạch sáng, màn hình nhấp nháy, đèn LED, đèn lồng, tàn lửa) cùng bộ bài lật mặt.
- **Hoạt ảnh** cho mọi tương tác: bài bay khi xếp, điểm chạy khi tính, hiệu ứng nút bấm kiểu lò xo, cửa sổ thông báo trượt vào.
- **Âm thanh:** nhạc nền và hiệu ứng chọn bài, ghi điểm, mua bán, qua ải. Âm lượng chỉnh riêng nhạc và hiệu ứng.
- **Bố cục tự thích ứng** màn dọc và ngang, có thể ép dọc hoặc ngang trong Cài đặt, hỗ trợ giảm chuyển động.
- Chạy ngay trên trình duyệt, không cần cài đặt; có thể thêm vào màn hình chính điện thoại.

---

## 10. Điểm nổi bật để viết bài

1. **Văn hóa Việt trong khung roguelike hiện đại:** bài Tổ tôm, các bộ cổ Tôm, Lèo, Tam Yêu, quái vật dân gian làm trùm, tượng Phỗng canh đình làng làm người dẫn truyện, đặt trong thế giới cyberpunk "server đình làng bị virus".
2. **Lối chơi sâu từ luật dễ hiểu:** chọn lá, ra bộ, tính điểm; chiều sâu đến từ hàng chục bùa, ấn và quẻ kết hợp với nhau.
3. **Mỗi ván khác nhau:** chợ ngẫu nhiên, 8 bộ bài khởi đầu, 4 độ khó, 12 trùm với luật riêng.
4. **Chơi ngay không cần cài:** mở bằng trình duyệt điện thoại, giao diện tiếng Việt, có hướng dẫn trong ván.
5. **Hoàn thiện về hình ảnh và cảm giác chơi:** pixel art thống nhất, hoạt ảnh và âm thanh phản hồi cho từng thao tác.

---

*Số liệu trong bản này lấy trực tiếp từ dữ liệu game (bảng bộ, bùa, ấn, trùm, độ khó, thành tích). Chỉ số cân bằng có thể còn được tinh chỉnh.*
