'use strict';
// Phông số 3x5 dùng chung cho nhãn icon và dòng mã rơi trên nền Rừng Mã Nguồn
const F = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
module.exports = function drawGlyph(img, ch, x, y, c) { const bm = F[ch]; if (!bm) return; for (let i = 0; i < 15; i++) if (bm[i] === '1') img.set(x + (i % 3), y + Math.floor(i / 3), c); };
