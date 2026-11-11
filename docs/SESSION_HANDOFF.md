# Bàn giao phiên làm việc: PHỖNG.EXE

## Chạy dự án
```
node build-demo.js        # gộp engine + web/ui.js + web/skin.css vào dist/index.html, chép assets/
node tools/serve.js       # http://localhost:5173/dist/index.html  (thêm ?dev để bật bảng Dev, ?layout=land|port để ép hướng)
node test/engine.test.js  # 55 test luật, phải đạt
```
Sửa xong luôn chạy `node build-demo.js` rồi tải lại trang (Ctrl+Shift+R).

## Cấu trúc
- `src/`: engine và dữ liệu luật (`src/data/*.json`), nguồn chuẩn, không sửa số liệu trong mã giao diện. Có `Run.snapshot()` / `Run.restore()` cho lưu ván.
- `web/ui.js`: toàn bộ giao diện, hoạt ảnh, cài đặt, lưu ván, mở đầu, hướng dẫn, chế độ Dev. `web/skin.css`: giao diện, **các lớp ghi đè nằm cuối file, lớp sau thắng lớp trước**; thêm sửa mới bằng cách nối cuối file. `web/index.template.html`: khung trang và CSS gốc.
- `assets/`: `cards/` (30 nhân vật 73×158), `charms/` (45 bùa), `an/ phu/ skip/` (icon 105×105), `icons/` (icon trang trí 128×128), `bg/`, `brand/` (logo, icon app), `frames/` (khung lá bài gốc `van/sach/wan/back.png` và `frames/ui/` khung HUD, nút).
- `tools/`: `restore-frames.js` (cắt khung lá từ `assets/frames/_source.png`), `gen-ui-frames.js` (khung panel/nút), `slice-icons.js`, `webp-to-png.ps1`, `serve.js`.
- `docs/ART_SPEC.md` (quy cách ảnh), `docs/CARD_LIST.md`, `docs/HANDOFF.md` (luật V3).
- Ảnh gốc của người dùng: `PHONG_EXE_Assets/` (nhân vật, bùa, ấn phù thẻ).

## Quy ước và lưu ý
- Viết tệp UTF-8 **không BOM** (PowerShell `Set-Content -Encoding UTF8` thêm BOM, dùng Node hoặc `[IO.File]::WriteAllText` với `UTF8Encoding($false)`).
- Hai bố cục: `html[data-layout="port"]` (dọc, không cuộn) và `"land"` (ngang, cột trái cố định chiều cao, tự co bằng `zoom` trong `fit()`). Kiểm tra cả hai, thử ở 400×850 và 1180×700.
- Dữ liệu lưu trong localStorage tiền tố `phongexe.` (`save`, `settings`, `progress`, `storySeen`, `tutDone`). Xóa dữ liệu ở Cài đặt, hoặc `localStorage.clear()`.
- Mở khóa: bắt đầu chỉ Bộ Chuẩn + Dễ; thắng độ khó mới nhất mở độ khó kế, thắng Ác mộng mở bộ kế. Bảng Dev (Ctrl+Shift+D) mở khóa tất cả.
- Gỡ lỗi nhanh: `window.__tc` có `run`, `ui`, `render`, `settings`, `progress`, `fanfare`, `blindBanner`.
- Đừng bật/tắt `animation` của lá bài trong lúc đo bố cục (làm hiệu ứng chia bài chạy lại); `fit()` đo bằng `offsetTop` của `.meta`.
- Nhân vật trên lá bài đang có hiệu ứng "thở" nhẹ (`breathe`), có thể tắt trong Cài đặt: Giảm chuyển động.

## Việc còn dở / chưa kiểm tra
- Chưa xem lại bằng mắt: lá mới rút sau khi đánh (màn dọc), nhãn chữ của 4 ô thống kê màn ngang ở màn hẹp, chợ và popup Gói với khung mới, màn dọc rất thấp (<700 px).
- Chưa có: ảnh Gói (Bùa, Quẻ, Quân), icon Quẻ, dấu ấn 12×12 trên lá phù phép, icon riêng cho lá Yêu, tiếng/nhạc thật (hiện sinh bằng WebAudio), Sổ Hồn, lời thoại Phỗng.
- `docs/ART_SPEC.md` còn ghi kích thước cũ (nhân vật 48×88/64×138, bùa 32×32): thực tế nhân vật 73×158, icon 105×105.
- Dự án đang nằm trong thư mục tạm của phiên: cần chuyển sang thư mục cố định trước khi đóng phiên.
