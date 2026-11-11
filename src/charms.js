'use strict';
// Hành vi của từng bùa, tra theo id (khớp src/data/charms.json). Bùa của bản Tổ tôm.
//
// Mỗi bùa có thể có các hook sau (đều tuỳ chọn):
//   init                      trạng thái ban đầu của bùa (đối tượng thường, lưu cùng run)
//   perCard(card, ctx, st)    chạy cho từng lá GHI ĐIỂM, theo thứ tự lá
//   perHeld(card, ctx, st)    chạy cho từng lá CÒN TRÊN TAY (không đánh)
//   onHand(ctx, st)           hiệu ứng độc lập, chạy sau khi xong các lá
//   onScoredState(ctx, st)    cập nhật trạng thái trước khi tính điểm (chỉ chủ bùa chạy, bản sao thì không)
//   afterPlay(ctx, st, run)   sau khi đánh xong (ví dụ lên cấp bộ)
//   onDiscard(cards, st, run) khi bỏ bài
//   onAiStart(run, st)        đầu ải
//   onAiEnd(run, st, round)   cuối ải thắng; có thể trả về { money: n }
//   cardChips(card, chips, R) đổi chip gốc của lá (R = bảng lá)
//   retrigger(card, ctx, st)  số lần lá ghi điểm này được tính thêm
// Hiệu ứng trả về dạng { chips, mult, xmult } (đều tuỳ chọn).
// Cờ: noCopy (Bản Sao không chép được), allSameColor, handsBonus, discardsBonus, handSizeBonus.
// Lưu ý: trường `color` của lá bài là họ (van, sach, wan). Số lá: n1..n9, n10 là lá Yêu.

const isRun = (t) => /^run\d/.test(t);
const isRunSame = (t) => /^run\d_same$/.test(t);
const runLen = (t) => (isRun(t) ? +t[3] : 0);
// Lá Linh (Wild) tính là cả ba họ nên không phá bộ cùng họ
const sameColor = (cs) => { const cols = new Set(cs.filter((c) => c.enh !== 'linh').map((c) => c.color)); return cs.length > 0 && cols.size <= 1; };
const RANKS = Object.fromEntries(require('./data/ranks.json').map((r) => [r.id, r]));
const order = (c) => RANKS[c.rank].order;
const hoSet = (cs) => new Set(cs.filter((c) => c.enh !== 'linh').map((c) => c.color));

const defs = {
  // ---- Build Phu dọc (sảnh) ----
  noi_lien: { perCard: (c, ctx) => (isRun(ctx.hand.type) ? { chips: 8 } : null) },
  tang_dan: { onHand: (ctx) => (isRun(ctx.hand.type) ? { mult: 5 } : null) },
  thong_suot: { onHand: (ctx) => (isRunSame(ctx.hand.type) ? { chips: 60 } : null) },
  sanh_dai: { onHand: (ctx) => (runLen(ctx.hand.type) >= 4 ? { xmult: 1.5 } : null) },
  cong_don_sanh: {
    init: { mult: 0 },
    onScoredState: (ctx, st) => { if (isRun(ctx.hand.type)) st.mult += ctx.scoring.length; },
    onHand: (ctx, st) => (st.mult > 0 ? { mult: st.mult } : null),
  },
  bi_ngu: { noCopy: true, onHand: (ctx) => (runLen(ctx.hand.type) === 5 ? { xmult: 2 } : null) },

  // ---- Build Bộ giống (đôi, ba, tứ quý) ----
  co_doi: { onHand: (ctx) => (/pair|three|four|five|full/.test(ctx.hand.type) ? { chips: 40 } : null) },
  cung_so_khac_ho: { onHand: (ctx) => (['three', 'four', 'five'].includes(ctx.hand.type) ? { mult: 10 } : null) },
  cu_lu_no_ro: { onHand: (ctx) => (/^full/.test(ctx.hand.type) ? { xmult: 2 } : null) },
  khan_manh: { onHand: (ctx) => (ctx.hand.type === 'three' || ctx.hand.type === 'four' ? { xmult: 2.5 } : null) },
  tu_quy_hoi_tu: { noCopy: true, onHand: (ctx) => (['four', 'five'].includes(ctx.hand.type) ? { xmult: 3 } : null) },

  // ---- Build Cùng họ ----
  mot_ho: { onHand: (ctx) => (ctx.scoring.length >= 3 && sameColor(ctx.scoring) ? { mult: 5 } : null) },
  du_ba_ho: {
    onHand: (ctx) => {
      if (ctx.scoring.length < 3) return null;
      const wild = ctx.scoring.filter((c) => c.enh === 'linh').length;
      return hoSet(ctx.scoring).size + Math.min(wild, 3) >= 3 ? { chips: 50 } : null;
    },
  },
  dong_tong: { noCopy: true, onHand: (ctx) => (ctx.scoring.length >= 4 && sameColor(ctx.scoring) ? { xmult: 2 } : null) },
  ho_van: { perCard: (c) => (c.color === 'van' ? { mult: 3 } : null) },
  ho_sach: { perCard: (c) => (c.color === 'sach' ? { chips: 20 } : null) },
  ho_wan: { perCard: (c) => (c.color === 'wan' ? { chips: 10, mult: 2 } : null) },
  doi_ho: { flipOnDiscard: true },

  // ---- Build Lá Yêu (Chi Chi, Thang Thang, Ông Lão) ----
  me_yeu: { perCard: (c) => (c.rank === 'n10' ? { mult: 8 } : null) },
  yeu_giu_nha: { perHeld: (c) => (c.rank === 'n10' ? { mult: 5 } : null) },
  yeu_di_dau: { noCopy: true, perCard: (c, ctx) => (ctx.scoring[0] === c && c.rank === 'n10' ? { xmult: 2 } : null) },
  ba_yeu_hoi_tu: { noCopy: true, onHand: (ctx) => (ctx.hand.type === 'tam_yeu' ? { xmult: 4 } : null) },
  tom_leo_mo_duong: { noCopy: true, onHand: (ctx) => (ctx.hand.type === 'tom' || ctx.hand.type === 'leo' ? { xmult: 3 } : null) },
  goi_them_yeu: { onAiStart: (run) => { run.addTempCard('n10'); } },
  yeu_nang_ky: { cardChips: (card, chips) => (card.rank === 'n10' ? 25 : chips) },

  // ---- Build Giữ bài (lá còn trên tay) ----
  ngoi_cho: { perHeld: () => ({ chips: 4 }) },
  it_ma_chat: { noCopy: true, onHand: (ctx) => (ctx.played.length <= 3 ? { xmult: 2 } : null) },
  giu_du_ba_ho: { noCopy: true, onHand: (ctx) => (hoSet(ctx.held).size >= 3 ? { xmult: 2 } : null) },
  tranh_chi: { noCopy: true, onHand: (ctx) => (ctx.handsLeft === 0 ? { xmult: 2.5 } : null) },

  // ---- Bùa chung ----
  so_nho: { perCard: (c) => (order(c) >= 1 && order(c) <= 3 ? { chips: 12 } : null) },
  so_lon: { perCard: (c) => (order(c) >= 7 && order(c) <= 9 ? { mult: 2 } : null) },
  ngu_phuc: { onHand: (ctx) => (ctx.scoring.length === 5 ? { mult: 8 } : null) },
  doi_trong: { noCopy: true, retrigger: (card, ctx) => (ctx.scoring[0] === card ? 2 : 0) },
  kho_bai: { onHand: (ctx) => (ctx.round.draw.length >= 5 ? { chips: Math.floor(ctx.round.draw.length / 5) } : null) },
  thang_hang_may: { afterPlay: (ctx, st, run) => { if (run.rng.next() < 0.25) run.levelUp(ctx.hand.type); } },
  nhat_ve_chai: {
    onDiscard: (cards, st, run) => {
      const n = cards.filter((c) => c.junk).length;
      if (n) { run.money += 2 * n; run.round.discardMoney = (run.round.discardMoney || 0) + 2 * n; }
    },
  },
  heo_dat: { interestCapBonus: 5 },
  bo_them: { discardsBonus: 2 },
  len_hang: {
    onAiEnd: (run, st, round) => {
      let best = null; let bestN = 0;
      for (const [t, n] of Object.entries(round.playedTypes)) if (n > bestN) { best = t; bestN = n; }
      if (best) run.levelUp(best);
      return null;
    },
  },
  danh_them: { handsBonus: 1 },
  tay_dai: { handSizeBonus: 1 },
  phao_cuu_sinh: { saveOnFail: 0.7 },

  // ---- Bùa Thần ----
  nhat_thong: { than: true, noCopy: true, allSameColor: true },
  ban_sao: { than: true, noCopy: true, copiesRight: true },
  them_cho_ngoi: { than: true, noCopy: true, onBossWon: (run) => { run.slots = Math.min(run.config.maxSlots, run.slots + 1); } },

  // ---- Nhóm Số (Rank-based) ----
  so_giua: { perCard: (c) => (order(c) >= 4 && order(c) <= 6 ? { chips: 10 } : null) },
  leo_thang: {
    init: { mult: 0 },
    onScoredState: (ctx, st) => { for (const c of ctx.scoring) if (order(c) >= 7 && order(c) <= 9) st.mult += 1; },
    onHand: (ctx, st) => (st.mult > 0 ? { mult: st.mult } : null),
  },
  nhat_manh: { perCard: (c) => (c.rank === 'n1' ? { xmult: 2 } : null) },
  day_xich_so: { perCard: (c, ctx) => { const o = order(c); return ctx.scoring.some((x) => order(x) === o + 1) ? { chips: 12 } : null; } },

  // ---- Nhóm Kinh Tế ----
  con_trau: { onHand: (ctx) => ({ chips: 3 * ctx.run.money }) },
  dao_van: { afterPlay: (ctx, st, run) => { const n = ctx.scoring.filter((c) => c.color === 'wan').length; if (n) run.money += n; } },
  tieu_thuong: { onDiscard: (cards, st, run) => { run.money += 1; run.round.discardMoney = (run.round.discardMoney || 0) + 1; } },
  thuong_nhan: { freeRerollBonus: 1 },

  // ---- Nhóm Retrigger ----
  hoi_ma_thuong: { noCopy: true, retrigger: (card, ctx) => (ctx.scoring.length > 0 && card === ctx.scoring[ctx.scoring.length - 1] ? 1 : 0) },
  phan_chieu: { retrigger: (card) => (card.rank === 'n10' ? 1 : 0) },

  // ---- Nhóm Đánh Đổi ----
  vo_vi: { handSizeBonus: -1, onHand: () => ({ chips: 250 }) },
  tu_hanh: { noCopy: true, discardsBonus: -99, onHand: () => ({ xmult: 5 }) },
  mao_hiem: { noCopy: true }, // Phase 2d: active after Glass Card system

  // ---- Nhóm Tích Lũy ----
  bich_hoa: {
    init: { types: [] },
    onScoredState: (ctx, st) => { if (!st.types.includes(ctx.hand.type)) st.types.push(ctx.hand.type); },
    onHand: (ctx, st) => { const n = Math.min(st.types.length, 13); return n > 0 ? { mult: n * 2 } : null; },
  },
  linh_gia: {
    init: { mult: 0 },
    onCharmSell: (st) => { st.mult += 3; },
    onHand: (ctx, st) => (st.mult > 0 ? { mult: st.mult } : null),
  },
  dau_vet: {
    init: { mult: 0 },
    onDiscard: (cards, st) => { st.mult += 4; },
    onHand: (ctx, st) => (st.mult > 0 ? { mult: st.mult } : null),
  },
  cong_dong_luc: { onHand: (ctx) => { const n = ctx.run.chang - 1; return n > 0 ? { mult: n * 0.5 } : null; } },

  // ---- Nhóm Điều Kiện ----
  bieu_tuong_doi: { onHand: (ctx) => (ctx.hand.type === 'pair_mixed' ? { xmult: 2 } : null) },
  bieu_tuong_ba: { onHand: (ctx) => (ctx.hand.type === 'three' ? { xmult: 3 } : null) },
  bieu_tuong_tu: { noCopy: true, onHand: (ctx) => (ctx.hand.type === 'four' ? { xmult: 4 } : null) },
  tranh_thu: { onSkip: (st, run) => { run.money += 10; } },
};

module.exports = defs;
