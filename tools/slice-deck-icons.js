// Cắt 3 icon bộ bài (đỏ, lục, chàm) từ assets/icons/_decks_sheet.png thành 128 x 128: bo_van, bo_sach, bo_thuan
const { readPNG } = require('./png-read.js');
const { writePNG } = require('./rgba2png.js');
const NAMES = ['bo_van', 'bo_sach', 'bo_thuan'];
const S = 128;
const im = readPNG('assets/icons/_decks_sheet.png');
const A = (x, y) => im.px[(y * im.w + x) * 4 + 3];
const bands = (len, has, gap) => { const out = []; let s = -1, last = -1; for (let i = 0; i < len; i++) if (has(i)) { if (s < 0) s = i; else if (i - last > gap) { out.push([s, last]); s = i; } last = i; } if (s >= 0) out.push([s, last]); return out; };
const cols = bands(im.w, (x) => { for (let y = 0; y < im.h; y++) if (A(x, y) > 200) return true; return false; }, 8);
if (cols.length !== 3) throw new Error('tìm được ' + cols.length + ' icon, cần 3');
cols.forEach(([x0, x1], i) => {
  const rows = bands(im.h, (y) => { for (let x = x0; x <= x1; x++) if (A(x, y) > 200) return true; return false; }, 8);
  const y0 = rows[0][0], y1 = rows[rows.length - 1][1];
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = Math.max(w, h) / (S - 8), ow = Math.round(w / k), oh = Math.round(h / k);
  const out = Buffer.alloc(S * S * 4), ox = (S - ow) >> 1, oy = (S - oh) >> 1;
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const xa = Math.floor(x0 + x * k), xb = Math.max(xa + 1, Math.floor(x0 + (x + 1) * k)), ya = Math.floor(y0 + y * k), yb = Math.max(ya + 1, Math.floor(y0 + (y + 1) * k));
    let a = 0, n = 0, r = 0, g = 0, b = 0, m = 0;
    for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) { const o = (yy * im.w + xx) * 4; n++; a += im.px[o + 3]; if (im.px[o + 3] > 127) { r += im.px[o]; g += im.px[o + 1]; b += im.px[o + 2]; m++; } }
    if (!m) continue;
    const o = ((oy + y) * S + ox + x) * 4; out[o] = r / m; out[o + 1] = g / m; out[o + 2] = b / m; out[o + 3] = Math.min(255, Math.round((a / n) * 1.2));
  }
  writePNG(`assets/icons/${NAMES[i]}.png`, S, S, out);
});
console.log('đã ghi', NAMES.join(', '));
