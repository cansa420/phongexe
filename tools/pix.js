'use strict';
// Bộ vẽ pixel tối thiểu + ghi PNG, không cần thư viện ngoài.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Bảng màu gốc của GDD (mục 9.2) và các bậc pha trộn (mục 9.3). Không thêm màu mới ngoài bảng.
const hex = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
const P = { son: '#963F38', cham: '#293C4A', ngoc: '#45a79e', kem: '#e7dcc2', den: '#191b1f', vang: '#B99A60' };
P.chamL = mix(P.cham, P.kem, 0.15); P.chamD = mix(P.cham, P.den, 0.4);
P.sonL = mix(P.son, P.kem, 0.25); P.sonD = mix(P.son, P.den, 0.45);
P.ngocL = mix(P.ngoc, P.kem, 0.3); P.ngocD = mix(P.ngoc, P.den, 0.45);
P.vangD = mix(P.vang, P.den, 0.45); P.vangL = mix(P.vang, P.kem, 0.4);
P.kemD = mix(P.kem, P.den, 0.25); P.skin = mix(P.kem, P.vang, 0.35); P.skinD = mix(P.skin, P.den, 0.2);

class Img {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h * 4); }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (c === null) { this.d[i + 3] = 0; return; }
    const v = hex(c); this.d[i] = v[0]; this.d[i + 1] = v[1]; this.d[i + 2] = v[2]; this.d[i + 3] = 255;
  }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[(y * this.w + x) * 4 + 3]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  circle(cx, cy, r, c) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) this.set(cx + i, cy + j, c); }
  ellipse(cx, cy, rx, ry, c) { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + 0.3) + (j * j) / (ry * ry + 0.3) <= 1) this.set(cx + i, cy + j, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
    for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  // tam giác đặc theo từng hàng (đỉnh trên (x,y), đáy rộng w ở y+h)
  tri(x, y, w, h, c) { for (let j = 0; j <= h; j++) { const hw = (w / 2) * (j / h); this.rect(Math.round(x - hw), y + j, Math.round(hw * 2) + 1, 1, c); } }
  // xoá/đổi màu viền ngoài: ô trong suốt kề ô đặc (4 hướng) thì tô màu c
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!this.get(x, y) && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))) add.push([x, y]);
    add.forEach(([x, y]) => this.set(x, y, c));
  }
  // tối đi các ô đặc mà bên phải hoặc bên dưới là trống, tạo mảng sáng tối kiểu pixel
  shade(fn) {
    const mark = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.get(x, y) && (!this.get(x + 1, y) || !this.get(x, y + 1))) mark.push([x, y]);
    mark.forEach(([x, y]) => { const i = (y * this.w + x) * 4; const c = fn('#' + [this.d[i], this.d[i + 1], this.d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')); if (c) this.set(x, y, c); });
  }
  blit(src, ox, oy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) if (src.get(x, y)) { const i = (y * src.w + x) * 4; this.set(ox + x, oy + y, '#' + [src.d[i], src.d[i + 1], src.d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')); } }
  png(scale = 1) {
    const W = this.w * scale, H = this.h * scale; const raw = Buffer.alloc((W * 4 + 1) * H);
    for (let y = 0; y < H; y++) {
      raw[y * (W * 4 + 1)] = 0;
      for (let x = 0; x < W; x++) { const s = (Math.floor(y / scale) * this.w + Math.floor(x / scale)) * 4; const o = y * (W * 4 + 1) + 1 + x * 4; raw[o] = this.d[s]; raw[o + 1] = this.d[s + 1]; raw[o + 2] = this.d[s + 2]; raw[o + 3] = this.d[s + 3]; }
    }
    const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0); return Buffer.concat([len, td, crc]); };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  }
  save(file, scale = 1) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, this.png(scale)); }
}

// Số ngẫu nhiên có hạt giống để ảnh sinh ra luôn giống nhau mỗi lần chạy
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

module.exports = { Img, P, mix, hex, rng };
