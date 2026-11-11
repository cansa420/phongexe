// Cắt ảnh khung bài (4 lá: Văn, Sách, Vạn, lưng) từ assets/frames/_source.png,
// bỏ nền đen, thu về lưới pixel gọn (mỗi ô nhỏ lấy màu chiếm đa số) và ghi ra assets/frames/.
// Dùng: node tools/slice-frames.js [rộng-đích, mặc định 64]
const fs = require('fs');
const zlib = require('zlib');
const { readPNG } = require('./png-read.js');

const SRC = 'assets/frames/_source.png';
const OUT = 'assets/frames';
const NAMES = ['van', 'sach', 'wan', 'back'];
const TW = +process.argv[2] || 64;

function writePNG(file, w, h, px) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}


// Bỏ nét đen: viền đen ngoài cùng -> trong suốt; vạch đen bên trong (ngăn dải màu, khung tranh) -> lấy màu phía trong lá
function decolor(buf, W, H, inner = true) {
  const idx = (x, y) => (y * W + x) * 4;
  const black = (i) => buf[i + 3] > 0 && (buf[i] * 299 + buf[i + 1] * 587 + buf[i + 2] * 114) / 1000 < 42;
  const seen = new Uint8Array(W * H); const q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (buf[idx(x, y) + 3] === 0) { seen[y * W + x] = 1; q.push([x, y]); }
  while (q.length) {
    const [x, y] = q.pop();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      const i = idx(nx, ny);
      if (black(i)) { seen[ny * W + nx] = 1; buf[i + 3] = 0; q.push([nx, ny]); }
    }
  }
  if (!inner) return;
  const cx = W / 2, cy = H / 2;
  for (let pass = 0; pass < 8; pass++) {
    const todo = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y); if (!black(i)) continue;
      let best = null, bd = 1e9;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = idx(nx, ny); if (buf[j + 3] === 0 || black(j)) continue;
        const d = Math.hypot(nx - cx, (ny - cy) * 0.5); if (d < bd) { bd = d; best = j; }
      }
      if (best != null) todo.push([i, best]);
    }
    if (!todo.length) break;
    for (const [i, j] of todo) { buf[i] = buf[j]; buf[i + 1] = buf[j + 1]; buf[i + 2] = buf[j + 2]; }
  }
}

// Giữ lại cụm điểm ảnh lớn nhất (xóa đốm lẻ quanh lá)
function keepMain(buf, W, H) {
  const lab = new Int32Array(W * H).fill(-1); const sizes = [];
  for (let s = 0; s < W * H; s++) {
    if (lab[s] >= 0 || buf[s * 4 + 3] === 0) continue;
    const id = sizes.length; let n = 0; const st = [s]; lab[s] = id;
    while (st.length) {
      const p = st.pop(); n++; const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx; if (lab[q] >= 0 || buf[q * 4 + 3] === 0) continue; lab[q] = id; st.push(q);
      }
    }
    sizes.push(n);
  }
  const main = sizes.indexOf(Math.max(...sizes));
  for (let p = 0; p < W * H; p++) if (lab[p] !== main) buf[p * 4 + 3] = 0;
}
const im = readPNG(SRC);
const isBg = (x, y) => { const o = (y * im.w + x) * 4; return im.px[o] < 12 && im.px[o + 1] < 12 && im.px[o + 2] < 12; };

// khung chữ nhật của từng lá (cột có điểm không phải nền)
const cols = []; for (let x = 0; x < im.w; x++) { let n = 0; for (let y = 0; y < im.h; y++) if (!isBg(x, y)) n++; cols.push(n); }
const runs = []; let s = -1; cols.forEach((n, x) => { if (n > 0 && s < 0) s = x; if (n === 0 && s >= 0) { runs.push([s, x - 1]); s = -1; } });
if (runs.length !== 4) throw new Error('không tìm đủ 4 lá: ' + JSON.stringify(runs));
let top = im.h, bot = 0; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (!isBg(x, y)) { top = Math.min(top, y); bot = Math.max(bot, y); }
const CH = bot - top + 1, CW = Math.max(...runs.map((r) => r[1] - r[0] + 1));
const step = CW / TW, TH = Math.round(CH / step);
console.log('lá', CW, 'x', CH, '-> lưới', TW, 'x', TH, 'bước', step.toFixed(2));

runs.forEach(([x0], i) => {
  // ô nền ngoài lá: lấp từ rìa để bỏ nền đen, giữ viền đen của lá
  const w = CW, h = CH, ox = x0, oy = top;
  const out = Buffer.alloc(TW * TH * 4);
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    const xa = Math.floor(ox + tx * step), xb = Math.max(xa + 1, Math.floor(ox + (tx + 1) * step));
    const ya = Math.floor(oy + ty * step), yb = Math.max(ya + 1, Math.floor(oy + (ty + 1) * step));
    const bins = new Map(); let bgN = 0, tot = 0;
    for (let y = ya; y < yb; y++) for (let x = xa; x < Math.min(xb, im.w); x++) {
      tot++;
      if (isBg(x, y)) { bgN++; continue; }
      const o = (y * im.w + x) * 4, r = im.px[o], g = im.px[o + 1], b = im.px[o + 2];
      const k = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
      const e = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 }; e.n++; e.r += r; e.g += g; e.b += b; bins.set(k, e);
    }
    const o = (ty * TW + tx) * 4;
    if (bgN * 2 > tot || !bins.size) continue; // trong suốt
    let best = null; for (const e of bins.values()) if (!best || e.n > best.n) best = e;
    out[o] = Math.round(best.r / best.n); out[o + 1] = Math.round(best.g / best.n); out[o + 2] = Math.round(best.b / best.n); out[o + 3] = 255;
  }
  // nền đen bên trong góc vát (không nối ra rìa) cũng đã được coi là nền ở trên
  decolor(out, TW, TH, NAMES[i] !== 'back'); keepMain(out, TW, TH);
  writePNG(`${OUT}/${NAMES[i]}.png`, TW, TH, out);
});
console.log('xong:', NAMES.map((n) => `${OUT}/${n}.png`).join(', '));
require('./gen-card-frames.js'); // ba khung họ vẽ lại bằng mã, ghi đè ba ảnh cắt từ nguồn
