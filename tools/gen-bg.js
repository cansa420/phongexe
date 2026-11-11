'use strict';
// 8 nền chặng TẠM x 2 hướng: dọc 180x320 (9:16) và ngang 320x180 (16:9). Họa sĩ vẽ lại và thay đúng tên tệp trong assets/bg/.
const { Img, P, mix, rng } = require('./pix');

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function gradient(g, y0, y1, top, bot, steps = 7) {
  const pal = Array.from({ length: steps }, (_, i) => mix(top, bot, i / (steps - 1)));
  for (let y = y0; y < y1; y++) {
    const v = ((y - y0) / Math.max(1, y1 - y0 - 1)) * (steps - 1); const lo = Math.floor(v); const fr = v - lo;
    for (let x = 0; x < g.w; x++) g.set(x, y, pal[Math.min(steps - 1, lo + (fr > BAYER[y & 3][x & 3] / 16 ? 1 : 0))]);
  }
}
function dots(g, r, n, y0, y1, cols) { for (let i = 0; i < n; i++) g.set(r() * g.w, y0 + r() * (y1 - y0), cols[Math.floor(r() * cols.length)]); }
function hills(g, r, base, amp, col, seed = 1, step = 1) {
  const ph = r() * 6; for (let x = 0; x < g.w; x++) { const h = base - Math.round(amp * (0.5 + 0.28 * Math.sin(x / (22 * step) + ph + seed) + 0.22 * Math.sin(x / (9 * step) + seed * 3))); g.rect(x, h, 1, g.h - h, col); }
}
function moon(g, x, y, rad, halo) { g.circle(x, y, rad + 5, mix(halo, P.den, 0.5)); g.circle(x, y, rad + 2, mix(halo, P.den, 0.2)); g.circle(x, y, rad, P.kem); g.circle(x - 2, y - 1, Math.max(1, rad - 4), P.kemD); g.circle(x - 3, y - 2, Math.max(1, rad - 5), P.kem); }
function lantern(g, x, y, s, c) { g.line(x, y - s, x, y - 1, P.den); g.ellipse(x, y + s, Math.ceil(s * 0.8), s, c); g.rect(x - 1, y, 3, 1, P.den); g.set(x, y + s, P.kem); }
function glitch(g, r, y0, y1, bands) { for (let b = 0; b < bands; b++) { const y = y0 + Math.floor(r() * (y1 - y0)); const h = 1 + Math.floor(r() * 4); const dx = Math.round((r() - 0.5) * 14); const tmp = []; for (let j = 0; j < h; j++) { const row = []; for (let x = 0; x < g.w; x++) { const i = ((y + j) * g.w + x) * 4; row.push([g.d[i], g.d[i + 1], g.d[i + 2], g.d[i + 3]]); } tmp.push(row); } for (let j = 0; j < h; j++) for (let x = 0; x < g.w; x++) { const s = tmp[j][((x - dx) % g.w + g.w) % g.w]; const i = ((y + j) * g.w + x) * 4; g.d[i] = s[0]; g.d[i + 1] = s[1]; g.d[i + 2] = s[2]; g.d[i + 3] = s[3]; } g.rect(r() * g.w, y + h, 14 + r() * 20, 1, r() > 0.5 ? P.ngoc : P.son); } }

const SCENES = [
  // 1. Cổng Làng Quang Tử: chàm + men ngọc
  (g, r, hy) => {
    gradient(g, 0, hy, P.den, mix(P.cham, P.ngoc, 0.35)); dots(g, r, 60, 0, hy * 0.7, [P.kem, P.kemD, P.ngocL]);
    moon(g, Math.round(g.w * 0.74), Math.round(hy * 0.3), 9, P.ngocL);
    hills(g, r, hy + 2, 20, P.chamD, 1); hills(g, r, hy + 8, 14, mix(P.chamD, P.den, 0.4), 4);
    const tx = Math.round(g.w * 0.25);
    g.rect(tx - 5, hy - 40, 10, 50, P.sonD); g.rect(tx - 4, hy - 40, 3, 50, mix(P.sonD, P.son, 0.5));
    g.line(tx - 5, hy + 8, tx - 14, hy + 14, P.sonD); g.line(tx + 5, hy + 8, tx + 15, hy + 14, P.sonD);
    for (let i = 0; i < 28; i++) { const a = r() * Math.PI * 2, d = r() * 34; g.circle(tx + Math.cos(a) * d * 1.4, hy - 52 + Math.sin(a) * d * 0.55, 6 + r() * 6, i % 3 ? P.ngocD : mix(P.ngocD, P.ngoc, 0.4)); }
    for (let i = 0; i < 9; i++) { const x = tx - 38 + i * 9 + Math.round(r() * 3); const l = 18 + Math.floor(r() * 30); g.rect(x, hy - 48, 1, l, P.ngoc); g.set(x, hy - 48 + Math.floor(r() * l), P.kem); }
    const gx = Math.round(g.w * 0.68), gw = Math.round(g.w * 0.26);
    g.rect(gx, hy - 46, 6, 54, P.sonD); g.rect(gx + gw, hy - 46, 6, 54, P.sonD); g.rect(gx + 1, hy - 46, 2, 54, P.son); g.rect(gx + gw + 1, hy - 46, 2, 54, P.son);
    g.rect(gx - 8, hy - 52, gw + 22, 5, P.den); g.rect(gx - 4, hy - 57, gw + 14, 5, mix(P.den, P.cham, 0.4)); g.rect(gx - 11, hy - 54, 4, 2, P.den); g.rect(gx + gw + 13, hy - 54, 4, 2, P.den);
    for (let x = gx - 4; x < gx + gw + 10; x += 4) g.rect(x, hy - 53, 2, 1, P.sonL);
    g.rect(gx + 6, hy - 40, gw - 6, 3, P.vangD); lantern(g, gx + Math.round(gw / 2) + 3, hy - 37, 3, P.vang);
    g.rect(0, hy + 8, g.w, g.h - hy - 8, P.chamD); gradient(g, hy + 8, g.h, mix(P.chamD, P.ngocD, 0.3), P.den, 5);
    g.rect(gx + 6, hy + 8, gw - 6, g.h - hy - 8, mix(P.chamD, P.kem, 0.1)); dots(g, r, 120, hy + 10, g.h, [P.kemD, P.chamL]);
  },
  // 2. Chợ Đêm Hàng Mã: đỏ son + vàng đồng
  (g, r, hy) => {
    gradient(g, 0, hy + 10, P.den, P.sonD); dots(g, r, 25, 0, hy * 0.5, [P.vangL]);
    for (let x = 0; x < g.w; x += 3) g.rect(x, hy - 22 + Math.round(Math.sin(x / 9) * 3), 3, 1, P.den);
    const n = Math.max(3, Math.round(g.w / 46));
    for (let i = 0; i < n; i++) {
      const cx = Math.round(((i + 0.5) / n) * g.w), w = Math.round(g.w / n) - 6;
      g.rect(cx - w / 2, hy - 8, 2, 28, P.vangD); g.rect(cx + w / 2 - 2, hy - 8, 2, 28, P.vangD);
      for (let k = 0; k < w; k += 4) g.rect(cx - w / 2 + k, hy - 14, 4, 8, (k / 4) % 2 ? P.kem : P.son);
      g.rect(cx - w / 2, hy - 6, w, 2, P.sonD); g.rect(cx - w / 2 + 2, hy + 8, w - 4, 12, P.chamD);
      for (let k = 0; k < 3; k++) lantern(g, cx - w / 2 + 6 + k * Math.floor((w - 10) / 2), hy - 6, 3, k % 2 ? P.vang : P.sonL);
      g.rect(cx - 4, hy + 4, 8, 4, (i % 2) ? P.ngoc : P.vang);
    }
    for (let i = 0; i < Math.max(4, g.w / 30); i++) lantern(g, Math.round(r() * g.w), hy - 30 - Math.round(r() * 50), 4, r() > 0.4 ? P.vang : P.sonL);
    gradient(g, hy + 20, g.h, mix(P.sonD, P.den, 0.3), P.den, 5); dots(g, r, 150, hy + 22, g.h, [P.vangD, P.sonD]);
  },
  // 3. Bến Nước Optic: men ngọc + chàm
  (g, r, hy) => {
    gradient(g, 0, hy, P.den, mix(P.cham, P.ngoc, 0.5)); dots(g, r, 70, 0, hy * 0.7, [P.kem, P.ngocL]);
    moon(g, Math.round(g.w * 0.3), Math.round(hy * 0.34), 10, P.ngocL);
    hills(g, r, hy + 1, 12, mix(P.chamD, P.den, 0.3), 2, 0.8);
    for (let i = 0; i < 6; i++) { const x = Math.round(r() * g.w); g.rect(x, hy - 24, 2, 22, P.den); g.circle(x + 1, hy - 26, 5, P.den); }
    gradient(g, hy, g.h, mix(P.ngoc, P.cham, 0.4), P.chamD, 8);
    for (let y = hy + 2; y < g.h; y += 2 + Math.floor((y - hy) / 40)) for (let k = 0; k < 6; k++) { const x = Math.round(r() * g.w); g.rect(x, y, 3 + Math.round(r() * (y - hy) / 8), 1, r() > 0.3 ? P.ngocL : P.ngoc); }
    const bx = Math.round(g.w * 0.62), by = hy + Math.round((g.h - hy) * 0.3);
    for (let j = 0; j < 6; j++) g.rect(bx - 22 + j, by + j, 44 - j * 2, 1, P.den); g.line(bx, by - 30, bx, by, P.den); g.tri(bx + 1, by - 28, 16, 24, mix(P.den, P.cham, 0.5)); g.rect(bx - 6, by - 4, 12, 3, P.vang);
    for (let k = 0; k < 8; k++) g.rect(bx - 16 + k * 4, by + 8 + k % 2, 3, 1, P.ngocL);
    for (let x = 0; x < g.w; x += 6) { g.set(x + (r() * 4 | 0), hy + 4 + (r() * (g.h - hy) | 0), P.kem); }
  },
  // 4. Đình Server: đỏ son + đen
  (g, r, hy) => {
    g.rect(0, 0, g.w, g.h, P.den); gradient(g, 0, hy, P.den, mix(P.sonD, P.den, 0.3), 5);
    for (let i = 0; i < 6; i++) { g.line(0, 14 + i * 7, g.w / 2, 4 + i * 4, P.sonD); g.line(g.w, 14 + i * 7, g.w / 2, 4 + i * 4, P.sonD); }
    g.rect(0, 0, g.w, 6, P.sonD); g.rect(0, 6, g.w, 2, P.son);
    const n = g.w > g.h ? 5 : 3; const cw = Math.round(g.w / n);
    for (let i = 0; i < n; i++) {
      const x = Math.round(i * cw + cw * 0.18), w = Math.round(cw * 0.64), top = hy - Math.round(g.h * 0.36);
      g.rect(x, top, w, hy - top + 8, mix(P.chamD, P.den, 0.3)); g.rect(x, top, w, 2, P.chamL); g.rect(x, top, 2, hy - top + 8, mix(P.chamD, P.chamL, 0.4));
      for (let y = top + 5; y < hy + 4; y += 4) { g.rect(x + 4, y, w - 8, 2, P.den); for (let k = 0; k < 5; k++) if (r() > 0.35) g.set(x + 6 + k * 3, y, r() > 0.7 ? P.son : r() > 0.4 ? P.ngoc : P.vang); }
      g.rect(x + w / 2 - 1, top - 6, 2, 6, P.vangD);
    }
    gradient(g, hy + 8, g.h, mix(P.sonD, P.den, 0.4), P.den, 5);
    for (let x = -g.h; x < g.w + g.h; x += 20) g.line(g.w / 2 + (x - g.w / 2) * 0.2, hy + 8, x, g.h, P.sonD); for (let y = hy + 12; y < g.h; y += 8 + (y - hy) / 14) g.rect(0, y, g.w, 1, P.sonD);
    g.rect(g.w / 2 - 14, hy + 16, 28, 14, mix(P.ngoc, P.den, 0.55)); g.rect(g.w / 2 - 12, hy + 18, 24, 10, P.ngocD);
  },
  // 5. Rừng Mã Nguồn: men ngọc + đen
  (g, r, hy) => {
    gradient(g, 0, g.h, P.den, mix(P.ngocD, P.den, 0.2), 8);
    for (const [layer, col, wmin] of [[0, mix(P.ngocD, P.den, 0.5), 3], [1, P.ngocD, 4], [2, mix(P.ngocD, P.ngoc, 0.35), 5]]) {
      const cnt = Math.round(g.w / (layer ? 20 : 12));
      for (let i = 0; i < cnt; i++) { const x = Math.round(r() * g.w), w = wmin + Math.floor(r() * 3); g.rect(x, 0, w, g.h, col); g.rect(x, 0, 1, g.h, mix(col, P.ngocL, 0.3)); for (let y = (r() * 20) | 0; y < g.h; y += 18 + ((r() * 14) | 0)) g.rect(x - 1, y, w + 2, 2, mix(col, P.den, 0.4)); }
    }
    const digits = '01'; const F = require('./gen-charms-font');
    for (let i = 0; i < Math.round(g.w / 9); i++) { const x = Math.round(r() * g.w), len = 4 + ((r() * 8) | 0), y0 = (r() * g.h * 0.8) | 0; for (let k = 0; k < len; k++) F(g, digits[(r() * 2) | 0], x, y0 + k * 7, k === len - 1 ? P.kem : mix(P.ngoc, P.den, Math.min(0.85, (len - 1 - k) * 0.14))); }
    for (let i = 0; i < 30; i++) { const x = r() * g.w, y = hy - 30 + r() * 70; g.circle(x, y, 1, P.ngocL); g.set(x, y, P.kem); }
    for (let y = g.h - 40; y < g.h; y++) for (let x = 0; x < g.w; x++) if ((x + y) % 2 === 0 && r() > (g.h - y) / 50) g.set(x, y, P.ngocD);
  },
  // 6. Phố Cổ Chập Chờ: vàng đồng + chàm
  (g, r, hy) => {
    gradient(g, 0, hy, P.cham, mix(P.vangD, P.vang, 0.3), 8); dots(g, r, 40, 0, hy * 0.4, [P.kem]);
    let x = -4; while (x < g.w) {
      const w = 26 + ((r() * 20) | 0), h = 36 + ((r() * 36) | 0), top = hy - h;
      const wall = r() > 0.5 ? mix(P.chamD, P.vangD, 0.35) : mix(P.sonD, P.den, 0.2);
      g.rect(x, top, w, h + 40, wall); g.rect(x - 3, top - 5, w + 6, 5, P.den); g.rect(x - 1, top - 8, w + 2, 3, P.sonD); for (let k = x - 2; k < x + w + 2; k += 3) g.rect(k, top - 6, 1, 4, P.sonD);
      for (let wy = top + 8; wy < hy + 10; wy += 14) for (let wx = x + 5; wx < x + w - 6; wx += 11) g.rect(wx, wy, 6, 8, r() > 0.45 ? P.vang : P.den);
      if (r() > 0.4) { const sx = x + 2 + ((r() * (w - 14)) | 0); g.rect(sx, top + 12, 5, 18 + ((r() * 8) | 0), P.kem); g.rect(sx + 1, top + 14, 3, 3, P.son); g.rect(sx + 1, top + 19, 3, 2, P.cham); }
      x += w + 2;
    }
    gradient(g, hy + 10, g.h, mix(P.chamD, P.vangD, 0.25), P.den, 5); for (let k = 0; k < 40; k++) g.rect(r() * g.w, hy + 14 + r() * (g.h - hy), 6, 1, P.vangD);
    glitch(g, r, 10, hy + 20, 9);
  },
  // 7. Tháp Bút Lỗi: chàm + đỏ son
  (g, r, hy) => {
    gradient(g, 0, g.h, P.den, mix(P.cham, P.son, 0.35), 9); dots(g, r, 50, 0, hy, [P.kemD, P.sonL]);
    const cx = Math.round(g.w / 2);
    for (let t = 0; t < 7; t++) { const y = hy - 10 - t * 15, w = 40 - t * 4; g.rect(cx - w / 2, y, w, 12, mix(P.chamD, P.chamL, 0.2 + t * 0.05)); g.rect(cx - w / 2 - 4, y - 3, w + 8, 3, P.den); g.rect(cx - 3, y + 3, 6, 6, P.vangD); }
    const topY = hy - 10 - 7 * 15; g.tri(cx, topY - 26, 14, 26, P.den); g.tri(cx, topY - 26, 6, 12, P.kem);
    for (let i = 0; i < Math.round(g.w / 6); i++) { const x = Math.round(r() * g.w), l = 20 + ((r() * 90) | 0), y0 = topY - 26 + ((r() * 20) | 0); g.rect(x, y0, 1, l, r() > 0.5 ? P.kemD : P.sonL); if (r() > 0.6) g.rect(x, y0 + l, 2, 3, P.sonL); }
    for (let i = 0; i < 6; i++) { const x = Math.round(r() * g.w), y = 10 + ((r() * 40) | 0); g.rect(x, y, 18 + ((r() * 18) | 0), 2, mix(P.chamL, P.den, 0.3)); }
    gradient(g, hy + 8, g.h, mix(P.chamD, P.den, 0.3), P.den, 5); for (let y = hy + 10; y < g.h; y += 4) g.rect(cx - 18 + ((r() * 10) | 0), y, 8 + ((r() * 14) | 0), 1, P.sonD);
  },
  // 8. Đồng Khô Mất Điện: đỏ son + đen
  (g, r, hy) => {
    gradient(g, 0, hy, mix(P.sonD, P.den, 0.4), P.sonL, 9); dots(g, r, 20, 0, hy * 0.5, [P.kemD]);
    g.circle(Math.round(g.w * 0.5), hy - 18, 26, mix(P.son, P.den, 0.3)); g.circle(Math.round(g.w * 0.5), hy - 18, 20, P.den);
    hills(g, r, hy + 2, 10, mix(P.sonD, P.den, 0.5), 3, 1.4);
    const ground = mix(P.son, P.den, 0.55); gradient(g, hy + 2, g.h, ground, P.den, 7);
    for (let c = 0; c < 18; c++) { let x = r() * g.w, y = hy + 6 + r() * (g.h - hy - 6); const k = 6 + ((r() * 14) | 0); for (let s = 0; s < k; s++) { const nx = x + (r() - 0.5) * 9, ny = y + (r() - 0.2) * 5; g.line(x, y, nx, ny, P.den); x = nx; y = ny; } }
    const px = Math.round(g.w * 0.2); g.line(px, hy + 4, px + 5, hy - 40, P.den); g.line(px + 6, hy + 4, px + 8, hy - 40, P.den); for (let k = 0; k < 6; k++) g.line(px + 1, hy - k * 7, px + 7, hy - 6 - k * 7, P.den);
    g.line(px - 14, hy - 38, px + 24, hy - 42, P.den); g.line(px - 14, hy - 38, px - 22, hy - 30, P.den);
    const fx = Math.round(g.w * 0.74); g.line(fx, hy + 18, fx + 34, hy + 4, P.den); g.line(fx + 2, hy + 22, fx + 36, hy + 8, P.den); for (let k = 0; k < 5; k++) g.line(fx + k * 7, hy + 18 - k * 3, fx + k * 7 + 3, hy + 22 - k * 3, P.den);
    g.line(Math.round(g.w * 0.9), hy + 12, Math.round(g.w * 0.9), hy - 14, P.den); g.line(Math.round(g.w * 0.9), hy - 6, Math.round(g.w * 0.9) + 8, hy - 14, P.den);
  },
];

module.exports = function genBg(outDir) {
  let n = 0;
  SCENES.forEach((scene, i) => {
    for (const [tag, W, H] of [['p', 180, 320], ['l', 320, 180]]) {
      const g = new Img(W, H); const r = rng(1000 + i * 7 + (tag === 'p' ? 0 : 1));
      scene(g, r, Math.round(H * (tag === 'p' ? 0.6 : 0.64)));
      g.save(`${outDir}/bg/stage${i + 1}_${tag}.png`); n++;
    }
  });
  return n;
};
