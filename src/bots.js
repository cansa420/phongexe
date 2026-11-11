'use strict';
// Bot chơi thử để mô phỏng cân bằng. Bot KHÔNG giỏi bằng người chơi tinh ý:
// nó chỉ chọn nước đánh có điểm cao nhất (tính cả bùa) và bỏ bài theo "độ đáng giữ" của từng build.

const { Run, CH, AN, R, charmDefs } = require('./engine.js');

const FILLER = ['danh_them', 'tay_dai', 'bo_them', 'len_hang', 'kho_bai', 'phao_cuu_sinh', 'thang_hang_may', 'nhat_ve_chai', 'heo_dat'];
const PHU_ORDER = ['them_luot', 'gia_re', 'them_bo', 'lai_day', 'cho_rong'];

const POLICIES = {
  none: { vi: 'Không bùa', buy: false },
  random: { vi: 'Mua ngẫu nhiên', random: true },
  sanh: {
    vi: 'Phu dọc (sảnh)',
    prefer: ['tang_dan', 'noi_lien', 'cong_don_sanh', 'sanh_dai', 'thong_suot', 'bi_ngu', ...FILLER],
    que: ['run5_same', 'run4_same', 'run3_same', 'run5', 'flush5'],
    keepFn: 'sanh',
    core: ['n3', 'n4', 'n5', 'n6', 'n7', 'n8'], enh: ['n4', 'n5', 'n6', 'n7'], skip: true,
    than: ['ban_sao', 'them_cho_ngoi', 'nhat_thong'],
  },
  bo: {
    vi: 'Bộ giống (đôi, ba, tứ)',
    prefer: ['co_doi', 'cung_so_khac_ho', 'cu_lu_no_ro', 'khan_manh', 'doi_trong', 'tu_quy_hoi_tu', ...FILLER],
    que: ['five', 'four', 'full', 'three', 'two_pair', 'pair_mixed'],
    keep: {},
    core: ['n8', 'n9', 'n10'], enh: ['n8', 'n9', 'n10'], skip: true,
    than: ['ban_sao', 'them_cho_ngoi', 'nhat_thong'],
  },
  ho: {
    vi: 'Cùng họ',
    prefer: ['mot_ho', 'ho_van', 'ho_sach', 'ho_wan', 'du_ba_ho', 'dong_tong', ...FILLER],
    que: ['flush5', 'full', 'run5_same', 'run4_same', 'three', 'two_pair', 'pair_mixed', 'run3_same'],
    keepFn: 'ho',
    core: ['n7', 'n8', 'n9', 'n10'], enh: ['n7', 'n8', 'n9', 'n10'], skip: true,
    than: ['nhat_thong', 'ban_sao', 'them_cho_ngoi'],
  },
  yeu: {
    vi: 'Lá Yêu',
    prefer: ['me_yeu', 'yeu_di_dau', 'yeu_giu_nha', 'goi_them_yeu', 'ba_yeu_hoi_tu', 'tom_leo_mo_duong', 'yeu_nang_ky', ...FILLER],
    que: ['tam_yeu', 'leo', 'tom', 'three', 'pair_mixed'],
    keep: { n10: 8 },
    core: ['n10'], enh: ['n10'], skip: true,
    than: ['ban_sao', 'nhat_thong', 'them_cho_ngoi'],
  },
};

const isXmult = (c) => charmDefs[c.id].noCopy && !charmDefs[c.id].than;

// Xếp bùa: bùa cộng trước, bùa nhân sau, Bản Sao đứng ngay trước bùa cộng đầu tiên có hiệu ứng tính điểm.
function arrange(run, pol) {
  const rank = (c) => (pol && pol.prefer ? (pol.prefer.indexOf(c.id) + 1 || 99) : 99);
  const ch = run.charms.slice();
  const others = ch.filter((c) => charmDefs[c.id].than && c.id !== 'ban_sao');
  const bs = ch.filter((c) => c.id === 'ban_sao');
  const add = ch.filter((c) => !isXmult(c) && !charmDefs[c.id].than).sort((a, b) => rank(a) - rank(b));
  const hasHook = (c) => { const d = charmDefs[c.id]; return d.perCard || d.perHeld || d.onHand; };
  const firstHook = add.findIndex(hasHook);
  if (firstHook > 0) add.unshift(...add.splice(firstHook, 1));
  const xs = ch.filter(isXmult);
  run.charms = [...others, ...bs, ...add, ...xs];
}

function keepScore(card, ctx) {
  let s = 0;
  if (ctx.pol.keep && ctx.pol.keep[card.rank]) s += ctx.pol.keep[card.rank];
  if (ctx.bestIds.has(card.id)) s += 4;
  if (ctx.pol.keepFn === 'sanh') {
    // giữ lá có lá kề (số hơn kém 1 hoặc 2) cùng họ
    const o = R[card.rank].order;
    const near = ctx.hand.filter((c) => c !== card && c.color === card.color && Math.abs(R[c.rank].order - o) <= 2 && R[c.rank].order !== o).length;
    s += Math.min(near, 3) * 2;
  } else if (ctx.pol.keepFn === 'ho') {
    if (card.color === ctx.majorHo) s += 6;
  } else if (ctx.rankCount[card.rank] > 1) s += 3;
  return s;
}

function decide(run, pol) {
  const r = run.round;
  // Bùa "quân trái nhất" (Quan Đi Đầu, Dội Trống): người chơi xếp Tướng, Sĩ sang trái bằng nút xếp bài; bot làm tương tự
  if (run.charms.some((c) => c.id === 'quan_di_dau' || c.id === 'doi_trong')) run.sortHand('rank');
  const plays = run.enumeratePlays().sort((a, b) => b.score - a.score);
  const best = plays[0];
  const need = Math.max(1, r.target - r.score);
  const pace = need / r.handsLeft;
  if (r.discardsLeft > 0 && best.score < pace * 0.9 && r.hand.length > 0) {
    const rankCount = {};
    for (const c of r.hand) rankCount[c.rank] = (rankCount[c.rank] || 0) + 1;
    const hoCount = {}; for (const c of r.hand) hoCount[c.color] = (hoCount[c.color] || 0) + 1;
    const majorHo = Object.keys(hoCount).sort((x, y) => hoCount[y] - hoCount[x])[0];
    const ctx = { pol, bestIds: new Set(best.ids), rankCount, hand: r.hand, majorHo };
    const ranked = r.hand.map((c) => ({ c, k: keepScore(c, ctx) })).sort((a, b) => a.k - b.k);
    const drop = ranked.filter((x) => x.k < 4).slice(0, 5).map((x) => x.c.id);
    if (drop.length) return { type: 'discard', ids: drop };
  }
  return { type: 'play', ids: best.ids };
}

// Chọn quân cho một Ấn theo build. Trả về null nếu không có lựa chọn hợp lý.
function anTargets(run, pol, anId, rng) {
  const deck = run.deck; const a = AN[anId];
  if (pol.random) {
    const pool = rng.shuffle(deck.slice());
    if (anId === 'tru_ta' && deck.length - a.max < run.config.minDeck) return null;
    return pool.slice(0, a.max).map((c) => c.id);
  }
  const core = pol.core || []; const isCore = (c) => core.includes(c.rank);
  const colorCount = { van: 0, sach: 0, wan: 0 };
  for (const c of deck) if (isCore(c)) colorCount[c.color]++;
  const major = Object.keys(colorCount).sort((x, y) => colorCount[y] - colorCount[x])[0];
  const pick = (list, n) => (list.length ? list.slice(0, n).map((c) => c.id) : null);
  if (anId === 'nhan_ban') {
    const cand = deck.filter(isCore).sort((x, y) => (y.color === major) - (x.color === major) || (y.enh ? 1 : 0) - (x.enh ? 1 : 0));
    return pick(cand, 1);
  }
  if (anId === 'tru_ta') {
    if (deck.length - 2 < run.config.minDeck) return null;
    const cand = deck.filter((c) => !isCore(c) && !(pol.enh || []).includes(c.rank) && !c.enh).sort((x, y) => R[x.rank].chips - R[y.rank].chips);
    return cand.length >= 2 ? pick(cand, 2) : null;
  }
  if (anId === 'dao_sac') {
    if (pol.keepFn !== 'ho') return null;
    return pick(deck.filter((c) => isCore(c) && c.color !== major), 2);
  }
  // phù phép Ngọc / Kim / Son
  const cand = deck.filter((c) => (pol.enh || []).includes(c.rank) && (a.seal ? !c.seal : !c.enh)).sort((x, y) => (y.color === major) - (x.color === major));
  return pick(cand, a.max);
}

function chooseThan(run, pol, rng) {
  const order = pol.than || ['ban_sao', 'them_cho_ngoi', 'nhat_thong'];
  const pick = pol.random ? rng.pick(run.thanOffers) : order.find((id) => run.thanOffers.includes(id)) || run.thanOffers[0];
  let replace;
  if (run.usedSlots() >= run.slots) {
    const worst = run.charms.slice().sort((a, b) => (pol.prefer ? pol.prefer.indexOf(b.id) : 0) - (pol.prefer ? pol.prefer.indexOf(a.id) : 0))[0];
    replace = worst && worst.uid;
  }
  run.pickThan(pick, replace);
}

// Chọn trong Gói vừa mở. Trả về khi đã đóng Gói (phase về 'shop').
function resolvePack(run, pol, rng) {
  const ch = run.pack.choices;
  if (ch[0].kind === 'card') { // Gói Quân: lấy quân thuộc build, ưu tiên có phù phép
    if (pol.random) { run.pickPack(rng.int(ch.length)); return; }
    let best = -1; let bs = -1;
    ch.forEach((c, i) => { if ((pol.core || []).includes(c.rank)) { const sc = 1 + (c.enh ? 1 : 0) + (c.seal ? 1 : 0); if (sc > bs) { bs = sc; best = i; } } });
    run.pickPack(best >= 0 ? best : null); return;
  }
  if (pol.random) {
    const i = rng.int(ch.length); const c = ch[i];
    if (c.kind === 'charm' && run.usedSlots() >= run.slots && c.variant !== 'ran') { run.pickPack(null); return; }
    run.pickPack(i); return;
  }
  if (ch[0].kind === 'que') {
    const i = ch.findIndex((c) => (pol.que || []).includes(c.hand));
    run.pickPack(i >= 0 ? i : 0); return;
  }
  const rank = (id) => (pol.prefer.indexOf(id) >= 0 ? pol.prefer.indexOf(id) : 99);
  let best = -1; let bp = 99;
  ch.forEach((c, i) => { if (rank(c.id) < bp) { bp = rank(c.id); best = i; } });
  if (best < 0 || bp === 99) { run.pickPack(null); return; }
  if (run.usedSlots() < run.slots || ch[best].variant === 'ran') { run.pickPack(best); return; }
  const worst = run.charms.slice().sort((a, b) => rank(b.id) - rank(a.id))[0];
  if (worst && !charmDefs[worst.id].than && rank(worst.id) > bp + 1) run.pickPack(best, worst.uid); else run.pickPack(null);
}

function shopPhase(run, pol, rng) {
  if (pol.buy === false) return;
  if (pol.random) {
    for (const o of run.shop.offers.slice()) {
      if (run.money < o.price || rng.next() >= 0.7) continue;
      if (o.kind === 'an') { const t = anTargets(run, pol, o.id, rng); if (t) run.buy(o.uid, t); }
      else if (o.kind === 'pack') { if (run.buy(o.uid).ok) resolvePack(run, pol, rng); }
      else run.buy(o.uid);
    }
    return;
  }
  const prio = (o) => (o.kind === 'charm' ? (pol.prefer.indexOf(o.id) >= 0 ? pol.prefer.indexOf(o.id) : 99) : 98);
  let rerolls = 0;
  for (let guard = 0; guard < 20; guard++) {
    let acted = false;
    // 1) bùa ưu tiên
    const wanted = run.shop.offers
      .filter((o) => o.kind === 'charm' && pol.prefer.includes(o.id) && o.price <= run.money)
      .sort((a, b) => prio(a) - prio(b));
    for (const o of wanted) {
      if (run.usedSlots() < run.slots || o.variant === 'ran') { if (run.buy(o.uid).ok) { acted = true; break; } }
      else {
        const worst = run.charms.slice().sort((a, b) => (pol.prefer.indexOf(b.id) + 1 || 99) - (pol.prefer.indexOf(a.id) + 1 || 99))[0];
        const wp = pol.prefer.indexOf(worst.id) + 1 || 99;
        if (worst && wp > prio(o) + 1 && !charmDefs[worst.id].than) { run.sell(worst.uid); if (run.buy(o.uid).ok) { acted = true; break; } }
      }
    }
    if (acted) continue;
    // 1b) Phù: nâng cấp vĩnh viễn, mua khi đủ tiền
    const phu = run.shop.offers.filter((o) => o.kind === 'phu' && o.price + 2 <= run.money).sort((a, b) => PHU_ORDER.indexOf(a.id) - PHU_ORDER.indexOf(b.id))[0];
    if (phu && run.buy(phu.uid).ok) continue;
    // 1c) Gói: Gói bùa khi còn ô hoặc có bùa yếu để thay, Gói Quẻ khi dư tiền
    const pk = run.shop.offers.find((o) => o.kind === 'pack' && o.price + (o.pack === 'bua' ? 2 : 4) <= run.money && (o.pack !== 'bua' || run.usedSlots() < run.slots));
    if (pk && run.buy(pk.uid).ok) { resolvePack(run, pol, rng); continue; }
    // 2) Ấn sửa bộ bài (giữ lại 5 đồng để ăn lãi nếu được)
    let bought = false;
    for (const o of run.shop.offers.filter((x) => x.kind === 'an' && x.price <= run.money - 3)) {
      const t = anTargets(run, pol, o.id, rng);
      if (t && run.buy(o.uid, t).ok) { bought = true; break; }
    }
    if (bought) continue;
    // 3) quẻ của bộ ưa thích
    const que = run.shop.offers.find((o) => o.kind === 'que' && pol.que.includes(o.hand) && o.price <= run.money);
    if (que && run.buy(que.uid).ok) continue;
    // 3) làm mới nếu còn dư tiền và chưa gặp bùa mong muốn
    if (rerolls < 2 && run.money >= run.rerollCost() + 8 && run.usedSlots() < run.slots) {
      if (run.reroll().ok) { rerolls++; continue; }
    }
    // 4) còn ô trống và còn nhiều tiền: lấy bùa bất kỳ (trừ khi là bùa lệch hướng hẳn)
    if (run.usedSlots() < run.slots) {
      const any = run.shop.offers.find((o) => o.kind === 'charm' && o.price + 3 <= run.money);
      if (any && run.buy(any.uid).ok) continue;
    }
    break;
  }
  arrange(run, pol);
}

// Chơi trọn một ván. opts: { seed, targetTable, ghost, config }
function playRun(polName, opts = {}) {
  const pol = POLICIES[polName];
  const run = new Run(opts);
  const rng = run.rng; // dùng chung luồng ngẫu nhiên của run để tái hiện được
  const scores = [];
  const plays = [];
  let guard = 0;
  while (run.phase !== 'lost' && run.phase !== 'won' && guard++ < 5000) {
    if (opts.stopAfterChang && run.chang > opts.stopAfterChang) break;
    if (run.phase === 'pack') { resolvePack(run, pol, rng); continue; }
    if (run.phase === 'skip') { run.pickSkip(run.skipOffer.find((h) => (pol.que || []).includes(h)) || run.skipOffer[0]); continue; }
    if (run.phase === 'playing' && pol.skip && run.canSkip() && run.round.kind === 'thuong' && run.chang >= 2) {
      const last = run.history[run.history.length - 1];
      const tag = run.skipTagFor(run.round.chang, run.round.aiIdx);
      if (last && last.outcome !== 'skip' && (last.unused >= 2 || (tag === 'bua' && run.usedSlots() < run.slots))) { run.skipAi(); continue; }
    }
    if (run.phase === 'playing') {
      const act = decide(run, pol);
      const before = run.round;
      const res = act.type === 'play' ? run.play(act.ids) : run.discard(act.ids);
      if (act.type === 'play') plays.push({ chang: before.chang, type: res.hand.type, score: res.score });
      if (act.type === 'play' && res.outcome !== 'continue') {
        scores.push({ chang: before.chang, aiIdx: before.aiIdx, kind: before.kind, boss: before.boss && before.boss.id, target: before.target, score: before.score, outcome: res.outcome });
      }
    } else if (run.phase === 'than') chooseThan(run, pol, rng);
    else if (run.phase === 'shop') { shopPhase(run, pol, rng); run.leaveShop(); }
  }
  const cleared = run.history.filter((h) => h.outcome !== 'lose').length;
  const skips = run.history.filter((h) => h.outcome === 'skip').length;
  return { won: run.phase === 'won', cleared, skips, deckSize: run.deck.length, scores, plays, history: run.history, charms: run.charms.map((c) => c.id), money: run.money, run };
}

module.exports = { POLICIES, playRun, arrange };
