// Vẽ icon mũi tên pixel ">>" (nút Tiếp tục) -> assets/icons/tiep_tuc.png (lưới 24 x 24, phóng 4 lần = 96 x 96)
const { writePNG } = require('./rgba2png.js');
const N = 24, K = 4;
const grid = Array.from({ length: N }, () => new Array(N).fill(0)); // 0 trống, 1 viền, 2 tô
const inChev = (x, y, ox) => { const d = Math.abs(y - 12); if (d > 9) return false; const x0 = ox + 9 - d; return x >= x0 && x <= x0 + 3; };
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inChev(x, y, 1) || inChev(x, y, 10)) grid[y][x] = 2;
const fill = JSON.parse(JSON.stringify(grid));
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  if (fill[y][x]) continue;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = fill[y + dy] && fill[y + dy][x + dx]; if (a === 2) { grid[y][x] = 1; break; } }
}
const col = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const C = { line: col('#191b1f'), hi: col('#d3c09d'), mid: col('#b99a60'), lo: col('#716143') };
const W = N * K, out = Buffer.alloc(W * W * 4);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const v = grid[y][x]; if (!v) continue;
  let c = C.line;
  if (v === 2) { const up = !grid[y - 1] || grid[y - 1][x] !== 2, dn = !grid[y + 1] || grid[y + 1][x] !== 2; c = up ? C.hi : dn ? C.lo : C.mid; }
  for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const o = ((y * K + j) * W + x * K + i) * 4; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255; }
}
writePNG('assets/icons/tiep_tuc.png', W, W, out);
console.log('đã ghi assets/icons/tiep_tuc.png');
