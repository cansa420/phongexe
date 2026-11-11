'use strict';
// Chạy mô phỏng hàng loạt: node sim/simulate.js [soVan=300] [file-bang-muc-tieu.json]
// In ra tỉ lệ thắng và số ải vượt qua trung bình của từng kiểu bot.

const fs = require('fs');
const { playRun, POLICIES } = require('../src/bots.js');

const N = parseInt(process.argv[2] || '300', 10);
const tableFile = process.argv[3];
const targetTable = tableFile ? JSON.parse(fs.readFileSync(tableFile, 'utf8')).table : undefined;

const names = Object.keys(POLICIES);
const out = {};
const t0 = Date.now();
for (const name of names) {
  const cleared = new Array(25).fill(0);
  let wins = 0; let sum = 0; const deathAi = new Array(24).fill(0);
  for (let s = 1; s <= N; s++) {
    const r = playRun(name, { seed: s * 7919 + 13, targetTable });
    cleared[r.cleared]++;
    sum += r.cleared; if (r.won) wins++;
    if (!r.won) deathAi[r.cleared]++;
  }
  out[name] = { wins: wins / N, avgCleared: sum / N, cleared, deathAi };
}
console.log(`Mô phỏng ${N} ván/kiểu, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('kiểu'.padEnd(20), 'thắng'.padStart(7), 'ải TB'.padStart(7), '  chết ở ải (1..24)');
for (const name of names) {
  const o = out[name];
  console.log(POLICIES[name].vi.padEnd(20), (o.wins * 100).toFixed(1).padStart(6) + '%', o.avgCleared.toFixed(1).padStart(7), ' ', o.deathAi.map((x) => Math.round((x / N) * 100)).join(' '));
}
