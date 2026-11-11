'use strict';
// Lõi luật Tổ Tôm (phong cách Balatro). Thuần logic, không đụng DOM, chạy được cả Node lẫn trình duyệt.
// Mọi dữ liệu cân bằng nằm trong src/data/*.json. Hành vi bùa nằm trong src/charms.js.

const { makeRng } = require('./rng.js');
const charmDefs = require('./charms.js');

const D = {
  config: require('./data/config.json'),
  ranks: require('./data/ranks.json'),
  hands: require('./data/hands.json'),
  charms: require('./data/charms.json'),
  bosses: require('./data/bosses.json'),
  targets: require('./data/targets.json'),
  an: require('./data/an.json'),
  phu: require('./data/phu.json'),
  consumables: require('./data/consumables.json'),
  achievements: require('./data/achievements.json'),
};

const R = Object.fromEntries(D.ranks.map((r) => [r.id, r]));
const H = Object.fromEntries(D.hands.map((h) => [h.id, h]));
const HAND_ORDER = D.hands.map((h) => h.id); // thứ tự ưu tiên khi nhận diện bộ (mạnh -> yếu)
const CH = Object.fromEntries(D.charms.map((c) => [c.id, c]));
const AN = Object.fromEntries(D.an.map((a) => [a.id, a]));
const PHU = Object.fromEntries(D.phu.map((p) => [p.id, p]));
const CONS = Object.fromEntries(D.consumables.map((c) => [c.id, c]));
// Ba họ của bài Tổ tôm: Văn, Sách, Vạn. Trường `color` của lá bài giữ tên cũ nhưng nay là họ.
const HO = ['van', 'sach', 'wan'];
const HO_VI = { van: 'Văn', sach: 'Sách', wan: 'Vạn' };
const NEXT_HO = { van: 'sach', sach: 'wan', wan: 'van' }; // Đảo họ: Văn → Sách → Vạn → Văn
// Lá Yêu (số 10) mỗi họ một tên riêng
const YEU_VI = { van: 'Chi Chi', sach: 'Thang Thang', wan: 'Ông Lão' };
const cardName = (c) => (c.rank === 'n10' ? YEU_VI[c.color] || 'Yêu' : R[c.rank].vi);

// ---------------------------------------------------------------- bộ bài & nhận diện bộ
function makeDeck() {
  const cards = [];
  for (const color of HO) {
    for (const r of D.ranks) {
      for (let i = 0; i < r.perColor; i++) cards.push({ id: `${color}-${r.id}-${i}`, color, rank: r.id });
    }
  }
  return cards;
}

function combos(arr, k) {
  const out = [];
  const rec = (start, cur) => {
    if (cur.length === k) { out.push(cur.slice()); return; }
    for (let i = start; i < arr.length; i++) { cur.push(arr[i]); rec(i + 1, cur); cur.pop(); }
  };
  rec(0, []);
  return out;
}

// Lá Linh (Wild) tính là cả ba họ: không phá bộ cùng họ
const sameColor = (cs) => { const cols = new Set(cs.filter((c) => c.enh !== 'linh').map((c) => c.color)); return cs.length > 0 && cols.size <= 1; };

// Tìm bộ có giá trị cao nhất trong các quân đã chọn.
// Giá trị = (chip của bộ ở cấp hiện tại + chip quân) × hệ số của bộ, chưa tính bùa.
// Chọn theo thứ bậc bộ (HAND_ORDER) trước; giá trị chỉ dùng để phân biệt khi hai bộ cùng loại.
// Người chơi kiểm soát bộ được detect bằng cách chọn bài: chọn 2 lá → Đôi, chọn 4 lá 2 cặp → Hai đôi.
// allSame = true khi có bùa Nhất Thống: coi mọi bộ như cùng màu (chỉ cho bảng điểm bộ).
function handValue(type, cards, levels) {
  const h = H[type]; const lv = (levels && levels[type]) || 1;
  return (h.chips + (lv - 1) * h.lvChips + cards.reduce((x, y) => x + R[y.rank].chips, 0)) * (h.mult + (lv - 1) * h.lvMult);
}

// Bản "cùng họ" của từng bộ: mọi lá trong bộ cùng một họ thì tính theo bản này (điểm cao hơn bản khác họ)
const SAME = { run3: 'run3_same', run4: 'run4_same', run5: 'run5_same' };
const SPECIAL = {
  tom: [['van', 'n7'], ['sach', 'n3'], ['wan', 'n3']],
  leo: [['sach', 'n8'], ['wan', 'n9'], ['van', 'n10']],
  tam_yeu: [['van', 'n10'], ['sach', 'n10'], ['wan', 'n10']],
};

function candidates(cards, allSame) {
  const out = [];
  // allSame (bùa Nhất Thống): mọi bộ đều được tính như cùng họ trong bảng bộ
  const v = (type, cs) => (SAME[type] && (allSame || sameColor(cs)) ? SAME[type] : type);
  const byRank = {};
  for (const c of cards) (byRank[c.rank] = byRank[c.rank] || []).push(c);
  const pairs = []; const trios = [];
  for (const c of cards) out.push({ type: 'single', cards: [c] });
  for (const [rank, cs] of Object.entries(byRank)) {
    if (rank === 'junk') continue; // lá Tạp không ghép được bộ nào
    for (const p of combos(cs, 2)) { out.push({ type: v('pair_mixed', p), cards: p }); pairs.push({ rank, cards: p }); }
    for (const t of combos(cs, 3)) { out.push({ type: v('three', t), cards: t }); trios.push({ rank, cards: t }); }
    for (const q of combos(cs, 4)) out.push({ type: v('four', q), cards: q });
    for (const f of combos(cs, 5)) out.push({ type: 'five', cards: f });
  }
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      if (pairs[i].rank === pairs[j].rank) continue;
      const cs = [...pairs[i].cards, ...pairs[j].cards];
      out.push({ type: v('two_pair', cs), cards: cs });
    }
  }
  for (const t of trios) for (const p of pairs) if (p.rank !== t.rank) { const cs = [...t.cards, ...p.cards]; out.push({ type: v('full', cs), cards: cs }); }
  // Sảnh: 3 đến 5 lá có số liên tiếp (Yêu là số 10). Cùng một họ là Phu dọc, lẫn họ là Sảnh lẫn họ.
  const byOrder = {};
  for (const c of cards) { const o = R[c.rank].order; if (o >= 1) (byOrder[o] = byOrder[o] || []).push(c); }
  for (let len = 3; len <= 5; len++) {
    for (let s = 1; s + len - 1 <= 10; s++) {
      const lists = [];
      for (let o = s; o < s + len; o++) lists.push(byOrder[o] || []);
      if (lists.some((l) => !l.length)) continue;
      const rec = (i, cur) => {
        if (i === lists.length) { out.push({ type: v('run' + len, cur), cards: cur.slice() }); return; }
        for (const c of lists[i]) { cur.push(c); rec(i + 1, cur); cur.pop(); }
      };
      rec(0, []);
    }
  }
  // Thuần họ: 5 lá cùng một họ (không cần liên tiếp)
  if (cards.length >= 5) for (const f of combos(cards.filter((c) => c.rank !== 'junk'), 5)) if (allSame || sameColor(f)) out.push({ type: 'flush5', cards: f });
  // Bộ đặc biệt của Tổ tôm: Tôm, Lèo, Tam Yêu (đúng 3 lá cụ thể)
  for (const [type, need] of Object.entries(SPECIAL)) {
    const lists = need.map(([ho, rank]) => cards.filter((c) => c.rank === rank && c.color === ho));
    if (lists.some((l) => !l.length)) continue;
    for (const a of lists[0]) for (const b of lists[1]) for (const c of lists[2]) out.push({ type, cards: [a, b, c] });
  }
  return out;
}

function detect(cards, allSame = false, levels = null) {
  if (!cards.length) return null;
  let best = null; let bv = -1; let bi = Infinity;
  for (const c of candidates(cards, allSame)) {
    const pi = HAND_ORDER.indexOf(c.type);
    if (pi < 0) continue; // loại bỏ bộ không còn trong bảng bộ (ví dụ run3/run4 sau khi gộp)
    if (levels && levels[c.type] === 0) continue; // bộ còn khóa (cấp 0) thì không được tính
    const v = handValue(c.type, c.cards, levels);
    if (pi < bi || (pi === bi && v > bv)) { best = c; bv = v; bi = pi; }
  }
  // giữ thứ tự quân như người chơi đã chọn
  return { type: best.type, cards: cards.filter((c) => best.cards.includes(c)) };
}

// ---------------------------------------------------------------- một ván chơi (run)
class Run {
  constructor(opts = {}) {
    this.config = Object.assign({}, D.config, opts.config || {});
    // Mức độ khó = bộ tham số quân Tạp. opts.config.difficulty (dùng cho mô phỏng) ghi đè mức độ khó đã chọn.
    this.difficultyId = opts.difficulty || this.config.defaultDifficulty;
    if (!(opts.config && opts.config.difficulty)) {
      const pr = this.config.difficultyPresets[this.difficultyId];
      if (!pr) throw new Error('Mức độ khó không tồn tại: ' + this.difficultyId);
      this.config.difficulty = { junk: pr.junk, targetMul: pr.targetMul || 1, startMoney: pr.startMoney, discards: pr.discards };
    }
    this.table = opts.targetTable || D.targets.table;
    this.ghostAll = !!opts.ghost; // chế độ mô phỏng: không thua, không dừng sớm khi đủ điểm
    this.ghostFrom = opts.ghostFrom == null ? Infinity : opts.ghostFrom; // chỉ bật chế độ trên từ ải số này (0..23)
    this.seed = opts.seed == null ? 1 : opts.seed;
    this.rng = makeRng(this.seed);
    // Bộ bài khởi đầu: mỗi bộ đổi luật một chút để mỗi ván một phong cách (học từ các Deck của Balatro)
    this.deckId = opts.deck || this.config.defaultDeck;
    const dk = this.config.decks[this.deckId];
    if (!dk) throw new Error('Bộ bài không tồn tại: ' + this.deckId);
    this.deckDef = dk;
    let deck = makeDeck();
    if (dk.removeRanks) deck = deck.filter((c) => !dk.removeRanks.includes(c.rank));
    if (dk.allColor) deck = deck.map((c) => ({ ...c, color: dk.allColor }));
    if (dk.randomize) {
      const r2 = makeRng(((this.seed ^ 0x9e3779b9) >>> 0) || 1);
      const ranks = D.ranks.filter((r) => r.perColor > 0).map((r) => r.id);
      deck = deck.map((c, i) => { const rank = r2.pick(ranks); const color = r2.pick(HO); return { id: `${color}-${rank}-r${i}`, color, rank }; });
    }
    this.deck = deck;
    this.money = (this.config.difficulty.startMoney != null ? this.config.difficulty.startMoney : this.config.startMoney) + (dk.money || 0);
    this.slots = this.config.slots + (dk.slots || 0);
    this.charms = [];
    this.consumables = [];
    this.consumableSlots = this.config.consumableSlots || 2;
    this.junkImmune = false;
    this.handLevels = Object.fromEntries(D.hands.map((h) => [h.id, h.locked && this.config.lockHands !== false ? 0 : 1])); // cấp 0 = còn khóa, mở bằng Quẻ
    this.chang = 1;
    this.aiIdx = 0;
    this.history = [];
    this.uidCounter = 1;
    this.thanTaken = [];
    this.shop = null;
    this.thanOffers = null;
    this.lastReward = null;
    this.vouchers = []; this.voucherOffer = null; this.pack = null; this.packReturn = null; this.lastSkip = null; this.pendingInvest = 0;
    const pool = this.rng.shuffle(D.bosses.pool.slice());
    this.bosses = pool.slice(0, this.config.changCount - 1).concat([D.bosses.final]);
    this.startAi();
  }

  // ---- lưu và nạp ván (JSON thuần). Không lưu: rng (lưu riêng trạng thái), config, deckDef, table, cờ mô phỏng (dựng lại từ opts).
  snapshot() {
    const skip = new Set(['rng', 'config', 'deckDef', 'table', 'ghostAll', 'ghostFrom']);
    const state = {};
    for (const k of Object.keys(this)) if (!skip.has(k)) state[k] = this[k];
    return { opts: { seed: this.seed, difficulty: this.difficultyId, deck: this.deckId }, rng: this.rng.getState(), state: JSON.parse(JSON.stringify(state)) };
  }
  static restore(snap) {
    const r = new Run(snap.opts);
    Object.assign(r, JSON.parse(JSON.stringify(snap.state)));
    r.rng.setState(snap.rng);
    if (r.config.lockHands === false) {
      for (const k of Object.keys(r.handLevels)) if (r.handLevels[k] === 0) r.handLevels[k] = 1;
    }
    return r;
  }

  // ---- tiện ích
  bonus(key) { return this.charms.reduce((s, c) => s + (charmDefs[c.id][key] || 0), 0) + this.vouchers.reduce((s, id) => s + (PHU[id][key] || 0), 0) + ((this.deckDef && this.deckDef[key]) || 0); }
  _price(base) {
    const pct = this.vouchers.reduce((s, id) => s + (PHU[id].discountPct || 0), 0);
    return pct ? Math.max(1, Math.ceil(base * (1 - pct / 100))) : base;
  }
  usedSlots() { return this.charms.filter((c) => c.variant !== 'ran').length; }
  levelUp(type) { this.handLevels[type] += 1; } // bộ đang khóa (cấp 0) thì thành cấp 1 = được mở
  unlockedHands() { return D.hands.map((h) => h.id).filter((id) => this.handLevels[id] > 0); }
  lockedHands() { return D.hands.map((h) => h.id).filter((id) => this.handLevels[id] === 0); }
  // chọn n bộ cho Quẻ: luôn có ít nhất 1 bộ đang khóa (nếu còn) để mở dần, còn lại là bộ đã mở để lên cấp
  _queHands(n) {
    const locked = this.rng.shuffle(this.lockedHands()); const open = this.rng.shuffle(this.unlockedHands());
    const out = locked.length ? [locked[0]] : [];
    for (const h of open) if (out.length < n) out.push(h);
    for (const h of locked.slice(1)) if (out.length < n) out.push(h);
    return this.rng.shuffle(out);
  }
  addTempCard(rank) {
    const color = this.rng.pick(HO);
    const card = { id: `tmp-${color}-${rank}-${this.uidCounter++}`, color, rank, tmp: true };
    const d = this.round.draw;
    d.splice(this.rng.int(d.length + 1), 0, card);
  }
  cardChips(card) {
    let v = R[card.rank].chips;
    for (const c of this.charms) { if (this.round && c.uid === this.round.disabledUid) continue; const d = charmDefs[c.id]; if (d.cardChips) v = d.cardChips(card, v, R); }
    return v;
  }
  targetFor(chang, aiIdx) { const base = this.table[chang - 1][aiIdx]; const mul = (this.config.difficulty && this.config.difficulty.targetMul) || 1; return Math.round(base * mul); }

  // ---- bắt đầu một ải
  startAi() {
    const kind = this.config.aiKinds[this.aiIdx];
    const boss = kind === 'trum' ? this.bosses[this.chang - 1] : null;
    const eff = boss ? boss.effect : {};
    const hands = Math.max(1, this.config.hands + this.bonus('handsBonus') - (eff.handsMinus || 0));
    const baseDiscards = this.config.difficulty.discards != null ? this.config.difficulty.discards : this.config.discards;
    const discards = Math.max(0, baseDiscards + this.bonus('discardsBonus') - (eff.discardsMinus || 0));
    const handSize = Math.max(3, this.config.handSize + this.bonus('handSizeBonus') - (eff.handSizeMinus || 0));
    const cards = this.deck.map((c) => ({ ...c }));
    this.round = {
      chang: this.chang, aiIdx: this.aiIdx, kind, boss,
      target: this.targetFor(this.chang, this.aiIdx), score: 0,
      handsMax: hands, handsLeft: hands, discardsLeft: discards, handSize,
      draw: this.rng.shuffle(cards), hand: [], discardPile: [], playedTypes: {}, bestPlay: 0,
      junk: 0,
    };
    this.phase = 'playing';
    const nJunk = this.junkImmune ? 0 : this.junkFor(this.chang, kind);
    for (let i = 0; i < nJunk; i++) {
      const d = this.round.draw;
      d.splice(this.rng.int(d.length + 1), 0, { id: `junk-${this.uidCounter++}`, color: this.rng.pick(HO), rank: 'junk', junk: true });
    }
    this.round.junk = nJunk;
    for (const c of this.charms) { const d = charmDefs[c.id]; if (d.onAiStart) d.onAiStart(this, c.state); }
    this._refill();
    this.round.disabledUid = null; this._rollDisabled();
    this.round.debuffColor = eff.debuffColor ? this.rng.pick(HO) : null;
  }

  // Quân bị trùm vô hiệu: theo loại (Tướng Giặc) hoặc theo màu (Quỷ Nhuộm; quân Linh bị vô hiệu cùng)
  isDebuffed(c) {
    const r = this.round;
    if (!r || !r.boss) return false;
    const e = r.boss.effect;
    if (e.debuffRanks && e.debuffRanks.includes(c.rank)) return true;
    return !!(r.debuffColor && !c.junk && (c.color === r.debuffColor || c.enh === 'linh'));
  }

  // Trùm Ma Trơi: mỗi lượt vô hiệu một bùa ngẫu nhiên
  _rollDisabled() {
    const r = this.round;
    r.disabledUid = null;
    if (r.boss && r.boss.effect.disableCharm && this.charms.length) r.disabledUid = this.rng.pick(this.charms).uid;
  }

  // Ba ải của chặng hiện tại, để vẽ màn chọn ải. Thẻ bỏ qua cố định theo hạt giống nên xem trước được.
  skipTagFor(chang, idx) {
    const kind = this.config.aiKinds[idx];
    if (!this.config.skip.allowed.includes(kind)) return null;
    const rng = makeRng((((this.seed * 31) >>> 0) + chang * 977 + idx * 131) >>> 0);
    return rng.pick(this.config.skip.tags);
  }
  blinds() {
    return this.config.aiKinds.map((kind, idx) => ({
      idx, kind, chang: this.chang,
      target: this.targetFor(this.chang, idx),
      reward: this.config.rewards[kind],
      boss: kind === 'trum' ? this.bosses[this.chang - 1] : null,
      tag: this.skipTagFor(this.chang, idx),
      status: idx < this.aiIdx ? 'done' : idx === this.aiIdx ? 'now' : 'next',
    }));
  }

  // Số quân Tạp lẫn vào bộ bài của một ải: phần nguyên cố định theo chặng, phần lẻ là xác suất thêm một quân.
  junkBase(chang, kind) {
    const d = (this.config.difficulty || {}).junk;
    if (!d || !(d.max > 0) || chang < d.startChang) return 0;
    return Math.min(d.max, (chang - d.startChang + 1) * d.perChang + (kind === 'trum' ? d.bossBonus : 0));
  }
  junkFor(chang, kind) {
    const base = this.junkBase(chang, kind);
    if (base <= 0) return 0;
    return Math.floor(base) + (this.rng.next() < base - Math.floor(base) ? 1 : 0);
  }

  _refill() {
    const r = this.round;
    while (r.hand.length < r.handSize && r.draw.length > 0) r.hand.push(r.draw.pop());
  }

  // ---- xem trước bộ (chưa tính bùa) cho giao diện
  preview(ids) {
    const r = this.round;
    const played = r.hand.filter((c) => ids.includes(c.id));
    if (!played.length) return null;
    const held = r.hand.filter((c) => !ids.includes(c.id));
    const res = this._calc(played, held, true);
    const base = res.steps[0];
    const banStep = res.steps.find((s) => s.kind === 'banned');
    const eff = r.boss ? r.boss.effect : {};
    return {
      type: res.hand.type, level: base.level, cards: res.hand.cards,
      chips: banStep ? banStep.chips : base.chips, mult: banStep ? banStep.mult : base.mult,
      banned: res.banned, estimate: res.score,
      unscored: played.filter((c) => !res.hand.cards.includes(c)).map((c) => c.id),
      debuffed: played.filter((c) => res.hand.cards.includes(c) && this.isDebuffed(c)).map((c) => c.id),
      lockedBetter: this._lockedBetter(played),
    };
  }
  // nếu các quân đang chọn thực ra ghép được một bộ còn khóa mà điểm cao hơn, trả về mã bộ đó (để báo người chơi)
  _lockedBetter(played) {
    const allSame = this.charms.some((c) => charmDefs[c.id].allSameColor);
    const open = detect(played, allSame, this.handLevels);
    const free = detect(played, allSame, null); // bỏ qua khóa, mọi bộ ở cấp 1
    if (free.type !== open.type && this.handLevels[free.type] === 0 && handValue(free.type, free.cards, null) > handValue(open.type, open.cards, this.handLevels)) return free.type;
    return null;
  }

  // ---- tính điểm một lượt đánh. dry = true: chỉ tính thử, không đổi trạng thái bùa
  _calc(played, held, dry) {
    const round = this.round;
    const eff = round.boss ? round.boss.effect : {};
    const debuff = (c) => this.isDebuffed(c);
    const allSame = this.charms.some((c) => charmDefs[c.id].allSameColor);
    const hand = detect(played, allSame, this.handLevels);
    const steps = [];
    const hd = H[hand.type];
    const lvl = Math.max(1, this.handLevels[hand.type] - (eff.armDown ? 1 : 0)); // trùm Tay Gãy hạ 1 cấp
    let chips = hd.chips + (lvl - 1) * hd.lvChips;
    let mult = hd.mult + (lvl - 1) * hd.lvMult;
    steps.push({ kind: 'hand', type: hand.type, level: lvl, dChips: chips, dMult: mult, chips, mult });
    const banned = !!(eff.banHands && eff.banHands.includes(hand.type));
    if (banned && this.config.bossBan === 'zero') {
      steps.push({ kind: 'banned', chips, mult });
      return { hand, steps, chips, mult, score: 0, banned: true, ctx: null, slots: [] };
    }
    if (banned) { // chế độ "half": bộ bị phạt chỉ còn nửa chip và nửa hệ số gốc
      chips = Math.floor(chips / 2); mult = Math.max(1, Math.floor(mult / 2));
      steps.push({ kind: 'banned', chips, mult, dChips: chips - steps[0].chips, dMult: mult - steps[0].mult });
    }
    const stMap = new Map();
    for (const c of this.charms) {
      const d = charmDefs[c.id];
      stMap.set(c.uid, dry && d.onScoredState ? { ...c.state } : c.state);
    }
    const slots = [];
    const off = round.disabledUid;
    this.charms.forEach((c, i) => {
      const d = charmDefs[c.id];
      if (c.uid === off) { slots.push({ charm: c, idx: i, def: {}, st: {}, copy: false, off: true }); return; }
      if (d.copiesRight) {
        const t = this.charms[i + 1];
        const td = t ? charmDefs[t.id] : null;
        if (td && t.uid !== off && !td.noCopy && !td.than) slots.push({ charm: c, idx: i, def: td, st: stMap.get(t.uid), copy: true });
        else slots.push({ charm: c, idx: i, def: {}, st: {}, copy: true });
      } else slots.push({ charm: c, idx: i, def: d, st: stMap.get(c.uid), copy: false });
    });
    const scoring = played.filter((c) => hand.cards.includes(c));
    const heldAct = held.filter((c) => !debuff(c) && !c.junk);
    const ctx = {
      hand, scoring, played, held: heldAct,
      handsLeft: round.handsLeft - 1, discardsLeft: round.discardsLeft, round, run: this,
    };
    const apply = (e, base) => {
      if (!e) return;
      const s = { ...base };
      if (e.chips) { chips += e.chips; s.dChips = e.chips; }
      if (e.mult) { mult += e.mult; s.dMult = e.mult; }
      if (e.xmult) { mult *= e.xmult; s.xMult = e.xmult; }
      s.chips = chips; s.mult = mult;
      steps.push(s);
    };
    // 1) cập nhật trạng thái bùa (chỉ chủ bùa)
    for (const s of slots) if (!s.copy && s.def.onScoredState) s.def.onScoredState(ctx, s.st);
    // 2) từng quân ghi điểm
    for (const card of scoring) {
      if (debuff(card)) { steps.push({ kind: 'card', cardId: card.id, debuffed: true, chips, mult }); continue; }
      let reps = 1; let retrigIdx = null;
      for (const s of slots) {
        if (!s.def.retrigger) continue;
        const n = s.def.retrigger(card, ctx, s.st);
        if (n > 0) { reps += n; if (retrigIdx == null) retrigIdx = s.idx; }
      }
      if (card.seal === 'do') reps += 1; // Triện Đỏ: tính thêm 1 lần
      for (let rep = 0; rep < reps; rep++) {
        if (rep > 0) steps.push({ kind: 'again', cardId: card.id, charmIdx: retrigIdx, n: rep, chips, mult });
        apply({ chips: this.cardChips(card) }, { kind: 'card', cardId: card.id });
        if (card.enh === 'ngoc') apply({ chips: 30 }, { kind: 'enh', enh: 'ngoc', cardId: card.id });
        if (card.enh === 'kim') apply({ mult: 4 }, { kind: 'enh', enh: 'kim', cardId: card.id });
        if (card.enh === 'son') apply({ xmult: 1.5 }, { kind: 'enh', enh: 'son', cardId: card.id });
        if (card.enh === 'luu_ly') apply({ xmult: 2 }, { kind: 'enh', enh: 'luu_ly', cardId: card.id });
        for (const s of slots) if (s.def.perCard) apply(s.def.perCard(card, ctx, s.st), { kind: 'charm', where: 'card', cardId: card.id, charmIdx: s.idx });
      }
    }
    // 3) quân còn trên tay
    for (const card of heldAct) {
      if (card.enh === 'thep') apply({ xmult: 1.5 }, { kind: 'enh', enh: 'thep', where: 'held', cardId: card.id });
      for (const s of slots) if (s.def.perHeld) apply(s.def.perHeld(card, ctx, s.st), { kind: 'charm', where: 'held', cardId: card.id, charmIdx: s.idx });
    }
    // 4) hiệu ứng độc lập, từ trái sang phải; biến thể chất liệu bọc quanh bùa
    for (const s of slots) {
      const v = s.off ? null : s.charm.variant;
      if (v === 'ngoc') apply({ chips: 50 }, { kind: 'variant', variant: v, charmIdx: s.idx });
      if (v === 'vang') apply({ mult: 10 }, { kind: 'variant', variant: v, charmIdx: s.idx });
      if (s.def.onHand) apply(s.def.onHand(ctx, s.st), { kind: 'charm', where: 'hand', charmIdx: s.idx });
      if (v === 'son_mai') apply({ xmult: 1.5 }, { kind: 'variant', variant: v, charmIdx: s.idx });
    }
    const sealMoney = scoring.filter((c) => !debuff(c) && c.seal === 'vang').length * 3;
    const pendMult = !dry && round.pendingMult ? round.pendingMult : 0;
    if (!dry && pendMult) delete round.pendingMult;
    return { hand, steps, chips, mult: mult + pendMult, score: Math.floor(chips * (mult + pendMult)), banned, ctx, slots, sealMoney };
  }

  // Liệt kê các nước đánh hợp lệ "gọn" (mọi quân đánh ra đều ghi điểm), kèm điểm tính thử. Dùng cho bot.
  enumeratePlays() {
    const hand = this.round.hand;
    const allSame = this.charms.some((c) => charmDefs[c.id].allSameColor);
    const out = []; const seen = new Set();
    // Mỗi ứng viên bộ trên cả tay bài là một nước đánh "gọn"; giữ lại nước mà mọi quân đều ghi điểm.
    for (const cand of candidates(hand, allSame)) {
      const played = hand.filter((c) => cand.cards.includes(c));
      const key = played.map((c) => c.id).join(',');
      if (seen.has(key) || played.length > this.config.maxPlay) continue;
      seen.add(key);
      if (detect(played, allSame, this.handLevels).cards.length !== played.length) continue;
      const held = hand.filter((c) => !cand.cards.includes(c));
      const res = this._calc(played, held, true);
      out.push({ ids: played.map((c) => c.id), score: res.score, type: res.hand.type });
    }
    return out;
  }

  // ---- đánh bài
  play(ids) {
    this._need('playing');
    const r = this.round;
    if (!ids.length || ids.length > this.config.maxPlay) throw new Error('Phải chọn từ 1 đến 5 quân');
    if (new Set(ids).size !== ids.length) throw new Error('Quân bị chọn trùng');
    const played = ids.map((id) => r.hand.find((c) => c.id === id)).filter(Boolean);
    if (played.length !== ids.length) throw new Error('Có quân không nằm trên tay');
    const held = r.hand.filter((c) => !ids.includes(c.id));
    const res = this._calc(played, held, false);
    r.acted = true;
    r.score += res.score;
    if (r.freePlay) { delete r.freePlay; } else { r.handsLeft -= 1; }
    r.playedTypes[res.hand.type] = (r.playedTypes[res.hand.type] || 0) + 1;
    r.bestPlay = Math.max(r.bestPlay, res.score);
    const levelsBefore = { ...this.handLevels };
    if (res.ctx) for (const s of res.slots) if (!s.copy && s.def.afterPlay) s.def.afterPlay(res.ctx, s.st, this);
    r.discardPile.push(...played);
    r.hand = held;
    const eff = r.boss ? r.boss.effect : {};
    let hooked = []; let tax = 0;
    if (eff.hookDiscard) {
      for (let i = 0; i < eff.hookDiscard && r.hand.length > 0; i++) { const c = r.hand.splice(this.rng.int(r.hand.length), 1)[0]; r.discardPile.push(c); hooked.push(c.id); }
    }
    if (eff.taxPerCard) { tax = Math.min(this.money, played.length * eff.taxPerCard); this.money -= tax; }
    // Triện Vàng: tiền ngay khi quân ghi điểm. Lưu Ly: mỗi quân ghi điểm 1/4 cơ hội vỡ, mất khỏi bộ bài
    const sealMoney = res.sealMoney || 0; this.money += sealMoney;
    const broken = [];
    for (const c of res.hand.cards) {
      if (c.enh === 'luu_ly' && !this.isDebuffed(c) && this.rng.next() < 0.25) {
        const di = this.deck.findIndex((d) => d.id === c.id);
        if (di >= 0) { this.deck.splice(di, 1); broken.push(c.id); }
      }
    }
    this._refill();
    this._rollDisabled();
    const out = { ...res, ctx: undefined, slots: undefined, total: r.score, outcome: 'continue', hooked, tax, sealMoney, broken };
    out.leveled = Object.keys(this.handLevels).filter((k) => this.handLevels[k] > levelsBefore[k]);
    out.outcome = this._checkEnd();
    return out;
  }

  // ---- bỏ bài
  discard(ids) {
    this._need('playing');
    const r = this.round;
    if (r.discardsLeft <= 0) throw new Error('Hết lượt bỏ bài');
    if (!ids.length || ids.length > this.config.maxPlay) throw new Error('Phải bỏ từ 1 đến 5 quân');
    const cards = r.hand.filter((c) => ids.includes(c.id));
    if (cards.length !== ids.length) throw new Error('Có quân không nằm trên tay');
    r.acted = true;
    r.discardMoney = 0;
    r.discardsLeft -= 1;
    r.hand = r.hand.filter((c) => !ids.includes(c.id));
    for (const c of this.charms) { const d = charmDefs[c.id]; if (d.onDiscard) d.onDiscard(cards, c.state, this); }
    this._refill();
    if (this.charms.some((c) => charmDefs[c.id].flipOnDiscard)) {
      for (const card of cards) {
        if (!card.swapped) { card.color = NEXT_HO[card.color]; card.swapped = true; }
        r.draw.splice(this.rng.int(r.draw.length + 1), 0, card);
      }
    } else r.discardPile.push(...cards);
    return { discarded: cards.map((c) => c.id), money: r.discardMoney || 0 };
  }

  _need(phase) { if (this.phase !== phase) throw new Error(`Sai giai đoạn: đang ở "${this.phase}", cần "${phase}"`); }

  get ghost() { return this.ghostAll || this.chang * 3 - 3 + this.aiIdx >= this.ghostFrom; }

  _checkEnd() {
    const r = this.round;
    if (!this.ghost && r.score >= r.target) return this._winAi('clear');
    const outOfCards = r.hand.length === 0;
    if (r.handsLeft > 0 && !outOfCards) return 'continue';
    // hết lượt (hoặc hết bài)
    if (this.ghost) return this._winAi('ghost');
    if (r.score >= r.target) return this._winAi('clear');
    const saver = this.charms.find((c) => charmDefs[c.id].saveOnFail && r.score >= r.target * charmDefs[c.id].saveOnFail);
    if (saver) {
      this.charms.splice(this.charms.indexOf(saver), 1);
      return this._winAi('saved');
    }
    this.history.push({ chang: r.chang, aiIdx: r.aiIdx, kind: r.kind, boss: r.boss && r.boss.id, target: r.target, score: r.score, outcome: 'lose' });
    this.phase = 'lost';
    return 'lost';
  }

  _winAi(how) {
    const r = this.round;
    const unused = r.handsLeft;
    const base = this.config.rewards[r.kind];
    let extra = 0;
    for (const c of this.charms) {
      const d = charmDefs[c.id];
      if (d.onAiEnd) { const out = d.onAiEnd(this, c.state, r); if (out && out.money) extra += out.money; }
    }
    const icfg = this.config.interest;
    const interest = Math.min(icfg.cap + this.bonus('interestCapBonus'), Math.floor(Math.max(0, this.money) / icfg.per));
    const invest = r.kind === 'trum' ? this.pendingInvest : 0; // Thẻ Đầu Tư trả sau khi hạ trùm
    if (invest) this.pendingInvest = 0;
    const sealLevels = []; // Triện Lam: còn trên tay khi hạ ải thì nâng 1 cấp một bộ ngẫu nhiên
    for (const c of r.hand) if (c.seal === 'lam') { const h = this.rng.pick(this.unlockedHands()); this.levelUp(h); sealLevels.push(h); }
    const total = base + unused * this.config.rewards.perUnusedHand + extra + interest + invest;
    this.money += total;
    this.lastReward = { base, unused, perUnused: this.config.rewards.perUnusedHand, extra, interest, invest, sealLevels, total, how };
    this.history.push({ chang: r.chang, aiIdx: r.aiIdx, kind: r.kind, boss: r.boss && r.boss.id, target: r.target, score: r.score, outcome: how, unused });
    if (r.kind === 'trum') {
      for (const c of this.charms) { const d = charmDefs[c.id]; if (d.onBossWon) d.onBossWon(this, c.state); }
      if (r.chang === this.config.changCount) { this.phase = 'won'; return 'won'; }
      if (this.config.than.afterBossChang.includes(r.chang)) {
        const left = D.charms.filter((c) => c.rarity === 'than' && !this.thanTaken.includes(c.id));
        if (left.length) {
          this.thanOffers = left.slice(0, this.config.than.choices).map((c) => c.id);
          this.phase = 'than';
          return 'than';
        }
      }
    }
    this._enterShop();
    return 'shop';
  }

  // ---- bùa Thần (sau một số ải trùm)
  pickThan(id, replaceUid) {
    this._need('than');
    if (!this.thanOffers.includes(id)) throw new Error('Bùa này không nằm trong lựa chọn');
    if (this.usedSlots() >= this.slots) {
      const i = this.charms.findIndex((c) => c.uid === replaceUid);
      if (i < 0) throw new Error('Hết ô bùa: chọn một bùa để thay');
      this.charms.splice(i, 1);
    }
    this._addCharm(id, null, 0);
    this.thanTaken.push(id);
    this.thanOffers = null;
    this._enterShop();
  }
  skipThan() { this._need('than'); this.thanOffers = null; this._enterShop(); }

  _addCharm(id, variant, price) {
    const d = charmDefs[id];
    const info = CH[id];
    const charm = {
      uid: this.uidCounter++, id, variant: variant || null,
      state: d.init ? { ...d.init } : {},
      sell: Math.max(1, Math.floor((price || (info.rarity === 'than' ? 6 : info.price)) / 2)),
    };
    this.charms.push(charm);
    return charm;
  }

  // ---- chợ
  _enterShop() {
    const freeRerolls = this.charms.reduce((s, c) => s + (charmDefs[c.id].freeRerollBonus || 0), 0);
    this.shop = { offers: [], rerolls: 0, freeRerolls };
    // Mỗi chặng có một Phù; chưa mua thì còn nguyên ở các chợ sau trong chặng
    if (!this.voucherOffer || this.voucherOffer.chang !== this.chang) {
      const left = D.phu.filter((p) => !this.vouchers.includes(p.id));
      this.voucherOffer = left.length ? { chang: this.chang, id: this.rng.pick(left).id, bought: false } : null;
    }
    this._fillShop(true);
    this.phase = 'shop';
  }

  _rollWeighted(pool, weightFn) {
    const total = pool.reduce((s, c) => s + weightFn(c), 0);
    let x = this.rng.next() * total; let pick = pool[pool.length - 1];
    for (const c of pool) { x -= weightFn(c); if (x <= 0) { pick = c; break; } }
    return pick;
  }
  _rollRarity(cands) {
    const w = this.config.shop.rarityWeights;
    return this._rollWeighted(cands, (c) => w[c.rarity]);
  }
  _rollVariant() {
    let y = this.rng.next();
    for (const [v, p] of Object.entries(this.config.shop.variantChance)) { if (y < p) return v; y -= p; }
    return null;
  }

  _fillShop(initial) {
    const cfg = this.config.shop;
    const keep = initial ? [] : this.shop.offers.filter((o) => o.kind === 'pack' || o.kind === 'phu' || o.kind === 'cons');
    const offers = [];
    const owned = new Set(this.charms.map((c) => c.id));
    const pool = D.charms.filter((c) => c.rarity !== 'than' && !owned.has(c.id));
    const taken = new Set();
    const nCharm = cfg.charmOffers + this.bonus('shopCharmBonus');
    for (let i = 0; i < nCharm; i++) {
      const cand = pool.filter((c) => !taken.has(c.id));
      if (!cand.length) break;
      const pick = this._rollRarity(cand);
      taken.add(pick.id);
      const variant = this._rollVariant();
      const base = pick.price + (variant ? cfg.variantSurcharge[variant] : 0);
      offers.push({ uid: this.uidCounter++, kind: 'charm', id: pick.id, variant, base, price: this._price(base) });
    }
    const nQue = cfg.queOffers + this.bonus('shopQueBonus'); const taken2 = new Set();
    const pickQue = (i) => { // còn bộ khóa thì thường ra lá Mở khóa trước (65% lá đầu, 35% các lá sau), còn lại là lá nâng cấp
      const lk = this.lockedHands().filter((h) => !taken2.has(h)); const op = this.unlockedHands().filter((h) => !taken2.has(h));
      const pool = lk.length && (!op.length || this.rng.next() < (i === 0 ? 0.65 : 0.35)) ? lk : (op.length ? op : lk);
      const h = this.rng.pick(pool); taken2.add(h); return h;
    };
    for (let i = 0; i < nQue; i++) {
      offers.push({ uid: this.uidCounter++, kind: 'que', hand: pickQue(i), base: cfg.quePrice, price: this._price(cfg.quePrice) });
    }
    for (let i = 0; i < (cfg.anOffers || 0); i++) {
      const pick = this._rollWeighted(D.an, (a) => a.weight);
      offers.push({ uid: this.uidCounter++, kind: 'an', id: pick.id, base: pick.price, price: this._price(pick.price) });
    }
    const nCons = cfg.consumableOffers || 0;
    if (nCons > 0) {
      const consTaken = new Set(keep.filter((o) => o.kind === 'cons').map((o) => o.id));
      const consPool = D.consumables.filter((c) => !consTaken.has(c.id));
      for (let i = 0; i < nCons && consPool.length; i++) {
        const idx = this.rng.int(consPool.length);
        const pick = consPool.splice(idx, 1)[0];
        offers.push({ uid: this.uidCounter++, kind: 'cons', id: pick.id, base: pick.price, price: this._price(pick.price) });
      }
    }
    if (initial) {
      const packEntries = Object.entries(cfg.packWeights);
      for (let i = 0; i < (cfg.packOffers || 0); i++) {
        const pk = this._rollWeighted(packEntries, ([, v]) => v)[0];
        offers.push({ uid: this.uidCounter++, kind: 'pack', pack: pk, base: cfg.packPrice, price: this._price(cfg.packPrice) });
      }
      const vo = this.voucherOffer;
      if (vo && !vo.bought) offers.push({ uid: this.uidCounter++, kind: 'phu', id: vo.id, base: PHU[vo.id].price, price: PHU[vo.id].price });
    }
    this.shop.offers = keep.concat(offers);
  }

  _reprice() {
    for (const o of this.shop.offers) if (o.kind !== 'phu') o.price = this._price(o.base);
  }

  rerollCost() { return this.config.shop.rerollBase + this.shop.rerolls * this.config.shop.rerollStep; }

  reroll() {
    this._need('shop');
    if (this.shop.freeRerolls > 0) { this.shop.freeRerolls -= 1; this._fillShop(false); return { ok: true }; }
    const cost = this.rerollCost();
    if (this.money < cost) return { ok: false, reason: 'money' };
    this.money -= cost; this.shop.rerolls += 1; this._fillShop(false);
    return { ok: true };
  }

  // ---- Gói: mở ra chọn 1 trong N (hoặc bỏ qua)
  _openPack(o) {
    const cfg = this.config.shop; const n = cfg.packChoices;
    const choices = [];
    if (o.pack === 'bua') {
      const owned = new Set(this.charms.map((c) => c.id));
      let pool = D.charms.filter((c) => c.rarity !== 'than' && !owned.has(c.id));
      for (let i = 0; i < n && pool.length; i++) {
        const pick = this._rollRarity(pool);
        pool = pool.filter((c) => c.id !== pick.id);
        choices.push({ kind: 'charm', id: pick.id, variant: this._rollVariant(), base: pick.price });
      }
    } else if (o.pack === 'quan') { // Gói Quân: thêm 1 quân mới (có thể đã phù phép, đóng triện) vào bộ bài
      const ranks = D.ranks.filter((r) => r.perColor > 0).map((r) => r.id);
      const enhs = Object.keys(this.config.enhancements); const seals = Object.keys(this.config.seals);
      for (let i = 0; i < n; i++) {
        const ch = { kind: 'card', rank: this.rng.pick(ranks), color: this.rng.pick(HO) };
        if (this.rng.next() < 0.45) ch.enh = this.rng.pick(enhs);
        if (this.rng.next() < 0.2) ch.seal = this.rng.pick(seals);
        choices.push(ch);
      }
    } else {
      const hs = this._queHands(n);
      for (const h of hs) choices.push({ kind: 'que', hand: h });
    }
    this.pack = { pack: o.pack, choices };
    this.phase = 'pack';
  }
  pickPack(index, replaceUid) {
    this._need('pack');
    const back = () => { this.pack = null; if (this.packReturn === 'next') { this.packReturn = null; this._nextAi(); } else this.phase = 'shop'; };
    if (index === null || index === undefined) { back(); return { ok: true, skipped: true }; }
    const c = this.pack.choices[index];
    if (!c) throw new Error('Lựa chọn không tồn tại');
    if (c.kind === 'charm') {
      if (c.variant !== 'ran' && this.usedSlots() >= this.slots) {
        const i = this.charms.findIndex((x) => x.uid === replaceUid);
        if (i < 0) throw new Error('Hết ô bùa: chọn một bùa để thay');
        this.charms.splice(i, 1);
      }
      this._addCharm(c.id, c.variant, c.base);
    } else if (c.kind === 'card') {
      const card = { id: `${c.color}-${c.rank}-p${this.uidCounter++}`, color: c.color, rank: c.rank };
      if (c.enh) card.enh = c.enh; if (c.seal) card.seal = c.seal;
      this.deck.push(card);
    } else this.levelUp(c.hand);
    back();
    return { ok: true, picked: c };
  }

  // ---- Ấn: sửa bộ bài vĩnh viễn. targets = mảng id quân trong this.deck
  applyAn(anId, targets) {
    const a = AN[anId];
    if (!a) throw new Error('Không có Ấn này');
    if (!Array.isArray(targets) || targets.length < 1 || targets.length > a.max) throw new Error(`Chọn từ 1 đến ${a.max} quân`);
    const cards = targets.map((id) => this.deck.find((c) => c.id === id));
    if (cards.some((c) => !c) || new Set(targets).size !== targets.length) throw new Error('Quân không hợp lệ');
    if (anId === 'tru_ta' && this.deck.length - cards.length < this.config.minDeck) throw new Error(`Bộ bài không được dưới ${this.config.minDeck} quân`);
    for (const c of cards) {
      if (anId === 'nhan_ban') this.deck.push({ ...c, id: `${c.color}-${c.rank}-x${this.uidCounter++}` });
      else if (anId === 'tru_ta') this.deck.splice(this.deck.indexOf(c), 1);
      else if (anId === 'dao_sac') c.color = NEXT_HO[c.color];
      else if (a.seal) c.seal = a.seal; // triện: một quân một triện, đóng cùng phù phép
      else c.enh = anId; // ngoc | kim | son | thep | linh | luu_ly (thay phù phép cũ nếu có)
    }
  }

  buy(offerUid, targets) {
    this._need('shop');
    const i = this.shop.offers.findIndex((o) => o.uid === offerUid);
    if (i < 0) return { ok: false, reason: 'missing' };
    const o = this.shop.offers[i];
    if (this.money < o.price) return { ok: false, reason: 'money' };
    if (o.kind === 'pack') {
      this.money -= o.price; this.shop.offers.splice(i, 1);
      this._openPack(o);
      return { ok: true, pack: true };
    }
    if (o.kind === 'phu') {
      this.money -= o.price; this.vouchers.push(o.id); this.voucherOffer.bought = true;
      if (PHU[o.id].slotsBonus) this.slots = Math.min(this.config.maxSlots, this.slots + PHU[o.id].slotsBonus);
      if (PHU[o.id].consumableSlotsBonus) this.consumableSlots = Math.min(4, this.consumableSlots + PHU[o.id].consumableSlotsBonus);
      this.shop.offers.splice(i, 1); this._reprice();
      return { ok: true, phu: o.id };
    }
    if (o.kind === 'cons') {
      if (this.consumables.length >= this.consumableSlots) return { ok: false, reason: 'full' };
      this.money -= o.price;
      this.consumables.push({ uid: this.uidCounter++, id: o.id });
      this.shop.offers.splice(i, 1);
      return { ok: true, cons: o.id };
    }
    if (o.kind === 'charm') {
      if (o.variant !== 'ran' && this.usedSlots() >= this.slots) return { ok: false, reason: 'full' };
      this.money -= o.price;
      this._addCharm(o.id, o.variant, o.price);
    } else if (o.kind === 'an') {
      this.applyAn(o.id, targets); // ném lỗi nếu mục tiêu sai, khi đó chưa trừ tiền
      this.money -= o.price;
    } else {
      this.money -= o.price;
      this.levelUp(o.hand);
    }
    this.shop.offers.splice(i, 1);
    return { ok: true };
  }

  sell(charmUid) {
    const i = this.charms.findIndex((c) => c.uid === charmUid);
    if (i < 0) return { ok: false };
    this.money += this.charms[i].sell;
    for (const c of this.charms) { if (c.uid !== charmUid) { const d = charmDefs[c.id]; if (d.onCharmSell) d.onCharmSell(c.state, this); } }
    this.charms.splice(i, 1);
    return { ok: true };
  }

  // Sắp xếp lại thứ tự bùa (thứ tự quyết định thứ tự tính điểm)
  moveCharm(from, to) {
    if (from < 0 || to < 0 || from >= this.charms.length || to >= this.charms.length) return;
    const [c] = this.charms.splice(from, 1);
    this.charms.splice(to, 0, c);
  }

  // ---- bỏ qua Ải Thường / Ải Lớn trước khi đánh: không có tiền thưởng, không vào chợ, đổi lấy Thẻ (xem trước ở màn chọn ải)
  canSkip() {
    const r = this.round;
    return this.phase === 'playing' && !r.acted && this.config.skip.allowed.includes(r.kind);
  }
  skipAi() {
    if (!this.canSkip()) throw new Error('Không bỏ qua được ải này');
    const r = this.round;
    for (const c of this.charms) { const d = charmDefs[c.id]; if (d.onSkip) d.onSkip(c.state, this); }
    const tag = this.skipTagFor(r.chang, r.aiIdx);
    this.history.push({ chang: r.chang, aiIdx: r.aiIdx, kind: r.kind, boss: null, target: r.target, score: 0, outcome: 'skip', unused: 0, tag });
    this.lastSkip = { tag };
    if (tag === 'que') {
      this.skipOffer = this._queHands(this.config.skip.queChoices);
      this.phase = 'skip';
      return { tag, offer: this.skipOffer };
    }
    if (tag === 'goi') { // mở ngay Gói Bùa miễn phí, xong thì sang ải kế
      this.packReturn = 'next'; this._openPack({ pack: 'bua' });
      this.lastSkip = { tag, pack: true }; return this.lastSkip;
    }
    if (tag === 'dautu') {
      this.pendingInvest += this.config.skip.investAmount;
      this.lastSkip = { tag, invest: this.config.skip.investAmount }; this._nextAi(); return this.lastSkip;
    }
    if (tag === 'nhanh') {
      const n = this.history.filter((h) => h.outcome === 'skip').length; const m = n * this.config.skip.speedPer;
      this.money += m; this.lastSkip = { tag, money: m, skips: n }; this._nextAi(); return this.lastSkip;
    }
    if (tag === 'cap') {
      const h = this.rng.pick(this.unlockedHands());
      for (let i = 0; i < this.config.skip.capLevels; i++) this.levelUp(h);
      this.lastSkip = { tag, hand: h, levels: this.config.skip.capLevels }; this._nextAi(); return this.lastSkip;
    }
    if (tag === 'cons') {
      if (this.consumables.length < this.consumableSlots) {
        const pick = this.rng.pick(D.consumables);
        this.consumables.push({ uid: this.uidCounter++, id: pick.id });
        this.lastSkip = { tag, consId: pick.id };
      } else {
        this.money += this.config.skip.moneyTag;
        this.lastSkip = { tag, money: this.config.skip.moneyTag, fallback: true };
      }
      this._nextAi(); return this.lastSkip;
    }
    if (tag === 'bua' && this.usedSlots() < this.slots) {
      const owned = new Set(this.charms.map((c) => c.id));
      const pool = D.charms.filter((c) => c.rarity === 'hiem' && !owned.has(c.id));
      if (pool.length) {
        const pick = this.rng.pick(pool);
        this._addCharm(pick.id, null, pick.price);
        this.lastSkip = { tag, charmId: pick.id };
        this._nextAi();
        return this.lastSkip;
      }
    }
    this.money += this.config.skip.moneyTag; // Thẻ Tiền, hoặc Thẻ Bùa khi đầy ô
    this.lastSkip = { tag, money: this.config.skip.moneyTag, fallback: tag === 'bua' };
    this._nextAi();
    return this.lastSkip;
  }
  pickSkip(hand) {
    this._need('skip');
    if (!this.skipOffer.includes(hand)) throw new Error('Quẻ không nằm trong lựa chọn');
    this.levelUp(hand);
    this.lastSkip = { tag: 'que', hand };
    this.skipOffer = null;
    this._nextAi();
  }

  // Xếp tay bài (thứ tự tay bài cũng là thứ tự tính điểm từ trái sang phải)
  sortHand(mode) {
    const ord = (c) => R[c.rank].order;
    const col = (c) => HO.indexOf(c.color);
    this.round.hand.sort(mode === 'color' ? (a, b) => col(a) - col(b) || ord(b) - ord(a) : (a, b) => ord(b) - ord(a) || col(a) - col(b));
  }

  // ---- dùng vật phẩm tiêu hao. targets = [] hoặc [cardId] nếu target === 'card_hand'
  useConsumable(uid, targets) {
    this._need('playing');
    const i = this.consumables.findIndex((c) => c.uid === uid);
    if (i < 0) throw new Error('Không tìm thấy vật phẩm tiêu hao');
    const cons = this.consumables[i];
    const def = CONS[cons.id];
    const r = this.round;
    if (def.target === 'card_hand') {
      if (!Array.isArray(targets) || targets.length !== 1) throw new Error('Cần chọn 1 quân trên tay');
      if (!r.hand.find((c) => c.id === targets[0])) throw new Error('Quân không ở trên tay');
    }
    const id = cons.id; let result = { ok: true };
    const enhMap = { phu_ngoc: 'ngoc', phu_kim: 'kim', phu_thep: 'thep', phu_son: 'son', phu_linh: 'linh' };
    const sealMap = { phu_trien_do: 'do', phu_trien_vang: 'vang', phu_trien_lam: 'lam' };
    if (enhMap[id]) {
      const enh = enhMap[id]; const cardId = targets[0];
      const hc = r.hand.find((c) => c.id === cardId); if (hc) hc.enh = enh;
      const dc = this.deck.find((c) => c.id === cardId); if (dc) dc.enh = enh;
      result = { ok: true, enh, cardId };
    } else if (sealMap[id]) {
      const seal = sealMap[id]; const cardId = targets[0];
      const hc = r.hand.find((c) => c.id === cardId); if (hc) hc.seal = seal;
      const dc = this.deck.find((c) => c.id === cardId); if (dc) dc.seal = seal;
      result = { ok: true, seal, cardId };
    } else if (id === 'phu_nhan') {
      const cardId = targets[0];
      const hc = r.hand.find((c) => c.id === cardId);
      if (hc && !hc.junk) {
        const copy = { ...hc, id: `${hc.color}-${hc.rank}-x${this.uidCounter++}` };
        delete copy.tmp;
        this.deck.push(copy);
      }
      result = { ok: true, cardId };
    } else if (id === 'phu_tay') {
      r.hand = r.hand.filter((c) => !c.junk);
      r.draw = r.draw.filter((c) => !c.junk);
      this.junkImmune = true;
      this._refill();
      result = { ok: true };
    } else if (id.startsWith('lt_')) {
      this.levelUp(def.hand);
      result = { ok: true, hand: def.hand };
    } else if (id === 'phep_than_tai') {
      this.money += 4;
      result = { ok: true, money: 4 };
    } else if (id === 'phep_doi_van') {
      r.discardPile.push(...r.hand);
      r.hand = [];
      this._refill();
      result = { ok: true, redrawn: r.hand.length };
    } else if (id === 'phep_tien_truong') {
      r.freePlay = true;
      result = { ok: true };
    } else if (id === 'phep_hoi_bai') {
      const drawn = [];
      for (let n = 0; n < 2 && r.draw.length; n++) drawn.push(r.draw.pop());
      r.hand.push(...drawn);
      result = { ok: true, drawn: drawn.length };
    } else if (id === 'phep_boc_phep') {
      if (r.disabledUid != null) { r.disabledUid = null; result = { ok: true, restored: true }; }
      else { r.pendingMult = (r.pendingMult || 0) + 20; result = { ok: true, mult: 20 }; }
    }
    this.consumables.splice(i, 1);
    return result;
  }

  leaveShop() {
    this._need('shop');
    this.shop = null;
    this._nextAi();
  }

  _nextAi() {
    this.aiIdx += 1;
    if (this.aiIdx >= this.config.aiKinds.length) { this.aiIdx = 0; this.chang += 1; }
    this.startAi();
  }
}

module.exports = { Run, detect, handValue, makeDeck, DATA: D, R, H, CH, AN, PHU, CONS, charmDefs, HO, HO_VI, YEU_VI, NEXT_HO, cardName };
