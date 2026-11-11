// Sinh khung giao diện pixel có góc cắt chéo (giống khung lá bài) cho panel và nút -> assets/frames/ui/*.png
// Dùng 9 ô cắt (border-image) nên co giãn theo mọi kích cỡ. Nền ngoài góc cắt trong suốt.
const fs = require('fs');
const { writePNG } = require('./rgba2png.js');

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const C = { den: '#191b1f', cham: '#293C4A', chamD: '#232f39', chamL: '#45545c', son: '#963F38', sonL: '#aa665b', sonD: '#5e2f2d', ngocL: '#76b7a9', ngoc: '#45a79e', vang: '#B99A60', vangD: '#716143', vangL: '#d3c09d', kem: '#e7dcc2', inner: '#161d23' };

function frame(name, N, c, layers, fill, bevel) {
  const px = Buffer.alloc(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const edge = Math.min(x, y, N - 1 - x, N - 1 - y);
    const cd = Math.min(x + y - c, (N - 1 - x) + y - c, x + (N - 1 - y) - c, (N - 1 - x) + (N - 1 - y) - c);
    const d = Math.min(edge, cd);
    if (d < 0) continue;
    let col = d < layers.length ? layers[d] : fill;
    if (bevel && d >= layers.length) {
      if (y === layers.length) col = bevel.hi; else if (y >= N - 2 - layers.length && y <= N - 1 - layers.length) col = bevel.lo;
    }
    const o = (y * N + x) * 4; const k = hex(col); px[o] = k[0]; px[o + 1] = k[1]; px[o + 2] = k[2]; px[o + 3] = 255;
  }
  fs.mkdirSync('assets/frames/ui', { recursive: true });
  writePNG(`assets/frames/ui/${name}.png`, N, N, px);
}

// panel: viền đen, đường vàng, vạch tối trong, nền; cắt chéo 3 ô
const panel = (name, fill, edge = C.vang) => frame(name, 16, 3, [C.den, edge, C.inner], fill);
panel('p_dark', C.chamD); panel('p_blue', C.cham); panel('p_red', C.sonD, C.sonL); panel('p_gold', C.vang, C.vangL); panel('p_teal', C.ngocL, C.kem); panel('p_rose', C.sonL, C.kem);
// nút: không viền đen. Chỉ có đường vàng ngoài cùng rồi mặt nút có vạch sáng trên / tối dưới; cắt chéo 2 ô
const btn = (name, fill, edge, hi, lo) => frame(name, 12, 2, [edge], fill, { hi, lo, lo2: lo });
btn('b_play', C.son, C.vang, C.sonL, C.sonD); btn('b_blue', C.cham, C.vang, C.chamL, C.chamD); btn('b_gold', C.vang, C.vangL, C.vangL, C.vangD);
btn('b_teal', C.ngoc, C.vang, C.ngocL, '#316865');
btn('b_grey', C.chamL, C.vangD, '#5b6a72', C.chamD); btn('b_red', C.sonL, C.vangL, '#c28a80', C.son);
console.log('đã ghi khung vào assets/frames/ui/');