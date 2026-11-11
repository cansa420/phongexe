// Dùng đúng ảnh 4 lá của bạn (assets/frames/_source.png), cắt ở độ phân giải gốc, chỉ bỏ nền đen ngoài lá -> assets/frames/{van,sach,wan,back}.png
// Không thu nhỏ, không xử lý màu: giữ nguyên viền, khung tranh và dải màu như thiết kế gốc.
const fs = require('fs');
const { readPNG } = require('./png-read.js');
const { writePNG } = require('./rgba2png.js');

const im = readPNG('assets/frames/_source.png');
const NAMES = ['van', 'sach', 'wan', 'back'];
const isBg = (x, y) => { const o = (y * im.w + x) * 4; return im.px[o] < 12 && im.px[o + 1] < 12 && im.px[o + 2] < 12; };
const cols = []; for (let x = 0; x < im.w; x++) { let n = 0; for (let y = 0; y < im.h; y++) if (!isBg(x, y)) n++; cols.push(n); }
const runs = []; let s = -1; cols.forEach((n, x) => { if (n > 0 && s < 0) s = x; if (n === 0 && s >= 0) { runs.push([s, x - 1]); s = -1; } });
if (runs.length !== 4) throw new Error('không tìm đủ 4 lá');
let top = im.h, bot = 0; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (!isBg(x, y)) { top = Math.min(top, y); bot = Math.max(bot, y); }
const CW = Math.max(...runs.map((r) => r[1] - r[0] + 1)), CH = bot - top + 1;


// Bỏ nét đen ở độ phân giải gốc: viền đen ngoài -> trong suốt; vạch đen bên trong -> lấy màu phía trong lá. Màu xanh chàm của dải Vạn không bị coi là đen.
function stripBlack(buf, W, H, inner) {
  const idx = (x, y) => (y * W + x) * 4;
  const black = (i) => { if (buf[i + 3] === 0) return false; const mx = Math.max(buf[i], buf[i + 1], buf[i + 2]), mn = Math.min(buf[i], buf[i + 1], buf[i + 2]); return mx < 52 && mx - mn < 24; };
  const seen = new Uint8Array(W * H); const q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (buf[idx(x, y) + 3] === 0) { seen[y * W + x] = 1; q.push([x, y]); }
  while (q.length) {
    const [x, y] = q.pop();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      const i = idx(nx, ny); if (black(i)) { seen[ny * W + nx] = 1; buf[i + 3] = 0; q.push([nx, ny]); }
    }
  }
  // bóc các điểm tối còn sót sát rìa (răng cưa của viền đen)
  for (let pass = 0; pass < 4; pass++) {
    const kill = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y); if (buf[i + 3] === 0) continue;
      if ((buf[i] * 299 + buf[i + 1] * 587 + buf[i + 2] * 114) / 1000 > 88) continue;
      let edge = false; for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || buf[idx(nx, ny) + 3] === 0) { edge = true; break; } }
      if (edge) kill.push(i);
    }
    for (const i of kill) buf[i + 3] = 0;
  }
  if (!inner) return;
  const cx = W / 2, cy = H / 2;
  for (let pass = 0; pass < 14; pass++) {
    const todo = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y); if (!black(i)) continue;
      let best = -1, bd = 1e9;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = idx(nx, ny); if (buf[j + 3] === 0 || black(j)) continue;
        const d = Math.hypot(nx - cx, (ny - cy) * 0.5); if (d < bd) { bd = d; best = j; }
      }
      if (best >= 0) todo.push([i, best]);
    }
    if (!todo.length) break;
    for (const [i, j] of todo) { buf[i] = buf[j]; buf[i + 1] = buf[j + 1]; buf[i + 2] = buf[j + 2]; }
  }
}
runs.forEach(([x0], i) => {
  const out = Buffer.alloc(CW * CH * 4);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const sx = x0 + x, sy = top + y, o = (y * CW + x) * 4, p = (sy * im.w + sx) * 4;
    out[o] = im.px[p]; out[o + 1] = im.px[p + 1]; out[o + 2] = im.px[p + 2]; out[o + 3] = 255;
  }
  // nền đen nối với rìa -> trong suốt (không đụng viền đen của lá vì viền có sắc xám xanh)
  const seen = new Uint8Array(CW * CH); const q = [];
  const isBlack = (x, y) => { const o = (y * CW + x) * 4; return out[o] < 12 && out[o + 1] < 12 && out[o + 2] < 12; };
  for (let x = 0; x < CW; x++) for (const y of [0, CH - 1]) if (isBlack(x, y)) { seen[y * CW + x] = 1; q.push([x, y]); }
  for (let y = 0; y < CH; y++) for (const x of [0, CW - 1]) if (isBlack(x, y) && !seen[y * CW + x]) { seen[y * CW + x] = 1; q.push([x, y]); }
  while (q.length) {
    const [x, y] = q.pop(); out[(y * CW + x) * 4 + 3] = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= CW || ny >= CH || seen[ny * CW + nx] || !isBlack(nx, ny)) continue; seen[ny * CW + nx] = 1; q.push([nx, ny]); }
  }
  stripBlack(out, CW, CH, NAMES[i] !== 'back');
  writePNG(`assets/frames/${NAMES[i]}.png`, CW, CH, out);
});
console.log('đã khôi phục khung gốc', CW + 'x' + CH, '(lưới 64 x 134 nhân', (CW / 64).toFixed(2) + ')');
