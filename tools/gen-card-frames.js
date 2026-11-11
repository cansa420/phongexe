// Vẽ lại khung 3 họ (Văn, Sách, Vạn) bằng mã: sạch, không nét đen, không lốm đốm -> assets/frames/{van,sach,wan}.png (lưới 64 x 134)
// Bố cục khớp CSS lá bài: dải tên y 3..21, thân kem y 22..111 (khung tranh y 25..109), dải chân y 112..130, viền vàng 3 ô quanh lá, góc cắt chéo.
const { writePNG } = require('./rgba2png.js');

const W = 64, H = 134, CUT = 3;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const GOLD = ['#e0b46a', '#c89a55', '#8f6a36'];
const SUITS = {
  van: { band: '#933f39', hi: '#b3584e', lo: '#5e2f2d', line: '#b3584e' },
  sach: { band: '#45a79e', hi: '#76b7a9', lo: '#316865', line: '#45a79e' },
  wan: { band: '#2f4352', hi: '#52656f', lo: '#1f2d38', line: '#52656f' },
};
const mix = (a, b, t) => { const p = hex(a), q = hex(b); return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const CREAM = '#ebdcbf', CREAM_HI = '#f4e9d0', CREAM_LO = '#d9c8a3', CREAM_EDGE = '#dfcea9';

function build(name, s) {
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    const cd = Math.min(x + y - CUT, (W - 1 - x) + y - CUT, x + (H - 1 - y) - CUT, (W - 1 - x) + (H - 1 - y) - CUT);
    const d = Math.min(edge, cd);
    if (d < 0) continue;
    let col;
    if (d < 3) col = GOLD[d];
    else if (y <= 21) col = y === 3 ? mix(s.band, s.hi, 0.6) : y === 21 ? mix(s.band, s.lo, 0.45) : s.band;
    else if (y >= 112) col = y === 112 ? mix(s.band, s.hi, 0.35) : y === 130 ? mix(s.band, s.lo, 0.45) : s.band;
    else {
      // thân kem phẳng, chỉ đổi sắc rất nhẹ theo chiều dọc (không có vạch, đốm hay khung tranh)
      const t = (y - 22) / 90; const shade = Math.round(t * 4);
      const base = hex(CREAM); col = '#' + base.map((v, i) => Math.max(0, v - shade * (i === 2 ? 3 : 2)).toString(16).padStart(2, '0')).join('');
    }
    const o = (y * W + x) * 4, k = hex(col); px[o] = k[0]; px[o + 1] = k[1]; px[o + 2] = k[2]; px[o + 3] = 255;
  }
  writePNG(`assets/frames/${name}.png`, W, H, px);
}
for (const [n, s] of Object.entries(SUITS)) build(n, s);
console.log('đã vẽ khung van, sach, wan');
