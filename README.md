# PHỖNG.EXE

Roguelike xếp bài chấm điểm trên bộ bài Tổ tôm 120 lá. Dựng lại từ `docs/PHONGEXE_Master_GDD.docx`, giữ nguyên lõi luật của V3 (`src/`, 53 test) và làm mới toàn bộ giao diện.

## Chạy thử

```bash
node build-demo.js          # gộp engine + giao diện + assets vào dist/
node tools/serve.js         # rồi mở http://localhost:5173/dist/
node test/engine.test.js    # 53 test luật
```

Thêm `?layout=port` hoặc `?layout=land` vào địa chỉ để ép hướng dọc 9:16 hoặc ngang 16:9. Mặc định tự chọn theo tỉ lệ cửa sổ (rộng/cao ≥ 1,2 là ngang).

## Cấu trúc

- `src/`, `sim/`, `test/`: engine và dữ liệu JSON của V3, **nguồn chuẩn của luật** (không sửa tay số liệu trong mã).
- `web/skin.css`: lớp giao diện pixel và hai bố cục. `web/ui.js`: màn hình, hoạt ảnh, âm thanh (gốc V3, đã đổi hình vẽ sang ảnh pixel). `web/index.template.html`: khung trang.
- `assets/`: ảnh tạm (30 lá bài, 16 nền, 45 icon bùa). **Thông số để làm ảnh thật nằm ở `docs/ART_SPEC.md`.**
- `tools/gen-assets.js`: sinh lại ảnh tạm. `tools/serve.js`: máy chủ tĩnh.

## Ghi chú

- Phông chữ nạp từ Google Fonts (Be Vietnam Pro, Pixelify Sans, VT323); cần mạng lần đầu. Chữ có dấu tiếng Việt phải kiểm lại khi đổi phông.
- Tạo hình nhân vật (Phỗng, Bà Hàng Mã, Ông Đồ Lỗi, trùm), logo, âm thanh: do bạn làm, xem mục 5 của `docs/ART_SPEC.md`.
