// Cắt bảng icon (assets/icons/_sheet.png, nền trong suốt) thành từng icon vuông 128 x 128.
// Dùng: node tools/slice-icons.js
const fs = require('fs');
const { readPNG } = require('./png-read.js');
const { writePNG } = require('./rgba2png.js');

const NAMES = ['dong_xu', 'thoi_vang', 'tui_loc', 'hop_qua', 'cuon_giay', 'the_bai', 'quat', 'ho_lo', 'lu_huong', 'chuong', 'may', 'hoa_mai',
  'sen', 'den_long', 'nut_that', 'bao_do', 'am_duong', 'sen_xanh', 'mo', 'trong_boi', 'dong_ho_cat', 'lam_moi'];
const OUT = 'assets/icons', S = 128;
const im = readPNG(OUT + '/_sheet.png');
const A = (x, y) => im.px[(y * im.w + x) * 4 + 3];

function bands(len, has, gap) { // các đoạn liên tục có điểm ảnh, gộp nếu cách nhau dưới gap
  const out = []; let s = -1, last = -1;
  for (let i = 0; i < len; i++) if (has(i)) { if (s < 0) s = i; else if (i - last > gap) { out.push([s, last]); s = i; } last = i; }
  if (s >= 0) out.push([s, last]);
  return out;
}
const rows = bands(im.h, (y) => { for (let x = 0; x < im.w; x++) if (A(x, y) > 200) return true; return false; }, 8);
const boxes = [];
for (const [y0, y1] of rows) {
  const cols = bands(im.w, (x) => { for (let y = y0; y <= y1; y++) if (A(x, y) > 200) return true; return false; }, 8);
  for (const [x0, x1] of cols) boxes.push([x0, y0, x1, y1]);
}
console.log('hàng', rows.length, 'icon', boxes.length);
if (boxes.length !== NAMES.length) throw new Error('số icon tìm được ' + boxes.length + ' khác ' + NAMES.length);

boxes.forEach(([x0, y0, x1, y1], i) => {
  // thu nhỏ vừa ô S x S (chừa lề 4 px), căn giữa; lấy mẫu trung bình trong ô nguồn (chỉ điểm không trong suốt)
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = Math.max(w, h) / (S - 8), ow = Math.round(w / k), oh = Math.round(h / k);
  const out = Buffer.alloc(S * S * 4), ox = (S - ow) >> 1, oy = (S - oh) >> 1;
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    const xa = Math.floor(x0 + x * k), xb = Math.max(xa + 1, Math.floor(x0 + (x + 1) * k)), ya = Math.floor(y0 + y * k), yb = Math.max(ya + 1, Math.floor(y0 + (y + 1) * k));
    for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) { const o = (yy * im.w + xx) * 4; n++; a += im.px[o + 3]; if (im.px[o + 3] > 0) { r += im.px[o]; g += im.px[o + 1]; b += im.px[o + 2]; } }
    const solid = []; for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) if (im.px[(yy * im.w + xx) * 4 + 3] > 127) solid.push((yy * im.w + xx) * 4);
    if (!solid.length) continue;
    let rr = 0, gg = 0, bb = 0; for (const o of solid) { rr += im.px[o]; gg += im.px[o + 1]; bb += im.px[o + 2]; }
    const o = ((oy + y) * S + ox + x) * 4; out[o] = rr / solid.length; out[o + 1] = gg / solid.length; out[o + 2] = bb / solid.length; out[o + 3] = Math.min(255, Math.round((a / n) * 1.2));
  }
  writePNG(`${OUT}/${NAMES[i]}.png`, S, S, out);
});
console.log('xong:', NAMES.length, 'icon trong', OUT);

