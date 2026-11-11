'use strict';
const assert = require('assert');
const { Run, detect, makeDeck, DATA, CH, PHU, H: H_ } = require('../src/engine.js');

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; } catch (e) { console.error('FAIL:', name, '\n', e.stack); process.exitCode = 1; } };

const card = (s) => { const [color, rank, i] = s.split('-'); return { id: s, color, rank, i: +i }; };
const cards = (...ss) => ss.map(card);

// Dựng run với tay bài cố định để test tính điểm
function rig(handIds, charms = [], levels = {}) {
  const run = new Run({ seed: 7 });
  for (const k of Object.keys(run.handLevels)) run.handLevels[k] = Math.max(1, run.handLevels[k]); // các test điểm số mặc định mở hết bộ
  run.round.hand = cards(...handIds);
  run.round.draw = [];
  run.charms = [];
  for (const c of charms) {
    const [id, variant] = Array.isArray(c) ? c : [c, null];
    run._addCharm(id, variant, 4);
  }
  Object.assign(run.handLevels, levels);
  return run;
}
const score = (run, ids) => {
  const played = run.round.hand.filter((c) => ids.includes(c.id));
  const held = run.round.hand.filter((c) => !ids.includes(c.id));
  return run._calc(played, held, true);
};

test('hai Tướng cùng màu là đôi (sau khi gộp pair_same → pair_mixed)', () => {
  const a = { id: 'van-n9-0', color: 'van', rank: 'n9' };
  const b = { id: 'tmp-van-n9-9', color: 'van', rank: 'n9' };
  assert.strictEqual(detect([a, b]).type, 'pair_mixed');
});

test('điểm cơ bản không bùa: quân lẻ Tốt = (5+3)×1', () => {
  const run = rig(['van-n3-0', 'van-n9-0']);
  assert.strictEqual(score(run, ['van-n3-0']).score, 8);
});

test('Ngồi Chờ: +4 chip cho mỗi quân còn trên tay', () => {
  const run = rig(['van-n3-0', 'van-n4-0', 'wan-n4-0'], ['ngoi_cho']);
  assert.strictEqual(score(run, ['van-n3-0']).score, (8 + 8) * 1);
});

test('Tranh Chi chỉ kích hoạt ở lượt cuối', () => {
  const run = rig(['van-n3-0'], ['tranh_chi']);
  run.round.handsLeft = 2;
  assert.strictEqual(score(run, ['van-n3-0']).score, 8);
  run.round.handsLeft = 1;
  assert.strictEqual(score(run, ['van-n3-0']).score, Math.floor(8 * 2.5));
});

test('trùm cấm bộ, chế độ zero: bộ bị cấm ghi 0 điểm', () => {
  const run = rig(['van-n8-0', 'van-n8-1']);
  run.config.bossBan = 'zero';
  run.round.boss = DATA.bosses.pool.find((b) => b.id === 'chan_tinh');
  const r = score(run, ['van-n8-0', 'van-n8-1']);
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.banned, true);
});

test('Phao Cứu Sinh cứu ải khi đạt 70% mục tiêu', () => {
  const run = new Run({ seed: 5 });
  run._addCharm('phao_cuu_sinh', null, 9);
  run.round.target = 100;
  run.round.score = 75;
  run.round.handsLeft = 0;
  assert.strictEqual(run._checkEnd(), 'shop');
  assert.strictEqual(run.charms.length, 0);
});

test('Lên Hạng nâng bộ đánh nhiều nhất cuối ải', () => {
  const run = new Run({ seed: 5 });
  run._addCharm('len_hang', null, 5);
  run.round.playedTypes = { single: 1, pair_mixed: 3 };
  run.round.score = 10 ** 9;
  run._winAi('clear');
  assert.strictEqual(run.handLevels.pair_mixed, 2);
});

test('Thêm Chỗ Ngồi tăng ô bùa sau khi hạ trùm', () => {
  const run = new Run({ seed: 5 });
  run._addCharm('them_cho_ngoi', null, 6);
  run.aiIdx = 2; run.startAi();
  assert.strictEqual(run.round.kind, 'trum');
  run.round.score = 10 ** 9;
  run._winAi('clear');
  assert.strictEqual(run.slots, 6);
});

test('một ván hoàn chỉnh chạy được bằng bot đơn giản và không ném lỗi', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const run = new Run({ seed });
    let guard = 0;
    while (run.phase !== 'lost' && run.phase !== 'won' && guard++ < 2000) {
      if (run.phase === 'playing') {
        const plays = run.enumeratePlays().sort((a, b) => b.score - a.score);
        run.play(plays[0].ids);
      } else if (run.phase === 'than') {
        run.pickThan(run.thanOffers[0], run.charms[0] && run.charms[0].uid);
      } else if (run.phase === 'shop') {
        for (const o of run.shop.offers.slice()) if (o.kind === 'charm' || o.kind === 'que') run.buy(o.uid);
        run.leaveShop();
      }
    }
    assert.ok(run.phase === 'lost' || run.phase === 'won', `seed ${seed} bị kẹt ở ${run.phase}`);
  }
});

test('cùng seed cho cùng kết quả', () => {
  const play = (seed) => {
    const run = new Run({ seed });
    const plays = run.enumeratePlays().sort((a, b) => b.score - a.score);
    return plays[0].ids.join(',') + ':' + plays[0].score;
  };
  assert.strictEqual(play(42), play(42));
});


test('Ấn Kim/Ngọc/Son tác động khi quân ghi điểm', () => {
  const run = rig(['van-n3-0']);
  run.round.hand[0].enh = 'ngoc';
  assert.strictEqual(score(run, ['van-n3-0']).score, 5 + 3 + 30);
  run.round.hand[0].enh = 'kim';
  assert.strictEqual(score(run, ['van-n3-0']).score, 8 * 5);
  run.round.hand[0].enh = 'son';
  assert.strictEqual(score(run, ['van-n3-0']).score, Math.floor(8 * 1.5));
});

test('Ấn Trừ Tà không cho bộ bài xuống dưới 20 quân', () => {
  const run = new Run({ seed: 9 });
  run.deck = run.deck.slice(0, 21);
  assert.throws(() => run.applyAn('tru_ta', [run.deck[0].id, run.deck[1].id]));
});

test('mua Ấn ở chợ cần chọn quân, sai thì không mất tiền', () => {
  const run = new Run({ seed: 4 });
  run.round.score = 10 ** 9; run._winAi('clear');
  run.shop.offers.push({ uid: 999, kind: 'an', id: 'kim', price: 5 });
  run.money = 10;
  assert.throws(() => run.buy(999, []));
  assert.strictEqual(run.money, 10);
  assert.ok(run.buy(999, ['van-n4-0']).ok);
  assert.strictEqual(run.money, 5);
  assert.strictEqual(run.deck.find((c) => c.id === 'van-n4-0').enh, 'kim');
});

test('tiền lãi: 1 đồng mỗi 5 đồng, trần 5; Heo Đất nâng trần lên 10', () => {
  const run = new Run({ seed: 5 });
  run.money = 37; run.round.score = 10 ** 9; run.round.handsLeft = 0;
  run._winAi('clear');
  assert.strictEqual(run.lastReward.interest, 5);
  const run2 = new Run({ seed: 5 });
  run2._addCharm('heo_dat', null, 5);
  run2.money = 37; run2.round.score = 10 ** 9; run2.round.handsLeft = 0;
  run2._winAi('clear');
  assert.strictEqual(run2.lastReward.interest, 7);
});

test('bỏ qua ải theo Thẻ: cả 7 loại Thẻ đều hoạt động đúng và xem trước khớp thực tế', () => {
  const seen = {};
  for (let seed = 1; seed <= 120; seed++) {
    const run = new Run({ seed });
    const money = run.money;
    const tag = run.skipTagFor(run.chang, run.aiIdx);
    assert.strictEqual(run.blinds()[0].tag, tag, 'xem trước phải khớp');
    assert.ok(DATA.config.skip.tags.includes(tag));
    const levels = () => Object.values(run.handLevels).reduce((x, y) => x + y, 0);
    const base = levels();
    const res = run.skipAi();
    assert.strictEqual(res.tag, tag); seen[tag] = (seen[tag] || 0) + 1;
    if (tag === 'que') {
      assert.strictEqual(run.phase, 'skip');
      const before = run.handLevels[res.offer[0]];
      run.pickSkip(res.offer[0]);
      assert.strictEqual(run.handLevels[res.offer[0]], before + 1);
      assert.strictEqual(run.money, money);
    } else if (tag === 'tien') assert.strictEqual(run.money, money + 6);
    else if (tag === 'bua') {
      assert.strictEqual(run.charms.length, 1);
      assert.strictEqual(CH[run.charms[0].id].rarity, 'hiem');
    } else if (tag === 'goi') {
      assert.strictEqual(run.phase, 'pack'); assert.strictEqual(run.pack.pack, 'bua');
      assert.strictEqual(run.round.kind, 'thuong', 'chưa sang ải kế khi chưa chọn xong Gói');
      run.pickPack(null);
    } else if (tag === 'dautu') assert.strictEqual(run.pendingInvest, 12);
    else if (tag === 'nhanh') assert.strictEqual(run.money, money + 2);
    else if (tag === 'cap') { assert.strictEqual(levels(), base + 2); assert.strictEqual(Math.max(...Object.values(run.handLevels)), 3); }
    assert.strictEqual(run.phase, 'playing');
    assert.strictEqual(run.round.kind, 'lon');
  }
  assert.ok(Object.keys(seen).length === 7, JSON.stringify(seen));
});

test('màn chọn ải: blinds() trả ba ải của chặng với trạng thái đúng', () => {
  const run = new Run({ seed: 2 });
  let b = run.blinds();
  assert.deepStrictEqual(b.map((x) => x.status), ['now', 'next', 'next']);
  assert.deepStrictEqual(b.map((x) => x.kind), ['thuong', 'lon', 'trum']);
  assert.ok(b[2].boss && b[2].tag === null && b[0].tag);
  assert.strictEqual(b[0].target, run.table[0][0]);
  run.round.score = 10 ** 9; run._winAi('clear'); run.leaveShop();
  b = run.blinds();
  assert.deepStrictEqual(b.map((x) => x.status), ['done', 'now', 'next']);
});

test('không bỏ qua được sau khi đã đánh hoặc bỏ bài', () => {
  const run = new Run({ seed: 6 });
  run.discard([run.round.hand[0].id]);
  assert.strictEqual(run.canSkip(), false);
});

test('xếp tay bài theo loại và theo màu', () => {
  const run = new Run({ seed: 2 });
  run.sortHand('rank');
  const ords = run.round.hand.map((c) => ({ general: 7, advisor: 6, elephant: 5, chariot: 4, cannon: 3, horse: 2, pawn: 1 })[c.rank]);
  assert.deepStrictEqual(ords, ords.slice().sort((a, b) => b - a));
  run.sortHand('color');
  const cols = run.round.hand.map((c) => c.color);
  assert.deepStrictEqual(cols, cols.slice().sort((a, b) => (a === 'van' ? 0 : 1) - (b === 'van' ? 0 : 1)));
});


test('quân Tạp không ghép được bộ nào, kể cả hai quân Tạp', () => {
  const j = (i) => ({ id: `junk-${i}`, color: 'van', rank: 'junk', junk: true });
  const d = detect([j(1), j(2)]);
  assert.strictEqual(d.type, 'single');
  assert.strictEqual(d.cards.length, 1);
  const run = rig(['van-n3-0']);
  run.round.hand.push(j(3));
  run.round.hand.push(j(4));
  assert.strictEqual(run._calc([run.round.hand[1], run.round.hand[2]], [], true).hand.cards.length, 1);
});

test('quân Tạp không kích hoạt bùa quân trên tay', () => {
  const run = rig(['van-n3-0', 'wan-n4-0'], ['ngoi_cho']);
  run.round.hand.push({ id: 'junk-9', color: 'van', rank: 'junk', junk: true });
  assert.strictEqual(score(run, ['van-n3-0']).score, (5 + 3 + 4) * 1); // chỉ Mã được tính, quân Tạp thì không
});

test('số quân Tạp theo chặng: 0 trước chặng 2, tăng dần, trùm cộng thêm, có trần', () => {
  const run = new Run({ seed: 1, difficulty: 'kho' });
  assert.strictEqual(run.junkFor(1, 'trum'), 0);
  const avg = (chang, kind) => { let t = 0; for (let i = 0; i < 400; i++) t += run.junkFor(chang, kind); return t / 400; };
  assert.ok(Math.abs(avg(2, 'thuong') - 0.75) < 0.1);
  assert.ok(Math.abs(avg(4, 'thuong') - 2.25) < 0.15);
  assert.ok(avg(4, 'trum') > avg(4, 'thuong') + 0.8);
  assert.ok(avg(8, 'trum') <= 8.0001);
  const easy = new Run({ seed: 1, difficulty: 'de' });
  assert.strictEqual(easy.junkFor(8, 'trum'), 0);
});

test('mức Dễ không có quân Tạp ở bất kỳ ải nào, mức độ khó sai thì báo lỗi', () => {
  const run = new Run({ seed: 4, difficulty: 'de' });
  for (let c = 1; c <= 8; c++) for (const k of ['thuong', 'lon', 'trum']) assert.strictEqual(run.junkFor(c, k), 0);
  assert.throws(() => new Run({ seed: 4, difficulty: 'khongco' }));
});

test('Dội Trống: quân ghi điểm trái nhất được tính 3 lần', () => {
  const run = rig(['van-n3-0', 'van-n3-1'], ['doi_trong']);
  const r = score(run, ['van-n3-0']);
  assert.strictEqual(r.score, (5 + 3 + 3 + 3) * 1);
  assert.strictEqual(r.steps.filter((x) => x.kind === 'again').length, 2);
  const two = rig(['van-n3-0', 'van-n3-1'], ['doi_trong']);
  assert.strictEqual(score(two, ['van-n3-0', 'van-n3-1']).score, (10 + 9 + 3) * 2);
});

test('trùm Quỷ Móc: mỗi lần đánh bị móc 2 quân trên tay; Quỷ Thu Thuế: mất 1 đồng mỗi quân đánh', () => {
  const run = rig(['van-n3-0', 'van-n3-1', 'van-n4-0', 'van-n4-1', 'wan-n4-0', 'wan-n8-0']);
  run.round.boss = DATA.bosses.pool.find((b) => b.id === 'quy_moc'); run.round.draw = [];
  const out = run.play(['van-n3-0']);
  assert.strictEqual(out.hooked.length, 2);
  assert.strictEqual(run.round.hand.length, 3);
  const t = rig(['van-n3-0', 'van-n3-1', 'van-n4-0']);
  t.round.boss = DATA.bosses.pool.find((b) => b.id === 'quy_thue'); t.round.draw = []; t.money = 5;
  const o = t.play(['van-n3-0', 'van-n3-1']);
  assert.strictEqual(o.tax, 2); assert.strictEqual(t.money, 3);
  t.money = 1; t.round.hand.push({ id: 'van-n3-9', color: 'van', rank: 'n3' });
  assert.strictEqual(t.play(['van-n3-9']).tax, 1); assert.strictEqual(t.money, 0);
});

test('Phù: thêm lượt/bỏ/chợ rộng/lãi dày/giảm giá có hiệu lực, mỗi chặng một Phù, mua rồi không còn', () => {
  const run = new Run({ seed: 8 });
  run.round.score = 10 ** 9; run._winAi('clear');
  const vo = run.shop.offers.find((o) => o.kind === 'phu');
  assert.ok(vo);
  run.money = 99;
  run.vouchers = []; run.buy(vo.uid);
  assert.ok(run.vouchers.includes(vo.id));
  assert.ok(!run.shop.offers.some((o) => o.kind === 'phu'));
  run.leaveShop(); run.round.score = 10 ** 9; run._winAi('clear');
  assert.ok(!run.shop.offers.some((o) => o.kind === 'phu'), 'cùng chặng, đã mua thì không bán lại');
  const r2 = new Run({ seed: 1 });
  r2.vouchers.push('them_luot', 'them_bo'); r2.startAi();
  assert.strictEqual(r2.round.handsMax, 5); assert.strictEqual(r2.round.discardsLeft, 4);
  r2.vouchers.push('lai_day');
  r2.money = 100; r2.round.score = 10 ** 9; r2.round.handsLeft = 0; r2._winAi('clear');
  assert.strictEqual(r2.lastReward.interest, 10);
  const r3 = new Run({ seed: 2 });
  r3.round.score = 10 ** 9; r3._winAi('clear');
  const before = r3.shop.offers.filter((o) => o.kind === 'charm').map((o) => o.price);
  r3.vouchers.push('gia_re'); r3._reprice();
  const after = r3.shop.offers.filter((o) => o.kind === 'charm').map((o) => o.price);
  after.forEach((p, i) => assert.strictEqual(p, Math.max(1, Math.ceil(before[i] * 0.75))));
  const r4 = new Run({ seed: 3 }); r4.vouchers.push('cho_rong'); r4.round.score = 10 ** 9; r4._winAi('clear');
  assert.strictEqual(r4.shop.offers.filter((o) => o.kind === 'charm').length, 4);
});

test('quân Lưu Ly: ×2 hệ số khi ghi điểm, 1/4 cơ hội vỡ và mất khỏi bộ bài', () => {
  const run = rig(['van-n3-0']);
  run.round.hand[0].enh = 'luu_ly';
  assert.strictEqual(score(run, ['van-n3-0']).score, 16);
  let broke = 0;
  for (let i = 1; i <= 400; i++) {
    const r = new Run({ seed: i }); r.round.draw = [];
    const card = r.deck[0]; card.enh = 'luu_ly'; r.round.hand = [{ ...card }];
    const n = r.deck.length; r.play([card.id]);
    if (r.deck.length === n - 1) broke++;
  }
  assert.ok(broke > 70 && broke < 130, 'khoảng 100/400, thực tế ' + broke);
});

test('Thẻ Đầu Tư trả 12 đồng sau khi hạ trùm kế tiếp; Thẻ Tốc Hành tăng theo số lần bỏ qua', () => {
  const run = new Run({ seed: 1 });
  run.pendingInvest = 12; run.aiIdx = 1; run.startAi();
  run.round.score = 1e9; run._winAi('clear');
  assert.strictEqual(run.lastReward.invest, 0, 'chưa phải trùm thì chưa trả');
  run.leaveShop();
  assert.strictEqual(run.round.kind, 'trum');
  const m = run.money; run.round.score = 1e9; run.round.handsLeft = 0; run._winAi('clear');
  assert.strictEqual(run.lastReward.invest, 12); assert.strictEqual(run.pendingInvest, 0);
  assert.ok(run.money >= m + 12);
  const r2 = new Run({ seed: 2 });
  r2.history.push({ outcome: 'skip' }, { outcome: 'skip' });
  r2.config.skip.tags = ['nhanh']; r2.skipTagFor = () => 'nhanh';
  const m2 = r2.money; r2.skipAi();
  assert.strictEqual(r2.money, m2 + 6, '3 lần bỏ qua x 2 đồng');
});

test('Gói Thẻ: chọn xong Gói thì mới sang ải kế, bỏ Gói cũng sang ải kế', () => {
  const run = new Run({ seed: 4 });
  run.skipTagFor = () => 'goi';
  run.skipAi();
  const c0 = run.pack.choices[0];
  run.pickPack(0, run.charms.length ? run.charms[0].uid : undefined);
  assert.strictEqual(run.phase, 'playing'); assert.strictEqual(run.round.kind, 'lon');
  assert.strictEqual(run.packReturn, null);
  assert.ok(run.charms.some((c) => c.id === c0.id));
});

test('Gói Quân: mở 3 quân, chọn 1 thêm vào bộ bài (có thể mang phù phép, triện)', () => {
  const run = new Run({ seed: 8 });
  run.round.score = 1e9; run._winAi('clear'); run.money = 50;
  run._openPack({ pack: 'quan' });
  assert.strictEqual(run.pack.choices.length, 3);
  assert.ok(run.pack.choices.every((c) => c.kind === 'card' && c.rank && c.color));
  const n = run.deck.length; const pick = run.pack.choices[1];
  run.pickPack(1);
  assert.strictEqual(run.deck.length, n + 1);
  const added = run.deck[run.deck.length - 1];
  assert.strictEqual(added.rank, pick.rank); assert.strictEqual(added.enh, pick.enh); assert.strictEqual(added.seal, pick.seal);
  assert.strictEqual(run.phase, 'shop');
  const kinds = new Set(); for (let s = 1; s <= 80; s++) { const r = new Run({ seed: s }); r.round.score = 1e9; r._winAi('clear'); r.shop.offers.filter((o) => o.kind === 'pack').forEach((o) => kinds.add(o.pack)); }
  assert.ok(kinds.has('quan') && kinds.has('bua') && kinds.has('que'), [...kinds].join());
});

test('Phù mới: Thêm Ô Bùa tăng ô, Chợ Quẻ bán thêm Quẻ', () => {
  const run = new Run({ seed: 3 });
  run.vouchers.push('cho_que'); run.round.score = 1e9; run._winAi('clear');
  assert.strictEqual(run.shop.offers.filter((o) => o.kind === 'que').length, 2);
  const r2 = new Run({ seed: 3 }); r2.round.score = 1e9; r2._winAi('clear'); r2.money = 99;
  r2.voucherOffer = { chang: r2.chang, id: 'o_bua', bought: false };
  r2.shop.offers.push({ uid: 777, kind: 'phu', id: 'o_bua', base: 15, price: 15 });
  r2.buy(777);
  assert.strictEqual(r2.slots, 6);
  r2.slots = 7; r2.shop.offers.push({ uid: 778, kind: 'phu', id: 'o_bua', base: 15, price: 15 }); r2.vouchers = []; r2.buy(778);
  assert.strictEqual(r2.slots, 7, 'không vượt trần maxSlots');
});


test('ngũ quý: 5 quân cùng loại không phải Tốt (vd 5 Mã nhờ Nhân Bản) vẫn nhận ngũ quý', () => {
  const five = [{ id: 'a', rank: 'n4', color: 'wan' }, { id: 'b', rank: 'n4', color: 'wan' }, { id: 'c', rank: 'n4', color: 'wan' }, { id: 'd', rank: 'n4', color: 'van' }, { id: 'e', rank: 'n4', color: 'van' }];
  assert.strictEqual(detect(five).type, 'five');
});

test('khóa bộ: Nhất Thống bỏ qua khóa; không có khóa thì Quẻ chỉ đưa bộ đã mở', () => {
  const r = new Run({ seed: 5 });
  // lockHands: false → không có bộ nào bị khóa lúc khởi đầu
  assert.strictEqual(r.lockedHands().length, 0);
  // _queHands hoạt động đúng khi chỉ có bộ đã mở
  assert.ok(r._queHands(3).every((h) => r.handLevels[h] >= 1));
  // Nhất Thống (allSame) bỏ qua khóa: bộ lẫn màu được tính như bộ cùng màu
  const four = cards('van-n4-0', 'van-n4-1', 'wan-n4-0', 'wan-n4-1');
  assert.strictEqual(detect(four, true, r.handLevels).type, 'four');
  // đặt thủ công khóa để kiểm tra _queHands ưu tiên bộ khóa
  r.handLevels.four = 0;
  for (let i = 0; i < 20; i++) assert.ok(r._queHands(3).some((h) => r.handLevels[h] === 0));
  r.levelUp('four');
  assert.strictEqual(r.lockedHands().length, 0);
  assert.ok(r._queHands(3).every((h) => r.handLevels[h] >= 1));
});

test('xem trước báo bộ còn khóa: 3 Tốt + đôi Xe → Cù lũ (khóa thủ công), tính tạm Phu bí', () => {
  const r = new Run({ seed: 11 });
  r.handLevels.full = 0; // giả lập khóa thủ công
  r.round.hand = cards('van-n6-0', 'van-n6-1', 'van-n3-0', 'van-n3-1', 'wan-n3-0');
  const p = r.preview(r.round.hand.map((c) => c.id));
  assert.strictEqual(p.type, 'three'); assert.strictEqual(p.lockedBetter, 'full');
  r.levelUp('full');
  const p2 = r.preview(r.round.hand.map((c) => c.id));
  assert.strictEqual(p2.type, 'full'); assert.strictEqual(p2.lockedBetter, null);
});

// ===================================================================== Tổ tôm: bộ bài, bộ, bùa
const ids = (...a) => a;
const fire = (charm, hand, play, opts = {}) => {
  const run = rig(hand, [Array.isArray(charm) ? charm : [charm, null]].map((x) => x[0]));
  if (opts.draw === 0) run.round.draw = []; else run.round.draw = Array.from({ length: opts.draw || 12 }, (_, i) => ({ id: `d${i}`, color: 'van', rank: 'n1' }));
  if (opts.handsLeft != null) run.round.handsLeft = opts.handsLeft;
  const played = run.round.hand.filter((c) => play.includes(c.id)); const held = run.round.hand.filter((c) => !play.includes(c.id));
  const res = run._calc(played, held, true);
  return res.steps.filter((s) => s.charmIdx === 0 && s.kind !== 'variant').map((s) => (s.dChips ? `+${Math.round(s.dChips)}c` : '') + (s.dMult ? `+${s.dMult}m` : '') + (s.xMult ? `x${s.xMult}` : '')).join(',') || '-';
};

test('bộ bài Tổ tôm: 120 lá, 3 họ × 10 số (9 số và lá Yêu) × 4 bản', () => {
  const d = makeDeck();
  assert.strictEqual(d.length, 120);
  for (const ho of ['van', 'sach', 'wan']) assert.strictEqual(d.filter((c) => c.color === ho).length, 40);
  for (let n = 1; n <= 10; n++) assert.strictEqual(d.filter((c) => c.rank === 'n' + n).length, 12);
  assert.strictEqual(new Set(d.map((c) => c.id)).size, 120);
  assert.strictEqual(DATA.charms.length, 66);
});

test('nhận diện bộ: đôi, phu bí, tứ quý, ngũ quý', () => {
  assert.strictEqual(detect(cards('van-n3-0', 'sach-n3-0')).type, 'pair_mixed');
  assert.strictEqual(detect(cards('van-n3-0', 'van-n3-1')).type, 'pair_mixed');
  assert.strictEqual(detect(cards('van-n3-0', 'sach-n3-0', 'wan-n3-0')).type, 'three');
  assert.strictEqual(detect(cards('van-n3-0', 'van-n3-1', 'van-n3-2')).type, 'three');
  assert.strictEqual(detect(cards('van-n5-0', 'van-n5-1', 'van-n5-2', 'van-n5-3')).type, 'four');
  assert.strictEqual(detect(cards('van-n5-0', 'van-n5-1', 'sach-n5-0', 'wan-n5-0')).type, 'four');
  assert.strictEqual(detect(cards('van-n5-0', 'van-n5-1', 'sach-n5-0', 'sach-n5-1', 'wan-n5-0')).type, 'five');
  assert.strictEqual(detect(cards('van-n9-0')).type, 'single');
});

test('nhận diện sảnh: phu dọc cùng họ, sảnh lẫn họ, Yêu là số 10, không nối vòng', () => {
  assert.strictEqual(detect(cards('van-n4-0', 'van-n5-0', 'van-n6-0')).type, 'run3_same');
  assert.strictEqual(detect(cards('van-n4-0', 'sach-n5-0', 'wan-n6-0')).type, 'single', 'sảnh lẫn họ không còn tồn tại → lá lẻ');
  assert.strictEqual(detect(cards('van-n4-0', 'van-n5-0', 'van-n6-0', 'van-n7-0')).type, 'run4_same');
  assert.strictEqual(detect(cards('sach-n3-0', 'sach-n4-0', 'sach-n5-0', 'sach-n6-0', 'sach-n7-0')).type, 'run5_same');
  assert.strictEqual(detect(cards('wan-n8-0', 'wan-n9-0', 'wan-n10-0')).type, 'run3_same', 'Bát–Cửu–Yêu nối nhau');
  assert.notStrictEqual(detect(cards('van-n9-0', 'van-n10-0', 'van-n1-0')).type, 'run3_same', 'Yêu và Nhất không nối vòng');
  assert.strictEqual(detect(cards('van-n1-0', 'van-n3-0', 'van-n5-0', 'van-n7-0', 'van-n9-0')).type, 'flush5');
});

test('nhận diện cù lũ, hai đôi, Tôm, Lèo, Tam Yêu', () => {
  assert.strictEqual(detect(cards('van-n2-0', 'sach-n2-0', 'wan-n2-0', 'van-n8-0', 'sach-n8-0')).type, 'full');
  assert.strictEqual(detect(cards('van-n2-0', 'van-n2-1', 'van-n2-2', 'van-n8-0', 'van-n8-1')).type, 'full');
  assert.strictEqual(detect(cards('van-n2-0', 'sach-n2-0', 'van-n8-0', 'wan-n8-0')).type, 'two_pair');
  assert.strictEqual(detect(cards('van-n2-0', 'van-n2-1', 'van-n8-0', 'van-n8-1')).type, 'two_pair');
  assert.strictEqual(detect(cards('van-n7-0', 'sach-n3-0', 'wan-n3-0')).type, 'tom');
  assert.strictEqual(detect(cards('sach-n8-0', 'wan-n9-0', 'van-n10-0')).type, 'leo');
  assert.strictEqual(detect(cards('van-n10-0', 'sach-n10-0', 'wan-n10-0')).type, 'tam_yeu');
});

test('lá Linh tính là cả ba họ: đôi, phu dọc, cù lũ đều thành bản cùng họ', () => {
  const a = cards('van-n3-0', 'sach-n3-0'); a[1].enh = 'linh';
  assert.strictEqual(detect(a).type, 'pair_mixed');
  const b = cards('van-n4-0', 'sach-n5-0', 'van-n6-0'); b[1].enh = 'linh';
  assert.strictEqual(detect(b).type, 'run3_same');
});

test('Nhất Thống: mọi bộ được tính bản cùng họ; không truyền thì không đổi', () => {
  const m = cards('van-n3-0', 'sach-n3-0');
  assert.strictEqual(detect(m).type, 'pair_mixed');
  assert.strictEqual(detect(m, true).type, 'pair_mixed');
  assert.strictEqual(detect(cards('van-n4-0', 'sach-n5-0', 'wan-n6-0'), true).type, 'run3_same');
});

test('bảng bộ: id duy nhất, lá lẻ cuối, mọi bộ cùng họ > bản lẫn họ tương ứng', () => {
  const hs = DATA.hands; const idl = hs.map((h) => h.id);
  assert.strictEqual(new Set(idl).size, idl.length);
  assert.strictEqual(idl[idl.length - 1], 'single');
  const H_ = Object.fromEntries(hs.map((h) => [h.id, h]));
  for (const h of hs.filter((x) => x.sameOf)) {
    const base = H_[h.sameOf];
    assert.ok(h.chips > base.chips && h.mult >= base.mult && h.lvChips >= base.lvChips && h.lvMult >= base.lvMult, `${h.id} phải hơn ${base.id}`);
  }
});

test('điểm cơ bản: lá lẻ, đôi, phu dọc 3 = (chip bộ + chip lá) × hệ số', () => {
  let r = rig(['van-n1-0']);
  assert.strictEqual(score(r, ['van-n1-0']).score, (5 + 1) * 1);
  r = rig(['van-n4-0', 'van-n4-1']);
  assert.strictEqual(score(r, ['van-n4-0', 'van-n4-1']).score, (10 + 4 + 4) * 2);
  r = rig(['van-n3-0', 'van-n4-0', 'van-n5-0']);
  assert.strictEqual(score(r, ['van-n3-0', 'van-n4-0', 'van-n5-0']).score, (40 + 3 + 4 + 5) * 4);
  r = rig(['sach-n10-0']);
  assert.strictEqual(score(r, ['sach-n10-0']).score, (5 + 12) * 1, 'lá Yêu cho 12 chip');
});

test('khóa bộ: tất cả bộ mở từ đầu; cấp 0 thủ công thì detect bỏ qua; xem trước báo bộ khóa', () => {
  const r = new Run({ seed: 3 });
  // tất cả bộ mở từ đầu, không còn locked:true trong hands.json
  assert.ok(DATA.hands.every((h) => !h.locked), 'không có bộ nào đánh dấu locked');
  assert.strictEqual(r.lockedHands().length, 0);
  for (const id of DATA.hands.map((h) => h.id)) assert.strictEqual(r.handLevels[id], 1, id);
  // đặt thủ công cấp 0 thì detect bỏ qua bộ đó
  const four = cards('van-n5-0', 'van-n5-1', 'sach-n5-0', 'wan-n5-0');
  r.handLevels.four = 0;
  assert.strictEqual(detect(four, false, r.handLevels).type, 'three');
  r.levelUp('four'); assert.strictEqual(r.handLevels.four, 1);
  assert.strictEqual(detect(four, false, r.handLevels).type, 'four');
  // preview báo lockedBetter khi có bộ cấp 0 mạnh hơn bộ đang chọn
  const run = new Run({ seed: 9 });
  run.handLevels.run3_same = 0; // giả lập khóa thủ công
  run.round.hand = cards('van-n3-0', 'van-n4-0', 'van-n5-0');
  const p = run.preview(run.round.hand.map((c) => c.id));
  assert.strictEqual(p.type, 'single'); assert.strictEqual(p.lockedBetter, 'run3_same');
});

// ---- bùa: mỗi bùa thử cả trường hợp cộng và không cộng
const A = ['van-n3-0', 'van-n4-0', 'van-n5-0'];
test('bùa Phu dọc: Nối Liền, Tăng Dần, Thông Suốt, Sảnh Dài, Bí Ngũ', () => {
  assert.strictEqual(fire('noi_lien', A, A), '+8c,+8c,+8c');
  assert.strictEqual(fire('noi_lien', ['van-n3-0', 'sach-n3-0'], ['van-n3-0', 'sach-n3-0']), '-');
  assert.strictEqual(fire('tang_dan', A, A), '+5m');
  assert.strictEqual(fire('tang_dan', ['van-n3-0', 'van-n3-1'], ['van-n3-0', 'van-n3-1']), '-');
  assert.strictEqual(fire('thong_suot', A, A), '+60c');
  assert.strictEqual(fire('thong_suot', ['van-n3-0', 'sach-n4-0', 'wan-n5-0'], ['van-n3-0', 'sach-n4-0', 'wan-n5-0']), '-');
  const B = [...A, 'van-n6-0'];
  assert.strictEqual(fire('sanh_dai', B, B), 'x1.5');
  assert.strictEqual(fire('sanh_dai', A, A), '-');
  const C = [...B, 'van-n7-0'];
  assert.strictEqual(fire('bi_ngu', C, C), 'x2');
  assert.strictEqual(fire('bi_ngu', B, B), '-');
});

test('Cộng Dồn Sảnh tích lũy vĩnh viễn, tính thử không đổi trạng thái', () => {
  const run = rig(A, ['cong_don_sanh']);
  const played = run.round.hand;
  const st0 = run.charms[0].state.mult;
  run._calc(played, [], true);
  assert.strictEqual(run.charms[0].state.mult, st0, 'tính thử không đổi');
  run.round.draw = [{ id: 'z', color: 'van', rank: 'n1' }];
  run.play(A);
  assert.strictEqual(run.charms[0].state.mult, 3);
});

test('bùa Bộ giống: Có Đôi Có Cặp, Cùng Số, Cù Lũ Nở Rộ, Khàn Mạnh, Tứ Quý Hội Tụ', () => {
  const P = ['van-n3-0', 'van-n3-1'];
  assert.strictEqual(fire('co_doi', P, P), '+40c');
  assert.strictEqual(fire('co_doi', A, A), '-');
  assert.strictEqual(fire('co_doi', ['van-n3-0', 'sach-n3-0', 'wan-n3-0'], ['van-n3-0', 'sach-n3-0', 'wan-n3-0']), '+40c');
  const T3 = ['van-n3-0', 'sach-n3-0', 'wan-n3-0'];
  assert.strictEqual(fire('cung_so_khac_ho', T3, T3), '+10m');
  const K = ['van-n3-0', 'van-n3-1', 'van-n3-2'];
  assert.strictEqual(fire('cung_so_khac_ho', K, K), '+10m', 'Phu bí cùng họ cũng kích hoạt sau khi gộp');
  assert.strictEqual(fire('khan_manh', K, K), 'x2.5');
  assert.strictEqual(fire('khan_manh', T3, T3), 'x2.5', 'Phu bí lẫn họ cũng kích hoạt sau khi gộp');
  const F = ['van-n2-0', 'van-n2-1', 'van-n2-2', 'van-n8-0', 'van-n8-1'];
  assert.strictEqual(fire('cu_lu_no_ro', F, F), 'x2');
  const Q = ['van-n5-0', 'van-n5-1', 'sach-n5-0', 'wan-n5-0'];
  assert.strictEqual(fire('tu_quy_hoi_tu', Q, Q), 'x3');
  assert.strictEqual(fire('tu_quy_hoi_tu', K, K), '-');
});

test('bùa Cùng họ: Một Họ, Đủ Ba Họ, Đồng Tông, và các bùa theo họ', () => {
  assert.strictEqual(fire('mot_ho', A, A), '+5m');
  assert.strictEqual(fire('mot_ho', ['van-n3-0', 'sach-n4-0', 'wan-n5-0'], ['van-n3-0', 'sach-n4-0', 'wan-n5-0']), '-');
  assert.strictEqual(fire('mot_ho', ['van-n3-0', 'van-n3-1'], ['van-n3-0', 'van-n3-1']), '-', 'cần từ 3 lá');
  const L = ['van-n3-0', 'sach-n3-0', 'wan-n3-0']; // phu bí đủ 3 họ
  assert.strictEqual(fire('du_ba_ho', L, L), '+50c');
  assert.strictEqual(fire('du_ba_ho', A, A), '-');
  const B = [...A, 'van-n6-0'];
  assert.strictEqual(fire('dong_tong', B, B), 'x2');
  assert.strictEqual(fire('dong_tong', A, A), '-');
  assert.strictEqual(fire('ho_van', A, A), '+3m,+3m,+3m');
  assert.strictEqual(fire('ho_sach', ['sach-n3-0', 'sach-n3-1'], ['sach-n3-0', 'sach-n3-1']), '+20c,+20c');
  assert.strictEqual(fire('ho_sach', A, A), '-');
  assert.strictEqual(fire('ho_wan', ['wan-n3-0'], ['wan-n3-0']), '+10c+2m');
});

test('Đổi Họ: lá bị bỏ chuyển họ kế (Văn → Sách → Vạn → Văn), có dấu ấn, quay lại bộ bài', () => {
  const run = rig(['van-n3-0', 'sach-n4-0', 'wan-n5-0', 'van-n6-0'], ['doi_ho']);
  run.round.draw = [{ id: 'z1', color: 'van', rank: 'n1' }, { id: 'z2', color: 'van', rank: 'n1' }, { id: 'z3', color: 'van', rank: 'n1' }];
  run.discard(['van-n3-0', 'sach-n4-0', 'wan-n5-0']);
  const back = run.round.draw.filter((c) => c.swapped);
  assert.strictEqual(back.length, 3);
  assert.deepStrictEqual(back.map((c) => c.color).sort(), ['sach', 'van', 'wan']);
  assert.strictEqual(back.find((c) => c.id === 'van-n3-0').color, 'sach');
  assert.strictEqual(back.find((c) => c.id === 'wan-n5-0').color, 'van');
});

test('bùa Lá Yêu: Mê Yêu, Yêu Giữ Nhà, Yêu Đi Đầu, Tam Yêu, Tôm Lèo, Yêu Nặng Ký, Gọi Thêm Yêu', () => {
  assert.strictEqual(fire('me_yeu', ['van-n10-0', 'sach-n10-0'], ['van-n10-0', 'sach-n10-0']), '+8m,+8m');
  assert.strictEqual(fire('me_yeu', A, A), '-');
  assert.strictEqual(fire('yeu_giu_nha', ['van-n3-0', 'van-n10-0', 'wan-n10-0'], ['van-n3-0']), '+5m,+5m');
  assert.strictEqual(fire('yeu_di_dau', ['van-n10-0', 'sach-n10-0'], ['van-n10-0', 'sach-n10-0']), 'x2');
  assert.strictEqual(fire('yeu_di_dau', ['van-n3-0', 'van-n3-1', 'van-n10-0'], ['van-n3-0', 'van-n3-1', 'van-n10-0']), '-');
  const Y = ['van-n10-0', 'sach-n10-0', 'wan-n10-0'];
  assert.strictEqual(fire('ba_yeu_hoi_tu', Y, Y), 'x4');
  const TM = ['van-n7-0', 'sach-n3-0', 'wan-n3-0']; const LE = ['sach-n8-0', 'wan-n9-0', 'van-n10-0'];
  assert.strictEqual(fire('tom_leo_mo_duong', TM, TM), 'x3');
  assert.strictEqual(fire('tom_leo_mo_duong', LE, LE), 'x3');
  assert.strictEqual(fire('tom_leo_mo_duong', Y, Y), '-');
  const r = rig(['van-n10-0'], ['yeu_nang_ky']);
  assert.strictEqual(r.cardChips({ rank: 'n10', color: 'van' }), 25);
  assert.strictEqual(r.cardChips({ rank: 'n9', color: 'van' }), 9);
  const g = new Run({ seed: 4 }); g.charms = []; g._addCharm('goi_them_yeu', null, 8);
  const before = g.round.draw.length + g.round.hand.length;
  g.startAi();
  assert.strictEqual(g.round.draw.length + g.round.hand.length, before + 1);
  assert.ok([...g.round.draw, ...g.round.hand].some((c) => c.tmp && c.rank === 'n10'));
});

test('bùa Giữ bài và bùa chung: Ngồi Chờ, Ít Mà Chất, Giữ Đủ Ba Họ, Tranh Chi, Số Nhỏ, Số Lớn, Ngũ Phúc, Kho Bài', () => {
  const H3 = ['van-n3-0', 'van-n4-0', 'sach-n5-0'];
  assert.strictEqual(fire('ngoi_cho', H3, ['van-n3-0']), '+4c,+4c');
  assert.strictEqual(fire('it_ma_chat', A, A), 'x2');
  assert.strictEqual(fire('it_ma_chat', [...A, 'van-n6-0'], [...A, 'van-n6-0']), '-');
  const hold = ['van-n9-0', 'van-n3-0', 'sach-n2-0', 'wan-n2-0'];
  assert.strictEqual(fire('giu_du_ba_ho', hold, ['van-n9-0']), 'x2');
  assert.strictEqual(fire('giu_du_ba_ho', ['van-n9-0', 'van-n3-0', 'sach-n2-0'], ['van-n9-0']), '-');
  assert.strictEqual(fire('tranh_chi', A, A, { handsLeft: 1 }), 'x2.5');
  assert.strictEqual(fire('tranh_chi', A, A, { handsLeft: 2 }), '-');
  assert.strictEqual(fire('so_nho', ['van-n1-0', 'van-n2-0', 'van-n3-0'], ['van-n1-0', 'van-n2-0', 'van-n3-0']), '+12c,+12c,+12c');
  assert.strictEqual(fire('so_nho', ['van-n7-0', 'van-n8-0', 'van-n9-0'], ['van-n7-0', 'van-n8-0', 'van-n9-0']), '-');
  assert.strictEqual(fire('so_lon', ['van-n8-0', 'van-n9-0', 'van-n10-0'], ['van-n8-0', 'van-n9-0', 'van-n10-0']), '+2m,+2m', 'Yêu không tính là số lớn');
  const five = ['van-n3-0', 'van-n4-0', 'van-n5-0', 'van-n6-0', 'van-n7-0'];
  assert.strictEqual(fire('ngu_phuc', five, five), '+8m');
  assert.strictEqual(fire('ngu_phuc', A, A), '-');
  assert.strictEqual(fire('kho_bai', A, A, { draw: 23 }), '+4c');
  assert.strictEqual(fire('kho_bai', A, A, { draw: 4 }), '-');
});

test('trùm mới: Giặc Cửu Yêu vô hiệu Cửu và Yêu; Thủy Quái phạt mọi sảnh; Cáo Chín Đuôi phạt bộ giống', () => {
  const find = (id) => DATA.bosses.pool.find((b) => b.id === id);
  const run = rig(['van-n9-0', 'van-n9-1']);
  run.round.boss = find('giac_cuu_yeu');
  const res = score(run, ['van-n9-0', 'van-n9-1']);
  assert.strictEqual(res.score, (10 + 0 + 0) * 2, 'Cửu không cho chip');
  const r2 = rig(A); r2.round.boss = find('thuy_quai');
  assert.ok(score(r2, A).banned);
  const r3 = rig(['van-n3-0', 'van-n3-1', 'van-n3-2']); r3.round.boss = find('cao_chin_duoi');
  assert.ok(score(r3, ['van-n3-0', 'van-n3-1', 'van-n3-2']).banned);
  const r4 = rig(A); r4.round.boss = find('quy_nhuom'); r4.round.debuffColor = 'sach';
  r4.round.hand[1].color = 'sach'; r4.round.hand[1].id = 'sach-n4-0';
  assert.ok(r4.isDebuffed(r4.round.hand[1]) && !r4.isDebuffed(r4.round.hand[0]));
});

test('Ấn Đảo Họ đổi sang họ kế vĩnh viễn; bộ bài tối thiểu 60 lá', () => {
  const run = new Run({ seed: 2 });
  run.round.score = 10 ** 9; run._winAi('clear'); run.money = 99;
  run.shop.offers.push({ uid: 9001, kind: 'an', id: 'dao_sac', base: 3, price: 3 });
  assert.ok(run.buy(9001, ['van-n4-0']).ok);
  assert.strictEqual(run.deck.find((x) => x.id === 'van-n4-0').color, 'sach');
  run.deck = run.deck.slice(0, 61);
  run.shop.offers.push({ uid: 9002, kind: 'an', id: 'tru_ta', base: 3, price: 3 });
  assert.throws(() => run.buy(9002, [run.deck[0].id, run.deck[1].id]));
});

test('8 bộ bài khởi đầu có hiệu lực: Số Cao bỏ Nhất–Tam (84 lá), Thuần Văn toàn họ Văn, Hỗn Loạn có đủ 120 lá', () => {
  assert.strictEqual(new Run({ seed: 1, deck: 'socao' }).deck.length, 84);
  const th = new Run({ seed: 1, deck: 'thuan' });
  assert.ok(th.deck.every((c) => c.color === 'van'));
  assert.strictEqual(new Run({ seed: 1, deck: 'ngau' }).deck.length, 120);
  assert.strictEqual(new Run({ seed: 1, deck: 'van' }).round.discardsLeft, DATA.config.discards + 1);
  assert.strictEqual(new Run({ seed: 1, deck: 'den' }).slots, DATA.config.slots + 1);
  assert.strictEqual(Object.keys(DATA.config.decks).length, 8);
});

test('bot mới chơi trọn ván không ném lỗi (4 kiểu)', () => {
  const { playRun } = require('../src/bots.js');
  for (const p of ['sanh', 'bo', 'ho', 'yeu']) { const r = playRun(p, { seed: 11 }); assert.ok(r.cleared >= 0); }
});
test('lưu và nạp ván: nạp lại rồi đánh tiếp cho kết quả y hệt ván gốc', () => {
  const a = new Run({ seed: 4242, difficulty: 'thuong' });
  const ids = (r) => r.round.hand.slice(0, 3).map((c) => c.id);
  a.play(ids(a));
  const snap = JSON.parse(JSON.stringify(a.snapshot()));
  const b = Run.restore(snap);
  assert.deepStrictEqual(b.round.hand.map((c) => c.id), a.round.hand.map((c) => c.id));
  assert.strictEqual(b.round.score, a.round.score);
  const ra = a.play(ids(a)); const rb = b.play(ids(b));
  assert.strictEqual(rb.score, ra.score);
  assert.deepStrictEqual(b.round.hand.map((c) => c.id), a.round.hand.map((c) => c.id));
  assert.deepStrictEqual(b.round.draw.map((c) => c.id), a.round.draw.map((c) => c.id));
  assert.strictEqual(b.money, a.money); assert.strictEqual(b.rng.next(), a.rng.next());
});
test('lưu và nạp ván ở chợ: chợ, bùa, tiền giữ nguyên', () => {
  const a = new Run({ seed: 99 });
  a.round.score = a.round.target; a.play(a.round.hand.slice(0, 1).map((c) => c.id));
  if (a.phase !== 'shop') return;
  const b = Run.restore(JSON.parse(JSON.stringify(a.snapshot())));
  assert.strictEqual(b.phase, 'shop'); assert.strictEqual(b.money, a.money);
  assert.deepStrictEqual(b.shop.offers.map((o) => o.uid), a.shop.offers.map((o) => o.uid));
});

console.log(`${passed} test đạt`);
