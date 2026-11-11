'use strict';
// Chỉnh bảng mục tiêu điểm theo mô phỏng:  node sim/calibrate.js [soVan=200] [soLanLapMoiChang=3] [kappa=0.5]
//
// Cách làm, lần lượt từng chặng 1 -> 8 (khoá chặng trước rồi mới chỉnh chặng sau):
//  1. Bot theo 4 build chơi N ván mỗi build. Các chặng trước dùng mục tiêu đã chốt (thua thật).
//     Từ đầu chặng đang chỉnh, ván chạy ở chế độ "ghost": không thua, không dừng sớm, nên ta đo được
//     điểm bot THỰC SỰ đạt ở từng ải của chặng đó.
//  2. Ải Lớn = kappa x điểm trung vị bot đạt được (kappa càng cao càng khó). Ải Thường = 60% Ải Lớn,
//     Ải Trùm = 112% Ải Lớn (trùm còn cản điểm bằng hiệu ứng riêng nên thực tế khó hơn nhiều).
//     Dùng trung vị thay vì phân vị đuôi vì trung vị ổn định, đuôi bị nhiễu bởi vài ván yếu.
//  3. Lặp vài lần vì mục tiêu ảnh hưởng nhịp bỏ bài của bot.
// Kết quả ghi vào src/data/targets.json. Chạy lại mỗi khi đổi bùa, bộ, trùm hoặc luật.

const fs = require('fs');
const path = require('path');
const { playRun } = require('../src/bots.js');

const N = parseInt(process.argv[2] || '200', 10);
const ITER = parseInt(process.argv[3] || '3', 10);
const KAPPA = parseFloat(process.argv[4] || '0.52');
// Mục tiêu điểm được chỉnh khi TẮT quân Tạp: đó là mức nền. Quân Tạp (config.difficulty.junk) cộng thêm độ khó lên trên.
const NO_JUNK = { difficulty: { junk: { max: 0 } } };
const FOCUSED = ['sanh', 'bo', 'ho', 'yeu'];
const FILE = path.join(__dirname, '../src/data/targets.json');

const THUONG_RATIO = 0.6; // Ải Thường nhẹ hơn để người chơi lấy đà
const TRUM_RATIO = 1.12; // Ải Trùm cao hơn Ải Lớn một chút (và còn bị trùm cản điểm)

let table = JSON.parse(fs.readFileSync(FILE, 'utf8')).table.map((r) => r.slice());

function nice(x) {
  if (x < 100) return Math.round(x / 5) * 5;
  if (x < 1000) return Math.round(x / 10) * 10;
  if (x < 10000) return Math.round(x / 50) * 50;
  return Math.round(x / 100) * 100;
}
const median = (arr) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };

function potential(tbl, c) {
  // trả về mảng 3 phần tử: điểm đạt được ở 3 ải của chặng c (0-based) của các ván còn sống tới đó
  const res = [[], [], []];
  for (const pol of FOCUSED) {
    for (let s = 1; s <= N; s++) {
      const r = playRun(pol, { seed: s * 104729 + 7, targetTable: tbl, ghostFrom: c * 3, stopAfterChang: c + 1, config: NO_JUNK });
      for (const sc of r.scores) if (sc.chang === c + 1) res[sc.aiIdx].push(sc.score);
    }
  }
  return res;
}

function measure(tbl) {
  const reached = new Array(24).fill(0); const pass = new Array(24).fill(0);
  let wins = 0; let total = 0; const perPol = {};
  for (const pol of [...FOCUSED, 'random', 'none']) {
    let w = 0;
    for (let s = 1; s <= N; s++) {
      const r = playRun(pol, { seed: s * 104729 + 7, targetTable: tbl, config: NO_JUNK });
      total++; if (r.won) { wins++; w++; }
      if (FOCUSED.includes(pol)) r.history.forEach((h, i) => { reached[i]++; if (h.outcome !== 'lose') pass[i]++; });
    }
    perPol[pol] = w / N;
  }
  return { reached, pass, perPol };
}

for (let c = 0; c < 8; c++) {
  for (let it = 1; it <= ITER; it++) {
    const pot = potential(table, c);
    const prev = c === 0 ? 0 : table[c - 1][2];
    if (pot[1].length >= 30) {
      const L = KAPPA * median(pot[1]);
      table[c][1] = L; table[c][0] = L * THUONG_RATIO; table[c][2] = L * TRUM_RATIO;
    }
    const raw = table[c].slice();
    table[c][0] = Math.max(table[c][0], prev * 1.05);
    table[c][1] = Math.max(table[c][1], table[c][0] * 1.3);
    table[c][2] = Math.max(table[c][2], table[c][1] * 1.05);
    table[c] = table[c].map(nice);
    console.log(`chặng ${c + 1} lần ${it}: ${pot.map((a) => a.length).join('/')} ván còn sống, trước làm tròn ${raw.map(Math.round).join(' / ')} → ${table[c].join(' / ')}`);
  }
}

const m = measure(table);
console.log('\nKiểm tra lại bằng ván thật (thua thật), tỉ lệ thắng cả ván:');
console.log(Object.entries(m.perPol).map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join('  '));
console.log('Tỉ lệ qua từng ải (4 build gộp):');
console.log(m.pass.map((p, i) => (m.reached[i] ? Math.round((100 * p) / m.reached[i]) : '-')).join(' '));

fs.writeFileSync(FILE, JSON.stringify({
  _note: 'Sinh bởi sim/calibrate.js từ mô phỏng bot theo 4 build. Chạy lại script sau khi đổi bùa hoặc luật.',
  table,
}, null, 2) + '\n');
console.log('\n' + table.map((r, i) => `Chặng ${i + 1}: ${r.join(' / ')}`).join('\n'));
