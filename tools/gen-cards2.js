'use strict';
// DEMO: lá bài vẽ chi tiết hơn (64 x 118 px). Mỗi bộ phận được tô 4 tông (sáng, nền, tối, sâu) theo hướng sáng trên-trái,
// cách vẽ gần với ảnh tham khảo của bạn: khối rõ, ít nét đen, nhiều mảng sáng tối.
const { Img, P, mix } = require('./pix');

const W = 64, H = 118;
const R = {
  skin: [mix(P.kem, P.vang, 0.12), P.skin, P.skinD, mix(P.skinD, P.son, 0.35)],
  son: [P.sonL, P.son, P.sonD, mix(P.sonD, P.den, 0.55)],
  ngoc: [P.ngocL, P.ngoc, P.ngocD, mix(P.ngocD, P.den, 0.55)],
  cham: [mix(P.chamL, P.kem, 0.6), mix(P.chamL, P.kem, 0.3), P.chamL, P.cham],
  pants: [mix(P.cham, P.chamL, 0.8), mix(P.cham, P.chamL, 0.4), P.cham, P.den],
  hair: [P.chamL, P.cham, mix(P.cham, P.den, 0.6), P.den],
  wood: [P.vangL, P.vang, P.vangD, mix(P.vangD, P.den, 0.5)],
  kem: [P.kem, mix(P.kem, P.kemD, 0.3), P.kemD, mix(P.kemD, P.den, 0.45)],
  steel: [P.kem, mix(P.kemD, P.chamL, 0.2), mix(P.chamL, P.kemD, 0.3), P.cham],
  gold: [P.vangL, P.vang, mix(P.vang, P.vangD, 0.6), P.vangD],
  pink: [P.kem, mix(P.sonL, P.kem, 0.45), P.sonL, mix(P.son, P.sonL, 0.3)],
  water: [P.ngocL, P.ngoc, P.ngocD, mix(P.ngocD, P.den, 0.4)],
};

// vẽ một bộ phận: draw(m, c) tô lên mặt nạ m; rồi tô 4 tông theo cạnh (sáng ở trái-trên, tối ở phải-dưới) và đổ vào img
function part(img, draw, rp, o = {}) {
  const m = new Img(W, H); draw(m, '#ffffff');
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!m.get(x, y)) continue;
    const hit = (dx, dy, n) => { for (let s = 1; s <= n; s++) if (!m.get(x + dx * s, y + dy * s)) return true; return false; };
    let k = 1;
    if (hit(1, 1, 2) || hit(1, 0, 2) || hit(0, 1, 2)) k = 2;
    if (hit(1, 1, 1) && (hit(1, 0, 1) || hit(0, 1, 1))) k = 3;
    if (hit(-1, -1, 2) || hit(-1, 0, 1) || hit(0, -1, 1)) k = (k === 3 ? 2 : 0);
    if (o.fold && o.fold(x, y)) k = Math.max(k, 2);
    if (o.light && o.light(x, y)) k = Math.min(k, 0);
    out.push([x, y, rp[k]]);
  }
  out.forEach(([x, y, c]) => img.set(x, y, c));
}
const disc = (m, c, cx, cy, r) => { const q = Math.ceil(r) + 1; for (let j = -q; j <= q; j++) for (let i = -q; i <= q; i++) if (Math.hypot(i, j) <= r + 0.35) m.set(Math.round(cx) + i, Math.round(cy) + j, c); };
const limb = (m, c, x0, y0, x1, y1, r) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 3 || 1; for (let i = 0; i <= n; i++) disc(m, c, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, r); };
const rows = (m, c, y0, y1, fx) => { for (let y = y0; y <= y1; y++) { const [a, b] = fx(y); m.rect(Math.round(a), y, Math.round(b - a), 1, c); } };

function head(img, o = {}) {
  const cy = o.cy || 29;
  part(img, (m, c) => m.rect(29, cy + 5, 6, 8, c), R.skin);
  part(img, (m, c) => { m.ellipse(32, cy, 7, 8, c); m.circle(25, cy + 1, 1, c); m.circle(39, cy + 1, 1, c); }, R.skin);
  [[29, cy], [35, cy]].forEach(([x, y]) => { img.set(x, y, P.den); img.set(x, y + 1, P.den); });
  img.set(28, cy - 2, R.hair[2]); img.set(29, cy - 2, R.hair[2]); img.set(35, cy - 2, R.hair[2]); img.set(36, cy - 2, R.hair[2]);
  img.set(32, cy + 3, R.skin[3]); img.set(30, cy + 5, R.skin[3]); img.set(31, cy + 5, R.skin[3]); img.set(32, cy + 5, R.skin[3]);
  img.set(27, cy + 3, R.pink[2]); img.set(37, cy + 3, R.pink[2]);
  if (o.beard) part(img, (m, c) => { rows(m, c, cy + 5, cy + o.beard, (y) => [32 - 6 + (y - cy - 5) * 0.55, 32 + 6 - (y - cy - 5) * 0.55]); m.rect(27, cy + 3, 10, 2, c); }, R.kem);
  if (o.hat === 'khan') { part(img, (m, c) => { m.ellipse(32, cy - 8, 9, 6, c); }, R.hair); part(img, (m, c) => m.rect(23, cy - 5, 18, 3, c), R.gold); }
  if (o.hat === 'nonla') { part(img, (m, c) => rows(m, c, cy - 17, cy - 4, (y) => [32 - (y - cy + 17) * 2.1 - 1, 32 + (y - cy + 17) * 2.1 + 1]), R.wood, { fold: (x, y) => (x + y) % 6 === 0 }); img.line(25, cy - 3, 26, cy + 8, P.kemD); img.line(39, cy - 3, 38, cy + 8, P.kemD); }
  if (o.hat === 'bun') { part(img, (m, c) => { m.ellipse(32, cy - 4, 8, 6, c); m.rect(24, cy - 3, 3, 10, c); m.rect(37, cy - 3, 3, 10, c); }, R.hair); part(img, (m, c) => m.circle(32, cy - 13, 4, c), R.hair); part(img, (m, c) => m.rect(29, cy - 10, 8, 2, c), R.gold); }
  if (o.hat === 'white') { part(img, (m, c) => { m.ellipse(32, cy - 5, 8, 5, c); m.rect(24, cy - 4, 3, 8, c); m.rect(37, cy - 4, 3, 8, c); }, R.kem); part(img, (m, c) => m.circle(32, cy - 12, 4, c), R.kem); }
  if (o.hat === 'bald') { part(img, (m, c) => { m.rect(24, cy - 3, 3, 8, c); m.rect(37, cy - 3, 3, 8, c); m.rect(26, cy - 7, 12, 2, c); }, R.hair); }
  if (o.hat === 'band') { part(img, (m, c) => { m.ellipse(32, cy - 6, 8, 5, c); }, R.hair); part(img, (m, c) => m.rect(24, cy - 4, 16, 3, c), R.gold); }
}

function legs(img, rp, o = {}) {
  part(img, (m, c) => { limb(m, c, 27, 72, 26, 103, 4); limb(m, c, 37, 72, 38, 103, 4); }, rp);
  part(img, (m, c) => { m.rect(21, 102, 11, 9, c); m.rect(33, 102, 11, 9, c); m.rect(19, 108, 5, 3, c); m.rect(41, 108, 5, 3, c); }, R.hair);
}
function torso(img, rp, o = {}) {
  const half = o.half || 11; const end = o.end || 72;
  part(img, (m, c) => rows(m, c, 41, end, (y) => [32 - half - (y - 41) * (o.flare || 0.1), 32 + half + (y - 41) * (o.flare || 0.1)]), rp, { fold: (x, y) => (o.long ? (x - 20) % 7 === 0 && y > 66 : false) });
  if (!o.noSash) part(img, (m, c) => m.rect(32 - half - 1, o.sashY || 62, half * 2 + 2, 4, c), R.gold);
  part(img, (m, c) => { for (let j = 0; j < 8; j++) m.rect(28 + Math.floor(j * 0.5), 40 + j, 8 - j, 1, c); }, R.skin, { flat: true });
}
function arm(img, rp, pts, handR = 3, sleeve = 4) {
  const [s, e, h] = pts;
  part(img, (m, c) => { limb(m, c, s[0], s[1], e[0], e[1], sleeve); limb(m, c, e[0], e[1], h[0], h[1], sleeve - 0.6); }, rp);
  part(img, (m, c) => m.circle(h[0], h[1], handR, c), R.skin);
}
const finish = (img) => {
  const px = (x, y) => { const i = (y * img.w + x) * 4; return '#' + [img.d[i], img.d[i + 1], img.d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join(''); };
  const add = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.get(x, y)) continue;
    let nb = null;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if (img.get(x + dx, y + dy)) { nb = px(x + dx, y + dy); break; }
    if (nb) add.push([x, y, mix(nb, P.den, 0.5)]);
  }
  add.forEach(([x, y, c]) => img.set(x, y, c));
  return img;
};

// ---- sáu lá demo
const cards = {
  'van_9': () => { // Cửu Văn: người vác thang
    const g = new Img(W, H);
    const rail = (dx) => (m, c) => { limb(m, c, 14 + dx, 108, 44 + dx, 12, 1.6); };
    part(g, rail(0), R.wood); part(g, rail(8), R.wood);
    for (let t = 0.08; t < 1; t += 0.115) { const x = 14 + 30 * t, y = 108 - 96 * t; part(g, (m, c) => limb(m, c, x, y, x + 8, y, 1), R.wood); }
    legs(g, R.pants); torso(g, R.son, { half: 11, end: 74, sashY: 62 });
    arm(g, R.son, [[21, 45], [17, 60], [20, 74]]);
    head(g, { hat: 'khan' });
    arm(g, R.son, [[43, 45], [52, 52], [47, 34]]);
    return finish(g);
  },
  'wan_10': () => { // Ông Lão Vạn: người hói quay lưng, đeo kiếm bên hông
    const g = new Img(W, H);
    legs(g, R.skin); part(g, (m, c) => { m.rect(23, 70, 18, 14, c); }, R.kem);
    part(g, (m, c) => { m.rect(21, 104, 9, 8, c); m.rect(34, 104, 9, 8, c); }, R.hair);
    torso(g, R.cham, { half: 11, end: 72, sashY: 62 });
    part(g, (m, c) => limb(m, c, 20, 68, 50, 100, 1.6), R.hair); part(g, (m, c) => m.rect(17, 64, 8, 4, c), R.gold);
    arm(g, R.cham, [[21, 45], [16, 58], [20, 70]]);
    head(g, { hat: 'bald' });
    arm(g, R.cham, [[43, 45], [48, 58], [44, 70]]);
    return finish(g);
  },
  'sach_10': () => { // Thang Thang Sách: mẹ địu con sau lưng, kimono hoa
    const g = new Img(W, H);
    part(g, (m, c) => { m.ellipse(46, 64, 8, 11, c); }, R.kem);
    part(g, (m, c) => m.circle(47, 50, 5, c), R.skin); part(g, (m, c) => m.ellipse(47, 46, 5, 3, c), R.hair);
    legs(g, R.ngoc); torso(g, R.ngoc, { half: 11, end: 106, flare: 0.09, long: true, sashY: 60 });
    for (let i = 0; i < 26; i++) { const x = 22 + ((i * 17) % 21), y = 48 + ((i * 29) % 52); g.set(x, y, P.kem); g.set(x + 1, y, P.sonL); }
    part(g, (m, c) => m.rect(21, 103, 22, 8, c), R.hair);
    head(g, { hat: 'bun' });
    arm(g, R.ngoc, [[21, 45], [17, 60], [24, 68]]);
    arm(g, R.ngoc, [[43, 45], [51, 58], [49, 70]]);
    return finish(g);
  },
  'van_10': () => { // Chi Chi Văn: người hói to lớn xách bọc
    const g = new Img(W, H);
    part(g, (m, c) => { limb(m, c, 24, 72, 20, 103, 5.5); limb(m, c, 40, 72, 44, 103, 5.5); }, R.son);
    part(g, (m, c) => { m.rect(15, 102, 12, 9, c); m.rect(37, 102, 12, 9, c); }, R.kem);
    torso(g, R.son, { half: 15, end: 74, sashY: 62, flare: 0.04 });
    part(g, (m, c) => { m.ellipse(48, 84, 8, 9, c); m.rect(46, 72, 4, 4, c); }, R.kem);
    for (let i = 0; i < 6; i++) g.set(44 + (i % 3) * 3, 80 + Math.floor(i / 3) * 5, P.sonL);
    arm(g, R.son, [[18, 46], [10, 60], [14, 74]], 3, 5);
    head(g, { hat: 'bald', cy: 30 });
    arm(g, R.son, [[46, 46], [54, 60], [49, 76]], 3, 5);
    return finish(g);
  },
  'wan_2': () => { // Nhị Vạn: cành đào, quả và lá
    const g = new Img(W, H);
    part(g, (m, c) => { limb(m, c, 30, 20, 34, 70, 1.4); limb(m, c, 34, 44, 14, 36, 1.2); limb(m, c, 34, 54, 54, 46, 1.2); }, R.wood);
    [[16, 28, 7, 4, -0.5], [48, 30, 8, 4, 0.5], [32, 14, 8, 4, 0], [12, 62, 7, 3, -0.4], [52, 66, 7, 3, 0.3]].forEach(([x, y, rx, ry]) => part(g, (m, c) => m.ellipse(x, y, rx, ry, c), R.ngoc, { fold: (px, py) => px === x }));
    [[22, 50, 9], [42, 56, 10], [28, 80, 9], [46, 92, 8]].forEach(([x, y, r]) => { part(g, (m, c) => { m.circle(x, y, r, c); m.circle(x + 2, y - 1, r - 1, c); }, R.pink); part(g, (m, c) => m.ellipse(x - 1, y - r - 1, 3, 2, c), R.ngoc); g.set(x - 3, y - 3, P.kem); g.set(x - 3, y - 2, P.kem); });
    return finish(g);
  },
  'sach_5': () => { // Ngũ Sách: thuyền buồm cánh sọc
    const g = new Img(W, H);
    part(g, (m, c) => { rows(m, c, 84, 94, (y) => [6 + (y - 84) * 1.2, 58 - (y - 84) * 1.2]); }, R.wood);
    part(g, (m, c) => m.rect(4, 82, 56, 3, c), R.son);
    part(g, (m, c) => limb(m, c, 30, 12, 30, 84, 1.3), R.wood);
    part(g, (m, c) => rows(m, c, 16, 78, (y) => [32, 32 + 4 + (y - 16) * 0.55]), R.kem, { flat: true });
    part(g, (m, c) => rows(m, c, 30, 78, (y) => [28 - (y - 30) * 0.5, 28]), R.kem, { flat: true });
    for (let x = 33; x < 70; x += 4) for (let y = 16; y < 78; y++) if (x < 36 + (y - 16) * 0.55) g.set(x, y, x % 8 === 1 ? P.sonL : P.son);
    for (let x = 12; x < 28; x += 4) for (let y = 30; y < 78; y++) if (x > 28 - (y - 30) * 0.5) g.set(x, y, P.son);
    part(g, (m, c) => m.rect(32, 6, 12, 5, c), R.son);
    for (let k = 0; k < 3; k++) part(g, (m, c) => { for (let x = 0; x < 64; x++) m.rect(x, 100 + k * 5 + Math.round(Math.sin((x + k * 9) / 4) * 1.4), 1, 3, c); }, R.water);
    return finish(g);
  },
};

module.exports = function genCards2(outDir) {
  let n = 0;
  for (const [name, fn] of Object.entries(cards)) { fn().save(`${outDir}/demo/${name}.png`); n++; }
  return n;
};
if (require.main === module) console.log('Đã tạo', module.exports(require('path').join(__dirname, '..', 'assets')), 'lá demo');
