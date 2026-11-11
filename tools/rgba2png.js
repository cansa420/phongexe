// node tools/rgba2png.js <thô.rgba> <rộng> <cao> <ra.png>  (điểm có alpha rất thấp coi là trong suốt hẳn)
const fs = require('fs');
const zlib = require('zlib');

function writePNG(file, w, h, px) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

if (require.main === module) {
  const [, , src, w, h, out] = process.argv;
  const px = fs.readFileSync(src);
  for (let i = 0; i < px.length; i += 4) if (px[i + 3] < 24) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; }
  writePNG(out, +w, +h, px);
  console.log('đã ghi', out, w + 'x' + h);
}
module.exports = { writePNG };
