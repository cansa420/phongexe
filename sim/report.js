'use strict';
// Sinh docs/BALANCE.md từ mô phỏng:  node sim/report.js [soVan=400]
const fs = require('fs');
const path = require('path');
const { playRun, POLICIES } = require('../src/bots.js');
const D = {
  targets: require('../src/data/targets.json').table,
  charms: require('../src/data/charms.json'),
  bosses: require('../src/data/bosses.json'),
  config: require('../src/data/config.json'),
};
const N = parseInt(process.argv[2] || '400', 10);
const FOCUSED = ['sanh', 'bo', 'ho', 'yeu'];
const pct = (x, d = 0) => (x * 100).toFixed(d) + '%';

const stats = {}; const passAi = new Array(24).fill(0); const reachAi = new Array(24).fill(0);
const handUse = {}; let handTotal = 0;
const bossStat = {}; const charmWin = {}; const charmOwn = {};
for (const pol of Object.keys(POLICIES)) {
  const st = { wins: 0, cleared: 0, death: new Array(25).fill(0) };
  for (let s = 1; s <= N; s++) {
    const r = playRun(pol, { seed: s * 104729 + 7 });
    st.cleared += r.cleared; if (r.won) st.wins++; else st.death[r.cleared]++;
    if (FOCUSED.includes(pol)) {
      for (const p of r.plays) { handUse[p.type] = (handUse[p.type] || 0) + 1; handTotal++; }
      r.history.forEach((h, i) => {
        reachAi[i]++; if (h.outcome !== 'lose') passAi[i]++;
        if (h.boss) { const b = bossStat[h.boss] || (bossStat[h.boss] = { n: 0, p: 0 }); b.n++; if (h.outcome !== 'lose') b.p++; }
      });
    }
    for (const c of new Set(r.charms)) { charmOwn[c] = (charmOwn[c] || 0) + 1; if (r.won) charmWin[c] = (charmWin[c] || 0) + 1; }
  }
  stats[pol] = st;
}

let md = '# Báo cáo cân bằng (sinh tự động)\n\n';
md += `Sinh bởi \`node sim/report.js ${N}\`. **${N} ván cho mỗi kiểu bot**, hạt giống cố định nên chạy lại ra cùng kết quả.\n\n`;
md += '> Cảnh báo quan trọng: bot chỉ chọn nước đánh có điểm cao nhất và bỏ bài theo quy tắc đơn giản. Nó không biết đổi build giữa chừng, không tính trước trùm, không bán bùa khéo. Người chơi tinh ý sẽ thắng nhiều hơn bot. Hãy coi các con số dưới đây là **mặt bằng thấp**, rồi chỉnh lại bằng ván chơi thật.\n\n';

md += '## Bảng mục tiêu điểm hiện tại\n\n| Chặng | Ải Thường | Ải Lớn | Ải Trùm |\n| --- | --- | --- | --- |\n';
D.targets.forEach((r, i) => { md += `| ${i + 1} | ${r.join(' | ')} |\n`; });
md += '\nQuy tắc sinh bảng: Ải Lớn = 0,52 × điểm trung vị bot đạt được; Ải Thường = 60% Ải Lớn; Ải Trùm = 112% Ải Lớn (chưa kể hiệu ứng cản của trùm).\n\n';

md += '## Kết quả theo kiểu bot\n\n| Kiểu bot | Thắng cả ván | Số ải vượt qua (TB / 24) |\n| --- | --- | --- |\n';
for (const [k, st] of Object.entries(stats)) md += `| ${POLICIES[k].vi} | ${pct(st.wins / N, 1)} | ${(st.cleared / N).toFixed(1)} |\n`;
md += '\nĐọc nhanh: không bùa thì dừng sớm; theo đúng một build thắng nhiều hơn mua ngẫu nhiên. Số thắng của từng build ở bảng trên là mặt bằng thấp vì bot không biết phối bùa và xếp bài như người.\n\n';

md += '## Theo mức độ khó (lá Tạp)\n\n';
md += 'Mục tiêu điểm được chỉnh khi **tắt** lá Tạp (mức nền). Lá Tạp là quân 0 chip, không ghép được bộ nào, lẫn ngẫu nhiên vào bộ bài đầu mỗi ải, số lượng tăng dần theo chặng. Các bảng bên dưới và phần trên dùng mức mặc định **Khó**.\n\n';
md += '| Mức | Lá Tạp | Phu dọc | Bộ giống | Cùng họ | Lá Yêu | Số ải TB (4 build) |\n| --- | --- | --- | --- | --- | --- | --- |\n';
const CFGJ = require('../src/data/config.json').difficultyPresets;
for (const [id, pr] of Object.entries(CFGJ)) {
  const row = []; let cl = 0, runs = 0;
  for (const pol of FOCUSED) {
    let w = 0;
    for (let s2 = 1; s2 <= 200; s2++) { const r = playRun(pol, { seed: s2 * 104729 + 7, difficulty: id }); w += r.won; cl += r.cleared; runs++; }
    row.push(pct(w / 200));
  }
  md += `| ${pr.vi} | ${pr.text.replace('Lá Tạp từ chặng 2, ', '').replace('Không có lá Tạp', 'không có')} | ${row.join(' | ')} | ${(cl / runs).toFixed(1)} |\n`;
}
md += '\nGợi ý: người chơi giỏi hơn bot, nên mức **Khó** là mức mặc định để thử; nếu chơi thật vẫn thấy dễ thì nâng lên Ác mộng, nếu thấy quá gắt thì hạ xuống Thường.\n\n';

const HANDS = require('../src/data/hands.json');
md += '## Bộ được đánh nhiều ít thế nào (4 build gộp, mức Khó)\n\n| Bộ | Điều kiện | Chip × HS gốc | Tỉ lệ lượt đánh |\n| --- | --- | --- | --- |\n';
let sameShare = 0;
for (const h of HANDS) {
  const u = (handUse[h.id] || 0) / (handTotal || 1);
  if (h.sameOf) sameShare += u;
  md += `| ${h.vi} | ${h.desc} | ${h.chips} × ${h.mult} | ${pct(u, 1)} |\n`;
}
md += `\nCác bản **cùng họ** (giống hệt hoặc cùng một họ) chiếm ${pct(sameShare, 1)} số lượt đánh. Mỗi bản cùng màu luôn cao hơn bản khác màu cùng họ (có test tự động \`mọi họ có bản cùng màu\` canh điều này).\n\n`;

md += '## Theo bộ bài khởi đầu\n\nMức độ khó mặc định (Khó). Bộ bài là luật phụ, không phải nâng sức mạnh: mỗi bộ đẩy người chơi về một lối đánh.\n\n';
md += '| Bộ bài | Hiệu lực | Phu dọc | Bộ giống | Cùng họ | Lá Yêu | Số ải TB (4 build) |\n| --- | --- | --- | --- | --- | --- | --- |\n';
for (const [id, dk] of Object.entries(require('../src/data/config.json').decks)) {
  const row = []; let cl = 0, runs = 0;
  for (const pol of FOCUSED) {
    let w = 0;
    for (let s2 = 1; s2 <= 150; s2++) { const r = playRun(pol, { seed: s2 * 104729 + 7, deck: id }); w += r.won; cl += r.cleared; runs++; }
    row.push(pct(w / 150));
  }
  md += `| ${dk.vi} | ${dk.text} | ${row.join(' | ')} | ${(cl / runs).toFixed(1)} |\n`;
}
md += '\n';

md += '## Tỉ lệ qua từng ải (4 build gộp, ván thua thật)\n\n| Chặng | Thường | Lớn | Trùm |\n| --- | --- | --- | --- |\n';
for (let c = 0; c < 8; c++) {
  const cell = (i) => (reachAi[i] ? pct(passAi[i] / reachAi[i]) : '-');
  md += `| ${c + 1} | ${cell(c * 3)} | ${cell(c * 3 + 1)} | ${cell(c * 3 + 2)} |\n`;
}

md += '\n## Tỉ lệ qua theo từng trùm\n\n| Trùm | Hiệu ứng | Lần gặp | Tỉ lệ qua |\n| --- | --- | --- | --- |\n';
const allBoss = [...D.bosses.pool, D.bosses.final];
for (const b of allBoss) {
  const s = bossStat[b.id]; if (!s) continue;
  md += `| ${b.vi} | ${b.text} | ${s.n} | ${pct(s.p / s.n)} |\n`;
}

md += '\n## Tỉ lệ thắng khi cuối ván có sở hữu bùa (tham khảo, bị nhiễu vì bùa mạnh thường là bùa cuối ván)\n\n| Bùa | Độ hiếm | Build | Số ván sở hữu (cả 6 kiểu bot) | Thắng khi sở hữu |\n| --- | --- | --- | --- | --- |\n';
const rows = D.charms.map((c) => ({ c, own: charmOwn[c.id] || 0, win: charmWin[c.id] || 0 })).sort((a, b) => (b.win / (b.own || 1)) - (a.win / (a.own || 1)));
for (const r of rows) md += `| ${r.c.vi} | ${r.c.rarity} | ${r.c.build} | ${r.own} | ${r.own ? pct(r.win / r.own) : '-'} |\n`;

md += '\n## Việc cần làm tiếp về cân bằng\n\n';
md += '- Chơi thử bằng người thật 10–20 ván, ghi lại bùa nào "đã", bùa nào chán, rồi đối chiếu bảng trên.\n';
md += '- Build mạnh nhất và yếu nhất cách nhau nhiều lần (xem bảng thắng ở trên). Bot **Bộ giống** thường yếu vì bot chỉ biết giữ đôi, chưa biết phối Khàn, Thiên Khai; người chơi giỏi hơn bot.\n';
md += '- Sảnh (phu dọc) là lối chơi dễ ra nhất ở bộ bài 120 lá, còn Tôm, Lèo, Tam Yêu rất hiếm nhưng điểm rất cao: cần xem người chơi thật có thấy "trúng số" hay không.\n';
md += '- Chặng 7 và 8 vẫn là chỗ tụt ở mức Dễ (xem tỉ lệ qua từng ải). Có thể thêm một nguồn nhân hệ số cuối ván.\n';
md += '- Trùm khắc build: **Thủy Quái Đứt Dây** khắc Phu dọc, **Cáo Chín Đuôi** khắc Bộ giống, **Giặc Cửu Yêu** khắc Lá Yêu, **Quỷ Nhuộm** khắc Cùng họ. Màn Chợ đã báo trước trùm của chặng.\n';
md += '- Mỗi lần đổi bùa, bộ hoặc trùm: chạy lại `node sim/calibrate.js 250 3 0.52` rồi `node sim/report.js`.\n';
fs.writeFileSync(path.join(__dirname, '../docs/BALANCE.md'), md);
console.log(md);
