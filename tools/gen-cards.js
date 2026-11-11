'use strict';
// 30 hình lá bài TẠM (48x56 px, nền trong suốt). Họa sĩ vẽ lại và thay đúng tên tệp trong assets/cards/.
const { Img, P, mix } = require('./pix');

const COL = {
  van: [P.son, P.sonD, P.sonL],
  sach: [P.ngoc, P.ngocD, P.ngocL],
  wan: [mix(P.chamL, P.kem, 0.2), P.chamL, mix(P.chamL, P.kem, 0.5)],
};

// mô tả từng lá theo chủ đề bài Tổ tôm cổ (xem docs/HANDOFF.md mục 4)
const SPEC = {
  'wan-1': { legs: 'stand', arms: 'up', hat: 'bun', prop: 'ribbon', long: true },
  'wan-2': { obj: 'peach' },
  'wan-3': { legs: 'stand', arms: 'side', hat: 'bun', prop: 'cone', long: true },
  'wan-4': { legs: 'run', arms: 'hold', hat: 'khan', prop: 'cart' },
  'wan-5': { obj: 'tower' },
  'wan-6': { legs: 'stand', arms: 'shoulder', hat: 'nonla', prop: 'hoe' },
  'wan-7': { legs: 'stand', arms: 'hold', hat: 'khan', prop: 'bowl' },
  'wan-8': { obj: 'carp' },
  'wan-9': { legs: 'stand', arms: 'shoulder', hat: 'khan', prop: 'chest' },
  'wan-10': { legs: 'stand', arms: 'down', hat: 'bald', prop: 'staff', beard: true },
  'sach-1': { legs: 'stand', arms: 'hip', hat: 'khan' },
  'sach-2': { legs: 'stand', arms: 'down', hat: 'bald', beard: true, cloak: true },
  'sach-3': { legs: 'stand', arms: 'carry', hat: 'nonla', prop: 'bundles' },
  'sach-4': { legs: 'kneel', arms: 'hold', hat: 'bun', prop: 'tray' },
  'sach-5': { obj: 'boat' },
  'sach-6': { legs: 'stand', arms: 'hold', hat: 'khan', prop: 'baby' },
  'sach-7': { legs: 'stand', arms: 'hold', hat: 'bun', prop: 'platter', long: true },
  'sach-8': { legs: 'sit', arms: 'hold', hat: 'bun', prop: 'fan' },
  'sach-9': { legs: 'stand', arms: 'shoulder', hat: 'khan', prop: 'lantern' },
  'sach-10': { legs: 'stand', arms: 'hold', hat: 'bun', prop: 'baby', long: true },
  'van-1': { legs: 'stand', arms: 'down', hat: 'bun', prop: 'fan', long: true },
  'van-2': { legs: 'stand', arms: 'shoulder', hat: 'khan', prop: 'sack' },
  'van-3': { legs: 'stand', arms: 'down', hat: 'khan', prop: 'stickbag' },
  'van-4': { legs: 'stand', arms: 'hold', hat: 'khan', prop: 'box' },
  'van-5': { legs: 'stand', arms: 'hip', hat: 'nonla' },
  'van-6': { legs: 'run', arms: 'shoulder', hat: 'khan', prop: 'lantern' },
  'van-7': { legs: 'stand', arms: 'hold', hat: 'khan', prop: 'bottle' },
  'van-8': { legs: 'stilt', arms: 'down', hat: 'tufts' },
  'van-9': { legs: 'stand', arms: 'shoulder', hat: 'khan', prop: 'ladder' },
  'van-10': { legs: 'stand', arms: 'down', hat: 'khan', prop: 'maces', big: true },
};

function object(kind, suit) {
  const g = new Img(48, 56); const [c1, c2, c3] = COL[suit];
  const waves = (y) => { for (let x = 4; x < 44; x += 8) { g.rect(x, y, 5, 1, P.ngocL); g.rect(x + 3, y + 2, 5, 1, P.ngoc); } };
  if (kind === 'peach') {
    g.line(5, 52, 22, 36, P.vangD); g.line(6, 52, 23, 36, P.vangD); g.line(22, 36, 40, 14, P.vangD); g.line(23, 36, 41, 14, P.vangD);
    g.line(22, 36, 34, 40, P.vangD); g.line(30, 24, 18, 18, P.vangD); g.line(36, 18, 42, 26, P.vangD);
    [[40, 12], [30, 24], [18, 17], [34, 40], [42, 26], [24, 34], [12, 46]].forEach(([x, y]) => { g.circle(x, y, 3, c3); g.set(x, y, P.vang); });
    [[36, 20], [26, 30], [14, 22], [28, 42]].forEach(([x, y]) => g.ellipse(x, y, 2, 1, P.ngoc));
  } else if (kind === 'tower') {
    g.rect(14, 52, 20, 2, c2);
    for (let i = 0; i < 5; i++) {
      const y = 46 - i * 8; const w = 20 - i * 3;
      g.rect(24 - Math.floor(w / 2) + 1, y, w - 2, 6, i % 2 ? c3 : c1); g.rect(24 - Math.floor(w / 2) + 2, y + 2, 2, 3, P.den);
      g.rect(24 - Math.floor(w / 2) - 3, y - 2, w + 6, 2, c2); g.set(24 - Math.floor(w / 2) - 4, y - 3, c2); g.set(24 + Math.floor(w / 2) + 3, y - 3, c2);
    }
    g.line(24, 6, 24, 0, P.vang); g.rect(23, 1, 3, 1, P.vang);
  } else if (kind === 'carp') {
    g.ellipse(24, 26, 13, 8, P.vang); g.tri(11, 26, 12, 8, P.vang); g.rect(4, 20, 9, 12, null); g.tri(9, 17, 12, 8, P.vangL);
    g.line(34, 26, 40, 20, P.vangD); g.line(34, 27, 40, 33, P.vangD); g.ellipse(33, 26, 2, 5, P.vangD);
    for (let y = 21; y < 32; y += 3) for (let x = 14 + (y % 2) * 2; x < 32; x += 4) g.set(x, y, P.sonL);
    g.set(33, 22, P.den); g.set(33, 23, P.kem); g.rect(14, 33, 6, 1, P.vangD); waves(40); waves(46);
  } else if (kind === 'boat') {
    for (let j = 0; j < 6; j++) g.rect(8 + j, 40 + j, 32 - j * 2, 1, j < 2 ? c1 : c2);
    g.rect(7, 38, 34, 2, c3); g.line(24, 8, 24, 40, P.vangD); g.line(25, 8, 25, 40, P.vangD);
    g.tri(24, 10, 20, 26, P.kem); g.rect(25, 10, 16, 0, null); g.tri(14, 20, 12, 18, P.kemD); g.set(24, 7, c1); g.rect(25, 7, 4, 3, c1); waves(48);
  }
  g.shade((c) => (c === P.kem ? P.kemD : null));
  g.outline(P.den); return g;
}

function figure(sp, suit) {
  if (sp.obj) return object(sp.obj, suit);
  const g = new Img(48, 56); const [c1, c2, c3] = COL[suit]; const pants = mix(P.den, c1, 0.35);
  const dy = sp.legs === 'sit' || sp.legs === 'kneel' ? 6 : 0;
  const R = (x, y, w, h, c) => g.rect(x, y + dy, w, h, c);
  const L = (x0, y0, x1, y1, c, t = 1) => { for (let k = 0; k < t; k++) g.line(x0 + k, y0 + dy, x1 + k, y1 + dy, c); };
  const C = (x, y, r, c) => g.circle(x, y + dy, r, c);
  const E = (x, y, rx, ry, c) => g.ellipse(x, y + dy, rx, ry, c);
  const half = sp.big ? 9 : 7;

  // ---- vật ở phía sau người
  if (sp.prop === 'hoe') { L(14, 40, 34, 8, P.vangD, 2); R(30, 6, 7, 3, P.kemD); }
  if (sp.prop === 'ladder') { L(35, 52, 34, 0, P.vangD, 2); L(41, 52, 40, 0, P.vangD, 2); for (let y = 4; y < 52; y += 6) R(35, y, 8, 2, P.vangD); }
  if (sp.prop === 'sack') { E(33, 17, 8, 8, P.kemD); R(30, 7, 5, 3, P.kemD); R(31, 8, 3, 1, P.vangD); }
  if (sp.prop === 'chest') { R(27, 10, 17, 11, P.vangD); R(27, 14, 17, 2, P.vang); R(34, 12, 3, 5, P.vangL); }
  if (sp.prop === 'bundles') { L(4, 20, 44, 20, P.vangD, 1); R(4, 21, 8, 10, P.kem); R(5, 25, 6, 1, P.vangD); R(36, 21, 8, 10, P.kem); R(37, 25, 6, 1, P.vangD); }
  if (sp.prop === 'stickbag') { L(37, 52, 35, 14, P.vangD, 2); R(30, 8, 10, 8, P.kem); R(33, 7, 4, 2, P.vangD); R(31, 12, 8, 1, P.vangD); }
  if (sp.prop === 'staff') { L(37, 52, 37, 14, P.vangD, 2); C(38, 13, 2, P.vang); }
  if (sp.prop === 'maces') { L(12, 40, 9, 8, P.vangD, 2); L(37, 40, 40, 8, P.vangD, 2); C(10, 8, 5, P.kemD); C(41, 8, 5, P.kemD); [[10, 2], [5, 8], [15, 8], [41, 2], [36, 8], [46, 8]].forEach(([x, y]) => R(x, y, 1, 1, P.kem)); }

  // ---- chân
  if (sp.legs === 'stand') { R(19, 40, 4, 11, pants); R(26, 40, 4, 11, pants); R(17, 50, 6, 3, P.den); R(26, 50, 6, 3, P.den); }
  if (sp.legs === 'run') { L(21, 40, 14, 51, pants, 3); L(27, 40, 34, 49, pants, 3); R(11, 50, 6, 3, P.den); R(33, 48, 6, 3, P.den); }
  if (sp.legs === 'kneel') { R(16, 42, 16, 4, pants); R(30, 44, 4, 7, pants); R(14, 46, 6, 3, P.den); }
  if (sp.legs === 'sit') { R(18, 40, 14, 4, pants); R(30, 41, 12, 4, pants); R(41, 43, 4, 3, P.den); R(18, 44, 5, 8, pants); R(17, 51, 7, 2, P.den); }
  if (sp.legs === 'stilt') { R(19, 40, 11, 4, pants); R(19, 44, 2, 12, P.vangD); R(28, 44, 2, 12, P.vangD); R(16, 46, 6, 2, P.vangD); R(27, 46, 6, 2, P.vangD); }

  // ---- thân
  const end = sp.long ? 49 : 39;
  for (let y = 22; y <= end; y++) {
    const h = half + Math.floor((y - 22) / (sp.long ? 4 : 6));
    R(24 - h, y, h * 2, 1, c1);
  }
  R(24 - half, 22, half * 2, 2, c3); R(23, 22, 2, end - 22, c2);
  if (!sp.long) R(24 - half, 34, half * 2, 2, c2);
  if (sp.cloak) { R(24 - half - 1, 24, 3, 16, c2); R(24 + half - 2, 24, 3, 16, c2); }
  if (sp.long) R(18, 49, 12, 3, P.den);

  // ---- đầu
  R(22, 19, 5, 3, P.skinD); C(24, 15, 5, P.skin);
  R(22, 15, 1, 1, P.den); R(26, 15, 1, 1, P.den); R(23, 18, 3, 1, P.sonL);
  if (sp.hat === 'bald') R(21, 10, 7, 1, P.kem);
  if (sp.hat === 'nonla') { g.tri(24, 2 + dy, 30, 11, P.vang); R(10, 12, 28, 1, P.vangD); L(19, 13, 20, 19, P.kemD); L(30, 13, 29, 19, P.kemD); for (let y = 5; y < 12; y += 3) R(24 - Math.floor((y - 2) * 1.4 / 2), y, Math.floor((y - 2) * 1.4), 1, P.vangL); }
  if (sp.hat === 'khan') { E(24, 9, 6, 3, P.den); R(18, 11, 13, 2, P.vangD); }
  if (sp.hat === 'bun') { R(19, 10, 11, 3, P.den); R(19, 12, 2, 6, P.den); R(28, 12, 2, 6, P.den); C(24, 7, 3, P.den); R(23, 5, 1, 1, P.kemD); }
  if (sp.hat === 'tufts') { R(19, 10, 11, 3, P.den); C(18, 8, 2, P.den); C(30, 8, 2, P.den); }
  if (sp.beard) { R(20, 19, 9, 5, P.kem); R(22, 24, 5, 2, P.kem); R(21, 17, 3, 1, P.kem); R(25, 17, 3, 1, P.kem); }

  // ---- tay
  const arm = (x0, y0, x1, y1) => { L(x0, y0, x1, y1, c1, 3); C(x1 + 1, y1, 1, P.skin); };
  switch (sp.arms) {
    case 'down': R(24 - half - 3, 24, 3, 11, c1); R(24 + half, 24, 3, 11, c1); R(24 - half - 3, 35, 3, 3, P.skin); R(24 + half, 35, 3, 3, P.skin); break;
    case 'hip': arm(17, 24, 12, 29); arm(31, 24, 36, 29); break;
    case 'up': arm(17, 24, 11, 12); arm(31, 24, 37, 12); break;
    case 'side': arm(17, 24, 14, 34); arm(31, 24, 35, 31); break;
    case 'hold': arm(17, 24, 21, 33); arm(31, 24, 27, 33); break;
    case 'carry': arm(17, 24, 10, 20); arm(31, 24, 38, 20); break;
    case 'shoulder': R(24 - half - 3, 24, 3, 11, c1); R(24 - half - 3, 35, 3, 3, P.skin); arm(31, 24, 35, 17); break;
    default: break;
  }

  // ---- vật ở phía trước
  if (sp.prop === 'lantern') { L(36, 18, 36, 28, P.den, 1); R(33, 28, 7, 9, P.vang); R(33, 28, 7, 2, P.den); R(33, 35, 7, 2, P.den); R(35, 30, 3, 4, P.vangL); R(33, 32, 7, 1, P.sonL); }
  if (sp.prop === 'bowl') { R(19, 31, 11, 3, P.kem); R(21, 34, 7, 2, P.kemD); R(20, 29, 9, 2, P.sonL); }
  if (sp.prop === 'tray') { R(10, 38, 28, 2, P.vangD); C(16, 36, 2, P.sonL); R(22, 34, 6, 4, P.kem); R(30, 35, 4, 3, P.ngocL); }
  if (sp.prop === 'platter') { E(24, 36, 11, 2, P.vang); E(24, 33, 6, 3, P.sonL); R(23, 29, 2, 2, P.vangL); }
  if (sp.prop === 'box') { R(17, 30, 14, 9, P.vangD); R(17, 33, 14, 2, P.vang); R(23, 31, 2, 5, P.vangL); }
  if (sp.prop === 'bottle') { R(25, 29, 4, 10, P.ngocL); R(26, 25, 2, 4, P.ngocL); R(26, 24, 2, 1, P.vangD); R(26, 32, 2, 3, P.kem); }
  if (sp.prop === 'baby') { C(28, 28, 3, P.skin); R(26, 31, 8, 8, P.kem); R(25, 27, 6, 2, P.den); R(27, 34, 6, 1, P.sonL); }
  if (sp.prop === 'fan') { E(34, 30, 6, 5, P.kem); L(34, 36, 34, 40, P.vangD, 1); [[30, 28], [34, 26], [38, 28]].forEach(([x, y]) => R(x, y, 1, 4, P.sonL)); }
  if (sp.prop === 'cone') { g.tri(35, 24 + dy, 10, 6, P.vang); R(30, 30, 11, 1, P.vangD); }
  if (sp.prop === 'ribbon') { for (let t = 0; t < 26; t++) { R(36 + t * 0.4, 12 + Math.sin(t / 2.4) * 4 + t * 0.2, 2, 2, t % 2 ? c3 : P.vang); } }
  if (sp.prop === 'cart') { R(24, 29, 20, 8, P.vangD); R(24, 31, 20, 2, P.vang); C(36, 42, 5, P.den); C(36, 42, 3, P.vang); C(36, 42, 1, P.den); L(24, 33, 18, 31, P.vangD, 1); }

  g.shade((c) => (c === P.skin ? P.skinD : c === P.kem ? P.kemD : c === P.vang ? P.vangD : c === c1 ? c2 : c === c3 ? c1 : null));
  g.outline(P.den); return g;
}

function junk() {
  const g = new Img(48, 56);
  g.ellipse(24, 30, 14, 12, P.chamL);
  for (let i = 0; i < 70; i++) { const x = 8 + ((i * 37) % 32); const y = 18 + ((i * 53) % 24); if (g.get(x, y)) g.set(x, y, i % 3 ? P.cham : P.kemD); }
  g.line(16, 22, 32, 38, P.kem, 1); g.line(32, 22, 16, 38, P.kem, 1);
  g.rect(8, 28, 32, 2, P.son); g.rect(12, 34, 20, 1, P.ngoc);
  g.outline(P.den); return g;
}

const tall = (img) => { const t = new Img(48, 88); t.blit(img, 0, 16); return t; };
module.exports = function genCards(outDir) {
  let n = 0;
  for (const suit of ['van', 'sach', 'wan']) for (let r = 1; r <= 10; r++) { tall(figure(SPEC[`${suit}-${r}`], suit)).save(`${outDir}/cards/${suit}_${r}.png`); n++; }
  tall(junk()).save(`${outDir}/cards/junk.png`);
  return n;
};
