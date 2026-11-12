(function () {
  'use strict';
  // Giao diện bản chơi thử. Toàn bộ luật nằm trong engine (src/engine.js), file này chỉ vẽ và nhận thao tác.
  const E = __require('engine.js');
  const { Run, R, H, CH, AN, PHU, CONS, DATA, charmDefs, HO, HO_VI, YEU_VI, cardName } = E;
  const CFG = DATA.config;
  const CDATA = DATA.consumables;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const FAST = /[?&]fast/.test(location.search); // dùng khi chạy thử tự động: rút ngắn hoạt ảnh
  const sleep = (ms) => new Promise((r) => setTimeout(r, FAST ? ms / 25 : (typeof ui !== 'undefined' && ui.skip ? ms / 6 : ms)));
  const fmt = (n) => Math.round(n).toLocaleString('vi-VN');
  const fmtM = (m) => (Math.abs(m - Math.round(m)) < 1e-9 ? String(Math.round(m)) : String(Math.round(m * 10) / 10).replace('.', ','));
  const root = $('#app');
  const REDUCED = false; // game không còn tự tắt hiệu ứng theo cài đặt hệ thống; chỉ nút Giảm chuyển động trong Cài đặt quyết định
  const store = { get(k, d) { try { const v = localStorage.getItem('phongexe.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('phongexe.' + k, JSON.stringify(v)); } catch (e) { /* không lưu được thì thôi */ } } };
  const settings = Object.assign({ musicOn: true, musicVol: 30, sfxOn: true, sfxVol: 85, reduce: false, layout: 'auto', dev: false, devUnlock: true, devOpen: true }, store.get('settings', {}));
  // lần mở đầu tiên: lấy mặc định của nút theo hệ thống rồi lưu lại; từ đó về sau chỉ nút này quyết định
  if (!('reduce' in store.get('settings', {}))) { settings.reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); store.set('settings', settings); }
  if (/[?&]dev\b/.test(location.search)) { settings.dev = true; if (window.innerWidth < 900 && !('devOpen' in store.get('settings', {}))) settings.devOpen = false; }
  const progress = Object.assign({ decks: 1, diff: {}, ach: [], achStats: { phu_doc: 0, wild50: 0, ownedCharms: [] } }, store.get('progress', null) || {});
  progress.achStats = Object.assign({ phu_doc: 0, wild50: 0, ownedCharms: [] }, progress.achStats || {});
  if (settings.muted != null) { settings.sfxOn = !settings.muted; delete settings.muted; } if (settings.volume != null) { settings.sfxVol = settings.volume; delete settings.volume; }

  // ------------------------------------------------------------------ hình vẽ
  const starPts = (cx, cy, r1, r2, n) => {
    const p = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2; const r = i % 2 ? r2 : r1;
      p.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1));
    }
    return p.join(' ');
  };
  const S = 'stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  // Hình ba họ của bài Tổ tôm: Văn là đồng tiền, Sách là xâu tiền, Vạn là ấn vuông.
  const ICONS = {
    van: `<circle cx="20" cy="20" r="15" ${S} stroke-width="4"/><rect x="14" y="14" width="12" height="12" rx="1"/>`,
    sach: `<rect x="17.4" y="2" width="5.2" height="36" rx="2.6"/><circle cx="20" cy="9" r="6.4" ${S} stroke-width="3.2"/><circle cx="20" cy="20" r="6.4" ${S} stroke-width="3.2"/><circle cx="20" cy="31" r="6.4" ${S} stroke-width="3.2"/>`,
    wan: `<rect x="4" y="4" width="32" height="32" rx="3" ${S} stroke-width="4"/><path d="M20 9 V31 M9 16 H31 M12 25 H28" ${S} stroke-width="3.4"/>`,
    // ba lá Yêu: Chi Chi (cậu bé quần đùi), Thang Thang (mẹ bế con), Ông Lão (cụ ông có râu, gậy)
    yeu_van: `<circle cx="20" cy="10" r="6.5"/><path d="M13 19 H27 L29 28 H11Z"/><rect x="12" y="28" width="6" height="9" rx="2"/><rect x="22" y="28" width="6" height="9" rx="2"/><path d="M13 20 L7 27 M27 20 L33 27" ${S} stroke-width="3.2"/><circle class="eye" cx="17.6" cy="9.5" r="1.1"/><circle class="eye" cx="22.4" cy="9.5" r="1.1"/>`,
    yeu_sach: `<circle cx="16" cy="8.5" r="6"/><path d="M8 17 H24 L27 37 H5Z"/><circle cx="31" cy="21" r="4.6"/><path d="M25 27 H37 V37 H25Z"/><circle class="eye" cx="14" cy="8" r="1.1"/><circle class="eye" cx="18.4" cy="8" r="1.1"/>`,
    yeu_wan: `<path d="M9 12 Q20 -1 31 12 Q31 8 20 6 Q9 8 9 12Z"/><circle cx="20" cy="15" r="6.5"/><path d="M13.5 18 Q20 36 26.5 18 Q20 24 13.5 18Z"/><path d="M12 23 H28 L30 37 H10Z"/><path d="M34 14 V38" ${S} stroke-width="3"/><circle class="eye" cx="17.6" cy="14.4" r="1.1"/><circle class="eye" cx="22.4" cy="14.4" r="1.1"/>`,
    // biểu tượng cho nhóm bùa
    run: `<rect x="3" y="26" width="9" height="11" rx="1.5"/><rect x="15.5" y="17" width="9" height="20" rx="1.5"/><rect x="28" y="8" width="9" height="29" rx="1.5"/>`,
    cards: `<rect x="3" y="9" width="17" height="25" rx="3" transform="rotate(-10 11 21)"/><rect x="13" y="6" width="17" height="25" rx="3" transform="rotate(4 22 18)" opacity=".75"/><rect x="21" y="9" width="17" height="25" rx="3" transform="rotate(16 30 21)" opacity=".5"/>`,
    hand: `<path d="M8 36 L6 20 Q6 17 9 17 L10 24 L10 8 Q10 5 13 5 Q16 5 16 8 L16 17 L17 6 Q17.5 3.5 20.5 4 Q23 4.5 22.5 7 L22 17 L25 8 Q26.5 6 29 7 Q31 8.5 30 11 L27 22 L31 18 Q33.5 16.5 35 18.5 Q36 20.5 34 22 L27 31 L25 36Z"/>`,
    coin: `<circle cx="20" cy="20" r="14.5" ${S} stroke-width="3.6"/><rect x="14.5" y="14.5" width="11" height="11" rx="1"/>`,
    junk: `<path d="M8 30 L11 14 L20 8 L30 12 L33 26 L25 34 L14 35Z"/><path class="eye" d="M20 8 L19 19 L26 24 M19 19 L12 24" fill="none" stroke="#f3e8cc" stroke-width="2" stroke-linecap="round"/>`,
    sun: `<polygon points="${starPts(20, 20, 7.5, 17.5, 14)}"/><circle class="eye" cx="20" cy="20" r="4.2"/>`,
  };
  // Tên nhân vật trên từng lá (hiện trong chú giải khi chạm giữ). Hình vẽ là ảnh pixel trong assets/cards/.
  const FIG_NAME = {"wan-1":"Người múa, co một chân, tay vung lên","wan-2":"Cành đào: quả đào và lá","wan-3":"Cô gái búi tóc, tay cầm nón","wan-4":"Người đẩy xe có bánh","wan-5":"Vọng lâu nhiều tầng mái cong","wan-6":"Người đứng ngước nhìn, chống cuốc","wan-7":"Người ôm tay lên cằm, bưng bát","wan-8":"Cá chép dựng đứng","wan-9":"Người vác hòm trên vai","wan-10":"Ông Lão: người hói quay lưng, đeo kiếm bên hông","sach-1":"Người hói khom người múa","sach-2":"Cụ già khoác áo kẻ, chống gậy","sach-3":"Người đội nón khom người, gánh bọc","sach-4":"Cô búi tóc cầm chai","sach-5":"Thuyền buồm cánh kẻ sọc","sach-6":"Người hói đứng, đứa bé ngồi dưới chân","sach-7":"Cô tóc đỏ bưng mâm tròn","sach-8":"Cô ngồi hút tẩu","sach-9":"Người xách đèn lồng trên cột, chống gậy","sach-10":"Thang Thang: mẹ địu con sau lưng, kimono hoa","van-1":"Cô gái chỉnh tay áo, đi dạo","van-2":"Người vác bao, quàng khăn","van-3":"Người chống gậy, gánh bọc","van-4":"Người bưng thùng","van-5":"Cô đội nón ngồi, áo ca-rô","van-6":"Cậu bé chạy, cầm đèn trên cột","van-7":"Người áo dài cầm chai/cuộn","van-8":"Cậu bé đi cà kheo","van-9":"Người vác thang và tấm ván","van-10":"Chi Chi: người hói to lớn xách bọc"};
  const figName = (color, rank) => FIG_NAME[`${color}-${rank.slice(1)}`] || '';
  const cardArt = (c) => `<img class="px" src="assets/cards/${c.junk || c.rank === 'junk' ? 'junk' : `${c.color}_${c.rank.slice(1)}`}.png" alt="" draggable="false">`;
  const icon = (name) => `<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">${ICONS[name]}</svg>`;
  const BUILD_ICON = { sanh: 'run', bo: 'cards', ho: 'van', yeu: 'yeu_van', giu: 'hand', chung: 'coin', than: 'sun' };
  const RARITY = { thuong: 'Thường', hiem: 'Hiếm', quy: 'Quý', than: 'Thần' };
  const BUILD = { sanh: 'Phu dọc', bo: 'Bộ giống', ho: 'Cùng họ', yeu: 'Lá Yêu', giu: 'Giữ bài', chung: 'Chung', than: 'Thần' };


  // ------------------------------------------------------------------ âm thanh (tạo bằng WebAudio, không cần file)
  let actx = null;
  const ui = {
    view: 'title', sel: new Set(), busy: false, intro: false, detail: null, info: false, muted: false, vol: 1, settings: false, confirmClear: false,
    cashout: null, thanPick: null, picker: null, packPick: null, justBought: null, lastMoney: null, prevView: null, difficulty: CFG.defaultDifficulty, layout: 'port', deck: CFG.defaultDeck, deckView: false, sortMode: null, playCount: {}, known: new Set(), stage: null, toastTimer: null, skip: false, achRun: null,
  };

  // ---- Thành Tích ----
  const ACH_LIST = DATA.achievements;
  const ACH_GROUP_VI = { bo: 'Bộ Bài', diem: 'Điểm Số', thach: 'Thách Thức', thu_thap: 'Thu Thập', dac_biet: 'Đặc Biệt' };
  const ACH_ICON = {
    ach_five: 'bo_van', ach_phu_doc: 'bo_thuan', ach_triple_special: 'hop_qua',
    ach_sweep: 'quat', ach_flush_all: 'bo_sach',
    ach_1k: 'dong_xu', ach_10k: 'thoi_vang', ach_mult100: 'may', ach_chip1k: 'bao_do',
    ach_no_discard: 'nut_that', ach_poor_win: 'tui_loc', ach_no_buy: 'lu_huong',
    ach_last_chance: 'dong_ho_cat', ach_glass_survive: 'den_long', ach_boss_streak: 'mo',
    ach_5charms: 'tui_loc', ach_all_charms: 'bao_do', ach_all_phu: 'cuon_giay', ach_all_hands: 'trong_boi',
    ach_lucky_triple: 'hoa_mai', ach_wild50: 'sen_xanh', ach_retrigger: 'chuong', ach_spectral: 'am_duong',
  };
  function achUnlocked(id) { return (progress.ach || []).includes(id); }
  function unlockAch(id) {
    if (achUnlocked(id)) return false;
    progress.ach = progress.ach || [];
    progress.ach.push(id);
    store.set('progress', progress);
    const a = ACH_LIST.find((x) => x.id === id);
    if (a) showAch(a);
    return true;
  }
  function trackCharmOwned(charmId) {
    if (!charmId) return;
    const owned = progress.achStats.ownedCharms;
    if (!owned.includes(charmId)) { owned.push(charmId); store.set('progress', progress); }
    if (owned.length >= DATA.charms.length) unlockAch('ach_all_charms');
    if (run && run.usedSlots() >= 5) unlockAch('ach_5charms');
  }
  function checkPlayAch(res, played) {
    if (!ui.achRun || !run) return;
    const ar = ui.achRun;
    // Nhóm Bộ Bài
    if (res.hand.type === 'five') unlockAch('ach_five');
    if (res.hand.type === 'run5_same') {
      progress.achStats.phu_doc = (progress.achStats.phu_doc || 0) + 1;
      store.set('progress', progress);
      if (progress.achStats.phu_doc >= 5) unlockAch('ach_phu_doc');
    }
    ar.tripleSpecial.add(res.hand.type);
    if (['tom', 'leo', 'tam_yeu'].every((t) => ar.tripleSpecial.has(t))) unlockAch('ach_triple_special');
    ar.sweepTypes.add(res.hand.type);
    if (ar.sweepTypes.size >= 5) unlockAch('ach_sweep');
    if (res.hand.type === 'flush5') { ar.flush5Count++; if (ar.flush5Count >= 5) unlockAch('ach_flush_all'); }
    // Nhóm Điểm Số
    if (res.score >= 1000) unlockAch('ach_1k');
    if (res.score >= 10000) unlockAch('ach_10k');
    if (res.mult >= 100) unlockAch('ach_mult100');
    if (res.chips >= 1000) unlockAch('ach_chip1k');
    // Lá Linh tích lũy
    const wildCount = played.filter((c) => c.enh === 'linh').length;
    if (wildCount > 0) {
      progress.achStats.wild50 = (progress.achStats.wild50 || 0) + wildCount;
      store.set('progress', progress);
      if (progress.achStats.wild50 >= 50) unlockAch('ach_wild50');
    }
    // Ấn Đỏ / retrigger
    const retriggers = (res.steps || []).filter((s) => s.kind === 'again').length;
    if (retriggers >= 10) unlockAch('ach_retrigger');
    // Lưu Ly không vỡ liên tiếp
    const luuLyScored = played.filter((c) => c.enh === 'luu_ly' && res.hand.cards.some((sc) => sc.id === c.id));
    if (luuLyScored.length > 0) {
      const anyBroken = luuLyScored.some((c) => (res.broken || []).includes(c.id));
      if (anyBroken) { ar.glassStreak = 0; }
      else { ar.glassStreak++; if (ar.glassStreak >= 5) unlockAch('ach_glass_survive'); }
    }
    // Khi kết thúc ải (thắng/thua)
    if (res.outcome !== 'continue') {
      const roundKind = run.round ? run.round.kind : null;
      const roundHandsLeft = run.round ? run.round.handsLeft : -1;
      if (res.outcome !== 'lost') {
        // Thắng ải không bỏ bài
        if (!ar.discardUsedThisAi) unlockAch('ach_no_discard');
        // Phút Chót: thắng ải trùm bằng lượt cuối
        if (roundKind === 'trum' && roundHandsLeft === 0) unlockAch('ach_last_chance');
        // Boss streak
        if (roundKind === 'trum') {
          ar.bossStreak++;
          if (ar.bossStreak >= 3) unlockAch('ach_boss_streak');
        }
      } else if (res.outcome === 'lost' && roundKind === 'trum') {
        ar.bossStreak = 0;
      }
      // Thắng ván
      if (res.outcome === 'won') {
        if (run.charms.filter((c) => c.variant !== 'ran').length <= 2) unlockAch('ach_poor_win');
        if (ar.noBuy) unlockAch('ach_no_buy');
      }
    }
    // Tất cả 15 bộ trong 1 ván
    if (Object.keys(ui.playCount).length >= Object.keys(H).length) unlockAch('ach_all_hands');
  }
  let run = null;
  function unlockAudio() {
    if (!ui.muted) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; } }
    loadSfxBuffers();
    musicStart();
  }
  function blip(freq, dur = 0.09, type = 'square', vol = 0.05) {
    if (ui.muted || !actx) return;
    try {
      const o = actx.createOscillator(); const g = actx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol * ui.vol;
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
    } catch (e) { /* bỏ qua lỗi âm thanh */ }
  }
  const whoosh = () => { blip(220, 0.14, 'sawtooth', 0.05); setTimeout(() => blip(660, 0.1, 'triangle', 0.05), 70); };
  const chime = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.16, 'triangle', 0.07), i * 90));
  const coin = () => { blip(900, 0.055, 'triangle', 0.09); setTimeout(() => blip(1400, 0.04, 'sine', 0.055), 28); };
  function sweep(f0, f1, dur = 0.5, type = 'sawtooth', vol = 0.06) {
    if (ui.muted || !actx) return;
    try {
      const o = actx.createOscillator(); const g = actx.createGain(); const t = actx.currentTime;
      o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(vol * ui.vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* bỏ qua lỗi âm thanh */ }
  }
  const arpeggio = (n) => [392, 523, 659, 784, 1047, 1319, 1568].slice(0, n).forEach((f, i) => setTimeout(() => blip(f, 0.2, 'triangle', 0.08), i * 80));
  const thud = () => { blip(110, 0.18, 'sawtooth', 0.06); setTimeout(() => blip(82, 0.25, 'sawtooth', 0.06), 120); };

  // ---- SFX từ file âm thanh — dùng AudioBuffer để zero-latency
  const sfxBuffers = {};
  const SFX_FILES = {
    card_select:  'assets/sfx/card_select.ogg',
    card_flip:    'assets/sfx/card_flip.ogg',
    card_discard: 'assets/sfx/card_discard.ogg',
    chip:         'assets/sfx/chip.ogg',
    mult:         'assets/sfx/mult.ogg',
    buy:          'assets/sfx/buy.ogg',
    charm_buy:    'assets/sfx/charm_buy.ogg',
    deal:         'assets/sfx/deal.ogg',
    shuffle:      'assets/sfx/shuffle.ogg',
    pack_open:    'assets/sfx/pack_open.ogg',
    pack_take:    'assets/sfx/pack_take.ogg',
    score_tick:   'assets/sfx/score_tick.ogg',
    fanfare:      'assets/sfx/fanfare.mp3',
    glass_break:  'assets/sfx/glass_break.mp3',
    negative:     'assets/sfx/negative.mp3',
  };
  function loadSfxBuffers() {
    if (!actx) return;
    for (const [name, url] of Object.entries(SFX_FILES)) {
      if (sfxBuffers[name]) continue;
      (function(n, u) {
        const dataUrl = window.__A && window.__A[u];
        if (dataUrl) {
          fetch(dataUrl).then(r => r.arrayBuffer()).then(buf => actx && actx.decodeAudioData(buf, b => { sfxBuffers[n] = b; })).catch(() => {});
        } else {
          const xhr = new XMLHttpRequest(); xhr.open('GET', u, true); xhr.responseType = 'arraybuffer';
          xhr.onload = function() { if ((xhr.status === 0 || xhr.status === 200) && xhr.response) actx.decodeAudioData(xhr.response, function(buf) { sfxBuffers[n] = buf; }); };
          xhr.send();
        }
      })(name, url);
    }
  }
  function playSfx(name, vol = 1, pitch = 1, maxDur = 0) {
    if (ui.muted || !actx || !sfxBuffers[name]) return false;
    try {
      const src = actx.createBufferSource(); const g = actx.createGain();
      src.buffer = sfxBuffers[name]; src.playbackRate.value = pitch;
      g.gain.value = Math.min(1, ui.vol * vol);
      src.connect(g); g.connect(actx.destination);
      if (maxDur > 0) src.start(0, 0, maxDur); else src.start();
    } catch (e) { return false; }
    return true;
  }

  // ------------------------------------------------------------------ hiệu ứng
  function shake(px) {
    if (REDUCED || FAST || settings.reduce) return;
    root.style.setProperty('--sh', px + 'px'); root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
  }
  function burst(x, y, n) {
    if (REDUCED || FAST || settings.reduce) return;
    const colors = ['#e2ad3c', '#f4cf72', '#d1391f', '#35a394', '#f3e8cc'];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'); p.className = 'part' + (i % 3 === 0 ? ' coin' : '');
      const a = Math.random() * Math.PI * 2; const d = 70 + Math.random() * 170;
      p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 50}px;--rot:${Math.random() * 720 - 360}deg;--c:${colors[i % colors.length]};--s:${5 + Math.random() * 7}px;animation-delay:${Math.random() * 60}ms`;
      document.body.appendChild(p); setTimeout(() => p.remove(), 1100);
    }
  }
  function banner(text, sub, cls) {
    $$('.banner, .bandim').forEach((b) => b.remove());
    const hold = FAST ? 20 : cls === 'trum' ? 2900 : 1900; // ms hiện đủ trước khi mờ đi; trùm có thêm dòng hiệu ứng nên đọc lâu hơn
    const dim = document.createElement('div'); dim.className = 'bandim'; dim.style.setProperty('--hold', hold + 'ms');
    const b = document.createElement('div'); b.className = 'banner ' + (cls || ''); b.style.setProperty('--hold', hold + 'ms');
    b.innerHTML = `<b>${text}</b>${sub ? `<span>${sub}</span>` : ''}`;
    document.body.appendChild(dim); document.body.appendChild(b);
    const kill = () => { dim.remove(); b.remove(); document.removeEventListener('pointerdown', kill, true); };
    setTimeout(kill, hold + (FAST ? 10 : 450));
    if (!FAST) setTimeout(() => document.addEventListener('pointerdown', kill, true), 500); // chạm để đóng sớm
  }
  // Quẻ cho bộ đang khóa (cấp 0) = lá "Mở bộ"; còn lại là nâng cấp như cũ
  function queLv(hand) { const lv = run.handLevels[hand]; return lv === 0 ? '🔒 Mở khóa' : `Lv ${lv} → ${lv + 1}`; }
  function queDesc(hand) { const h = H[hand]; return run.handLevels[hand] === 0 ? `Mở bộ <b>${h.vi}</b>: ${h.desc}. Từ nay bộ này mới được tính điểm (${h.chips} × ${h.mult}).` : `Bộ này +${h.lvChips} chip và +${h.lvMult} hệ số gốc.`; }
  // lửa bay lên từ một điểm (hệ số lớn, điểm quá tải)
  function embers(x, y, n, spread = 40, rise = 120) {
    if (REDUCED || FAST || settings.reduce) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'); p.className = 'ember';
      p.style.cssText = `left:${x + (Math.random() - 0.5) * spread}px;top:${y}px;--dx:${(Math.random() - 0.5) * 50}px;--dy:${rise * (0.5 + Math.random())}px;--s:${5 + Math.random() * 7}px;--t:${0.7 + Math.random() * 0.7}s;animation-delay:${Math.random() * 120}ms`;
      document.body.appendChild(p); setTimeout(() => p.remove(), 1700);
    }
  }
  function flash(strong) {
    if (REDUCED || FAST || settings.reduce) return;
    const f = document.createElement('div'); f.className = 'flash' + (strong ? ' strong' : ''); document.body.appendChild(f); setTimeout(() => f.remove(), 900);
  }
  // tên bộ phóng to giữa màn hình khi đánh ra bộ mạnh: tấm bảng có icon, nền gameplay tối lại
  function fanfare(name, grand) {
    if (REDUCED || FAST || settings.reduce) return;
    $$('.fanfare, .fandim').forEach((b) => b.remove());
    const life = grand ? 1700 : 1100;
    const dim = document.createElement('div'); dim.className = 'fandim' + (grand ? ' g' : ''); dim.style.setProperty('--life', life + 'ms');
    const f = document.createElement('div'); f.className = 'fanfare' + (grand ? ' g' : '');
    f.innerHTML = `<div class="fn-plate"><span class="fn-ico">${gicon(grand ? 'thoi_vang' : 'tui_loc')}</span><small>${grand ? 'Kỳ tích' : 'Bộ mạnh'}</small><b>${name}</b></div>`;
    document.body.append(dim, f); setTimeout(() => { f.remove(); dim.remove(); }, life);
  }
  // thông báo vào ải: tấm bảng có icon, chặng, mục tiêu và (nếu có) hiệu ứng trùm
  const BLIND_ICON = { thuong: 'quat', lon: 'chuong', trum: 'den_long' };
  function blindBanner(r) {
    $$('.banner, .bandim').forEach((b) => b.remove());
    const hold = FAST ? 20 : r.kind === 'trum' ? 3000 : 2100;
    const dim = document.createElement('div'); dim.className = 'bandim'; dim.style.setProperty('--hold', hold + 'ms');
    const b = document.createElement('div'); b.className = 'banner bnblind k-' + r.kind; b.style.setProperty('--hold', hold + 'ms');
    b.innerHTML = `<div class="bn-plate"><span class="bn-ico">${gicon(BLIND_ICON[r.kind] || 'quat')}</span><small>Chặng ${r.chang}/${CFG.changCount}</small><b class="bn-title">${CFG.aiNames[r.kind]}</b>`
      + `<div class="bn-goal"><small>Mục tiêu</small><strong>${fmt(r.target)}</strong></div>`
      + (r.boss ? `<div class="bn-boss"><b>${r.boss.vi}</b><span>${r.boss.text}</span></div>` : '') + '</div>';
    document.body.appendChild(dim); document.body.appendChild(b);
    const kill = () => { dim.remove(); b.remove(); document.removeEventListener('pointerdown', kill, true); };
    setTimeout(kill, hold + (FAST ? 10 : 450));
    if (!FAST) setTimeout(() => document.addEventListener('pointerdown', kill, true), 500);
  }
  let comboEl = null;
  function setCombo(n) {
    if (REDUCED || FAST || settings.reduce) return;
    if (n < 3) return;
    if (!comboEl) { comboEl = document.createElement('div'); comboEl.className = 'combo'; document.body.appendChild(comboEl); }
    comboEl.dataset.lv = n >= 12 ? 3 : n >= 8 ? 2 : n >= 5 ? 1 : 0;
    comboEl.innerHTML = `Liên hoàn <b>×${n}</b>`; comboEl.classList.remove('hit'); void comboEl.offsetWidth; comboEl.classList.add('hit');
    const c = $('#calc'); if (c) { const b = c.getBoundingClientRect(); comboEl.style.left = b.right - 10 + 'px'; comboEl.style.top = b.top - 6 + 'px'; }
  }
  function clearCombo() { if (comboEl) { const e = comboEl; comboEl = null; e.classList.add('out'); setTimeout(() => e.remove(), 400); } }
  // số lăn dần từ giá trị cũ đến giá trị mới
  function rollTo(el, to, fmtFn, dur = 280) {
    if (!el) return;
    if (FAST || REDUCED || ui.skip || dur <= 0) { el._v = to; el.textContent = fmtFn(to); return; }
    const from = el._v != null ? el._v : (parseFloat(String(el.textContent).replace(',', '.')) || 0); el._v = to;
    const id = (el._rid = (el._rid || 0) + 1); const t0 = performance.now();
    const tick = (t) => { if (el._rid !== id) return; const k = Math.min(1, (t - t0) / dur); el.textContent = fmtFn(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  // độ nóng của ô chip / hệ số: càng lớn càng to, càng rực
  function heatBox(el, level, scale) { if (!el) return; el.dataset.heat = level; el.style.setProperty('--k', scale); }

  function showLevelUp(types, n = 1) {
    if (!types || !types.length) return;
    $$('.lvup').forEach((b) => b.remove());
    const t = types[0];
    const b = document.createElement('div'); b.className = 'lvup';
    b.innerHTML = `<small>${run.handLevels[t] - n === 0 ? 'Mở khóa bộ mới' : 'Bộ lên cấp'}</small><b>${H[t].vi}</b><span class="num">${run.handLevels[t] - n === 0 ? 'Đã mở' : `Cấp ${run.handLevels[t] - n} → ${run.handLevels[t]}`}</span><em>${H[t].chips + (run.handLevels[t] - 1) * H[t].lvChips} × ${H[t].mult + (run.handLevels[t] - 1) * H[t].lvMult}</em>`;
    document.body.appendChild(b); playSfx('fanfare', 0.6, 1, 2.5); burst(innerWidth / 2, innerHeight / 2, 22);
    setTimeout(() => b.remove(), FAST ? 30 : 1900);
  }
  function countUp(el, to, dur) {
    const t0 = performance.now();
    const tick = (t) => { const k = Math.min(1, (t - t0) / (FAST ? 10 : dur)); el.textContent = '+' + Math.round(to * k); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  function notifBox() { let b = document.querySelector('.notifs'); if (!b) { b = document.createElement('div'); b.className = 'notifs'; document.body.appendChild(b); } return b; }
  function dismissNotif(el, after) { setTimeout(() => el.classList.add('out'), after); setTimeout(() => { el.remove(); const b = document.querySelector('.notifs'); if (b && !b.children.length) b.remove(); }, after + 380); }
  function showAch(a) {
    $$('.ach-popup:not(.rec)').forEach((e) => e.remove());
    const icon = ACH_ICON[a.id];
    const pop = document.createElement('div'); pop.className = 'ach-popup'; pop.setAttribute('role', 'status');
    pop.innerHTML = `<div class="ach-popup-icon">${icon ? `<img src="assets/icons/${icon}.png">` : '★'}</div><div><b>Thành tích mở khóa!</b><span>${a.vi}</span></div>`;
    notifBox().appendChild(pop);
    playSfx('fanfare', 0.5, 1.2, 2.5);
    dismissNotif(pop, 3200);
  }
  function showRecord(title, sub) {
    $$('.ach-popup.rec').forEach((e) => e.remove());
    const pop = document.createElement('div'); pop.className = 'ach-popup rec'; pop.setAttribute('role', 'status');
    pop.innerHTML = `<div class="ach-popup-icon">🏆</div><div><b>${title}</b><span>${sub}</span></div>`;
    notifBox().appendChild(pop);
    playSfx('fanfare', 0.5, 1.2, 2.5);
    dismissNotif(pop, 3200);
  }
  function toast(msg) {
    $$('.notifs .toast').forEach((t) => t.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    notifBox().appendChild(t); dismissNotif(t, 2300);
  }

  // ------------------------------------------------------------------ mảnh giao diện
  const bandName = (c) => (c.rank === 'n10' ? (c.color === 'sach' ? 'Thang' : YEU_VI[c.color]) : R[c.rank].vi);
  const bandHTML = (c) => { const n = bandName(c); return `<span class="b1${n.length >= 6 ? ' long' : ''}">${n}</span>`; };
  const footHTML = (c, chips) => `<span class="chipv num">${chips}</span><span class="b2">${c.rank === 'junk' ? 'Tạp' : HO_VI[c.color]}</span>${c.junk || c.rank === 'junk' ? '<i></i>' : `<i class="suit" aria-hidden="true">${icon(c.color)}</i>`}`;
  function cardHTML(c, o = {}) {
    const chips = c.junk ? '' : run ? run.cardChips(c) : R[c.rank].chips;
    const act = o.act ? ' data-act="card"' : '';
    const enh = (c.enh ? `<img class="px eic" src="assets/an/${c.enh}.png" alt="${CFG.enhancements[c.enh].vi}" title="${CFG.enhancements[c.enh].vi}" draggable="false">` : '') + (c.seal ? `<img class="px sic s-${c.seal}" src="assets/an/trien_${c.seal}.png" alt="${CFG.seals[c.seal].vi}" title="${CFG.seals[c.seal].vi}" draggable="false">` : '') + (c.rank === 'n10' ? '<i class="yeu-mark">YÊU</i>' : '');
    const deb = !!(run && run.round && ui.view === 'play' && !ui.intro && !o.noDeb && run.isDebuffed(c));
    const fan = o.fan ? `--rot:${o.fan.rot.toFixed(1)}deg;--ty:${o.fan.ty.toFixed(1)}px;` : '';
    return `<div class="card ${c.color}${c.rank === 'n10' ? ' yeu' : ''}${c.enh || c.seal ? ' badged' : ''}${o.sel ? ' sel' : ''}${c.tmp ? ' tmp' : ''}${o.isNew ? ' new' : ''}${c.enh ? ' e-' + c.enh : ''}${c.junk ? ' junk' : ''}${deb ? ' deb' : ''}${o.hint ? ' hint' : ''}${o.cls ? ' ' + o.cls : ''}" data-id="${c.id}" data-rank="${c.rank}" data-color="${c.color}" data-enh="${c.enh || ''}" data-seal="${c.seal || ''}"${act} style="${fan}${o.delay ? `animation-delay:${o.delay}ms` : ''}">`
      + `<i class="frame"></i><i class="glint"></i><div class="band">${bandHTML(c)}</div><div class="art">${cardArt(c)}</div><div class="foot">${footHTML(c, chips)}</div>${enh}${c.swapped ? '<i class="stamp"></i>' : ''}${deb ? '<span class="debtag">vô hiệu</span>' : ''}</div>`;
  }
  function charmHTML(c, idx, tag = 'button') {
    const info = CH[c.id];
    const st = c.state && c.state.mult > 0 && (c.id === 'tot_thi' || c.id === 'ma_tang_toc') ? `<span class="badge">+${c.state.mult}</span>` : '';
    const vt = c.variant ? `<span class="vtag">${CFG.variants[c.variant].vi}</span>` : '';
    const attrs = tag === 'button' ? ` type="button" data-act="charm" data-uid="${c.uid}" data-idx="${idx}"` : '';
    const off = run && run.round && ui.view === 'play' && run.round.disabledUid === c.uid;
    const cls = `${off ? ' off' : ''}${ui.justBought === c.uid ? ' bought' : ''}`;
    return `<${tag} class="charm r-${info.rarity} v-${c.variant || 'none'}${cls}"${attrs} style="--i:${idx}" aria-label="${info.vi}"><span class="cidx">${idx + 1}</span>${st}<div class="cart"><img class="px" src="assets/charms/${c.id}.png" alt="" draggable="false"></div><div class="cname">${info.vi}</div>${vt}${off ? '<span class="offtag">vô hiệu</span>' : ''}</${tag}>`;
  }
  function offerCharmHTML(o) {
    const info = CH[o.id];
    const v = o.variant ? `<b>${CFG.variants[o.variant].vi}:</b> ${CFG.variants[o.variant].text}. ` : '';
    const varTag = o.variant ? `<span class="vtag">${CFG.variants[o.variant].vi}</span>` : '';
    return `<div class="offer offer-row"><div class="oic"><img class="px" src="assets/charms/${o.id}.png" alt="" draggable="false"></div>`
      + `<div class="otxt"><div class="oname"><b>${info.vi}</b>${varTag}<span class="tag ${info.rarity}">${RARITY[info.rarity]}</span></div>`
      + `<div class="desc">${moneyText(info.text)}${v ? `<br><small>${v}</small>` : ''}</div></div>`
      + `<button class="buy" data-act="buy" data-uid="${o.uid}" ${run.money < o.price ? 'disabled' : ''}>${gicon('thoi_vang')}${o.price} đồng</button></div>`;
  }
  const gicon = (id) => `<img class="px gi" src="assets/icons/${id}.png" alt="" draggable="false">`;
  const moneyText = (s) => s.replace(/([+×]?)\$(\d+)/g, (_, sign, n) => `<span style="white-space:nowrap">${sign}${gicon('thoi_vang')}${n}</span>`);
  const DIFF_ICON = { de: 'sen', thuong: 'quat', kho: 'chuong', ac: 'den_long' };
  // Thứ tự mở khóa bộ bài: lợi thuần trước, đổi chác sau, đổi cấu trúc cuối. Mỗi bộ có 4 độ khó; thắng độ khó cuối của bộ mới nhất thì mở bộ kế.
  const DECK_ORDER = ['chuan', 'van', 'vang', 'sach', 'den', 'socao', 'thuan', 'ngau'].filter((id) => CFG.decks[id]);
  const HAND_TIER = { five: 'S', run5_same: 'S', tom: 'S', leo: 'S', tam_yeu: 'S', four: 'A', run4_same: 'A', full: 'A', run5: 'B', three: 'B', flush5: 'B', run3_same: 'B', two_pair: 'C', pair_mixed: 'C', single: 'C' };
  const TIER_ICON = { S: 'S', A: 'A', B: 'B', C: 'C' };
  const DIFF_ORDER = Object.keys(CFG.difficultyPresets);
  const DECK_ICON = { chuan: 'cuon_giay', van: 'bo_van', vang: 'thoi_vang', sach: 'bo_sach', den: 'am_duong', socao: 'ho_lo', thuan: 'bo_thuan', ngau: 'may' };
  const devAll = () => !!(settings.dev && settings.devUnlock);
  const deckOpen = (i) => devAll() || i < progress.decks;
  const diffOpen = (deckId, j) => devAll() || j < (progress.diff[deckId] || 1);
  function sanitizeSel() {
    let di = DECK_ORDER.indexOf(ui.deck);
    if (di < 0 || !deckOpen(di)) { ui.deck = DECK_ORDER[0]; di = 0; }
    const j = DIFF_ORDER.indexOf(ui.difficulty);
    if (j < 0 || !diffOpen(ui.deck, j)) { let k = 0; while (k + 1 < DIFF_ORDER.length && diffOpen(ui.deck, k + 1)) k++; ui.difficulty = DIFF_ORDER[k]; }
  }
  function diffChipsHTML() {
    return DIFF_ORDER.map((id, j) => {
      const d = CFG.difficultyPresets[id]; const ic = gicon(DIFF_ICON[id] || 'sen');
      if (diffOpen(ui.deck, j)) return `<button class="mini${ui.difficulty === id ? ' on' : ''}" data-act="diff" data-id="${id}" type="button">${ic}${d.vi}</button>`;
      return `<button class="mini locked" data-act="locked" data-hint="Thắng ${CFG.decks[ui.deck].vi} ở độ khó ${CFG.difficultyPresets[DIFF_ORDER[j - 1]].vi} để mở" type="button" aria-disabled="true">${ic}${d.vi}</button>`;
    }).join('');
  }
  function deckChipsHTML() {
    return DECK_ORDER.map((id, i) => {
      const d = CFG.decks[id]; const ic = gicon(DECK_ICON[id] || 'cuon_giay');
      if (deckOpen(i)) return `<button class="mini${ui.deck === id ? ' on' : ''}" data-act="deckpick" data-id="${id}" type="button">${ic}${d.vi}</button>`;
      return `<button class="mini locked" data-act="locked" data-hint="Thắng ${CFG.decks[DECK_ORDER[i - 1]].vi} ở độ khó ${CFG.difficultyPresets[DIFF_ORDER[DIFF_ORDER.length - 1]].vi} để mở" type="button" aria-disabled="true">${ic}${d.vi}</button>`;
    }).join('');
  }
  // Ghi tiến trình khi thắng ván: trả về dòng thông báo nếu vừa mở khóa gì đó
  function recordWin() {
    const di = DIFF_ORDER.indexOf(run.difficultyId); const ki = DECK_ORDER.indexOf(run.deckId); const open = progress.diff[run.deckId] || 1;
    let msg = null;
    if (di >= 0 && di === open - 1 && di < DIFF_ORDER.length - 1) {
      progress.diff[run.deckId] = open + 1;
      msg = `Mở khóa độ khó ${CFG.difficultyPresets[DIFF_ORDER[di + 1]].vi} cho ${CFG.decks[run.deckId].vi}`;
    } else if (di === DIFF_ORDER.length - 1 && ki >= 0 && ki === progress.decks - 1 && ki < DECK_ORDER.length - 1) {
      progress.decks = ki + 2;
      msg = `Mở khóa ${CFG.decks[DECK_ORDER[ki + 1]].vi}`;
    }
    store.set('progress', progress);
    return msg;
  }

  const itemImg = (dir, id) => `<img class="px ic" src="assets/${dir}/${id}.png" alt="" draggable="false">`;
  function offerQueHTML(o) {
    const h = H[o.hand];
    return `<div class="offer offer-row"><div class="oic">${gicon('que_' + o.hand)}</div>`
      + `<div class="otxt"><div class="oname"><b>${h.vi}</b><span class="osub">${queLv(o.hand)}</span></div><div class="desc">${queDesc(o.hand)}</div></div>`
      + `<button class="buy" data-act="buy" data-uid="${o.uid}" ${run.money < o.price ? 'disabled' : ''}>${gicon('thoi_vang')}${o.price} đồng</button></div>`;
  }
  const PACK_NAME = { bua: 'Gói Bùa', que: 'Gói Quẻ', quan: 'Gói Quân' };
  const PACK_DESC = { bua: 'Mở ra 3 bùa, giữ 1 hoặc bỏ qua.', que: 'Mở ra 3 Quẻ: mở khóa một bộ mới hoặc nâng cấp một bộ, miễn phí.', quan: 'Mở ra 3 quân bài (có thể đã phù phép, đóng triện), thêm 1 quân vào bộ bài.' };
  function offerPackHTML(o) {
    const name = PACK_NAME[o.pack];
    const icon = o.pack === 'bua' ? 'hop_qua' : o.pack === 'quan' ? 'bao_do' : 'goi_que';
    return `<div class="offer offer-row"><div class="oic">${gicon(icon)}</div>`
      + `<div class="otxt"><div class="oname"><b>${name}</b><span class="osub">chọn 1 trong ${CFG.shop.packChoices}</span></div><div class="desc">${PACK_DESC[o.pack]}</div></div>`
      + `<button class="buy" data-act="buy" data-uid="${o.uid}" ${run.money < o.price ? 'disabled' : ''}>${gicon('thoi_vang')}${o.price} đồng</button></div>`;
  }
  function offerPhuHTML(o) {
    const p = PHU[o.id];
    return `<div class="offer offer-row"><div class="oic">${itemImg('phu', o.id)}</div>`
      + `<div class="otxt"><div class="oname"><b>${p.vi}</b><span class="osub">vĩnh viễn</span></div><div class="desc">${p.text}</div></div>`
      + `<button class="buy" data-act="buy" data-uid="${o.uid}" ${run.money < o.price ? 'disabled' : ''}>${gicon('thoi_vang')}${o.price} đồng</button></div>`;
  }
  function offerAnHTML(o) {
    const a = AN[o.id];
    return `<div class="offer offer-row"><div class="oic">${itemImg('an', o.id)}</div>`
      + `<div class="otxt"><div class="oname"><b>${a.vi}</b><span class="osub">chọn ${a.max} quân</span></div><div class="desc">${a.text}</div></div>`
      + `<button class="buy" data-act="buy-an" data-uid="${o.uid}" ${run.money < o.price ? 'disabled' : ''}>${gicon('thoi_vang')}${o.price} đồng</button></div>`;
  }
  const CAT_VI = { phu: 'Phù', lt: 'Linh Thạch', phep: 'Phép' };
  function offerConsHTML(o) {
    const c = CDATA.find((x) => x.id === o.id);
    const full = run.consumables.length >= run.consumableSlots;
    const disabled = run.money < o.price || full;
    return `<div class="offer offer-row"><div class="oic"><img class="px gi" src="assets/icons/${c.icon}.png" alt="" draggable="false"></div>`
      + `<div class="otxt"><div class="oname"><b>${c.vi}</b><span class="osub">${CAT_VI[c.category] || 'Tiêu Hao'}</span></div><div class="desc">${c.text}</div></div>`
      + `<button class="buy" data-act="buy" data-uid="${o.uid}" ${disabled ? 'disabled' : ''}>${gicon('thoi_vang')}${o.price}${full ? '<small>Đầy ô</small>' : ''}</button></div>`;
  }
  // dock = bản gắn vào hàng Xếp bài ở màn dọc: luôn hiện, có ô trống, không chiếm thêm hàng
  function consBarHTML(dock) {
    if (!run || !run.consumables) return '';
    if (!dock && !run.consumables.length) return '';
    const items = run.consumables.map((c) => {
      const def = CDATA.find((x) => x.id === c.id);
      const sel = ui.selCons === c.uid;
      const active = ui.consDetail === c.uid;
      return `<button class="cons-item${sel ? ' sel' : ''}${active ? ' active' : ''}" data-act="use-cons" data-uid="${c.uid}" type="button">
        <img class="px gi" src="assets/icons/${def.icon}.png" alt="" draggable="false"><span class="cname">${def.vi}</span></button>`;
    }).join('');
    const empty = '<span class="cons-slot" aria-hidden="true"></span>'.repeat(Math.max(0, run.consumableSlots - run.consumables.length));
    return `<div class="cons-bar${dock ? ' cons-dock' : ''}" role="group" aria-label="Vật phẩm tiêu hao"><span class="cons-cap"><span>Tiêu hao</span><b>${run.consumables.length}/${run.consumableSlots}</b></span><div class="cons-list">${items}${empty}</div></div>`;
  }
  const sortDeck = (cards) => cards.slice().sort((a, b) => R[b.rank].order - R[a.rank].order || HO.indexOf(a.color) - HO.indexOf(b.color));
  function charmsRowHTML() {
    const used = run.usedSlots(); const empty = Math.max(0, run.slots - used);
    const n = run.charms.length + empty;
    const items = run.charms.map((c, i) => charmHTML(c, i)).join('') + '<div class="slot" aria-hidden="true"></div>'.repeat(empty);
    return `<div class="charms" id="charms" style="--n:${Math.max(5, n)};grid-template-columns:repeat(${Math.max(5, n)},1fr)">${items}</div>`;
  }
  function topHTML() {
    const r = run.round;
    return `<div class="panel top"><div class="where"><small>Chặng ${r.chang}/${CFG.changCount}</small><b>${CFG.aiNames[r.kind]}</b><small>${CFG.difficultyPresets[run.difficultyId].vi} · ${CFG.decks[run.deckId].vi}</small></div>`
      + `<button class="mini" data-act="deck" type="button">${gicon('the_bai')}Bộ bài</button><button class="mini" data-act="info" type="button">${gicon('cuon_giay')}Bảng bộ</button><button class="mini" data-act="items" type="button">${gicon('tui_loc')}Vật phẩm${itemsBadge()}</button><div class="coin">${gicon('thoi_vang')}<span id="money">${run.money}</span></div></div>`;
  }

  // ------------------------------------------------------------------ các màn
  const HOWTO = [
    ['the_bai', 'Chọn quân', 'Tối đa 5 quân mỗi lượt đánh'],
    ['am_duong', 'Ghép bộ', 'Đôi, sảnh, cù lũ, tứ quý... xem ở Bảng bộ'],
    ['dong_xu', 'Chip × hệ số', 'Đủ điểm mục tiêu là qua ải'],
    ['tui_loc', 'Bùa và chợ', 'Mua bùa giữa các ải, tính từ trái sang phải'],
  ];
  function viewAchievements() {
    const got = ACH_LIST.filter((a) => achUnlocked(a.id)).length;
    const total = ACH_LIST.length;
    let html = `<div class="panel cash"><small>Thành Tích · ${got}/${total} đã mở khóa</small><h2>Thành Tích</h2>`;
    for (const [group, label] of Object.entries(ACH_GROUP_VI)) {
      const achs = ACH_LIST.filter((a) => a.group === group);
      const groupGot = achs.filter((a) => achUnlocked(a.id)).length;
      html += `<div class="isec"><h3>${label}<small>${groupGot}/${achs.length}</small></h3><ul class="ilist">`;
      for (const a of achs) {
        const unlocked = achUnlocked(a.id);
        const icon = ACH_ICON[a.id];
        html += `<li class="irow${unlocked ? '' : ' ach-lock'}">
          <div class="ach-icon${unlocked ? '' : ' gray'}">${icon ? `<img src="assets/icons/${icon}.png"${unlocked ? '' : ' style="filter:grayscale(1) brightness(0.5)"'}>` : (unlocked ? '★' : '?')}</div>
          <div><b>${a.vi}</b><span>${a.desc}</span></div></li>`;
      }
      html += `</ul></div>`;
    }
    html += `<button class="btn discard big" data-act="home" type="button">Trở về</button></div>`;
    return html;
  }

  function viewTitle() {
    sanitizeSel();
    const demo = [{ id: 'a', color: 'van', rank: 'n10' }, { id: 'b', color: 'sach', rank: 'n5' }, { id: 'c', color: 'wan', rank: 'n9' }, { id: 'd', color: 'van', rank: 'n3' }];
    const sv = savedGame();
    return `<div class="title"><div class="lg"><h1 class="logo" aria-label="PHỖNG.EXE"><img src="assets/brand/logo.png" alt="PHỖNG.EXE, game xếp bài Tổ Tôm" draggable="false"></h1></div>
      <div class="tl"><div class="cards">${demo.map((c) => cardHTML(c)).join('')}</div></div>
      <div class="tbtns">${continueHTML()}<button class="btn ${sv ? 'discard' : 'play'} big" data-act="start" type="button">${gicon('trong_boi')}<span class="bl">Bắt đầu ván mới${sv ? '<small>Thay ván đang lưu</small>' : ''}</span></button></div>
      <div class="tr">
      <div class="panel diff" role="group" aria-label="Độ khó"><small>Độ khó</small>
        <div class="chips diffchips">${diffChipsHTML()}</div>
        <div class="reward">${CFG.difficultyPresets[ui.difficulty].text}.</div></div>
      <div class="panel diff" role="group" aria-label="Bộ bài khởi đầu"><small>Bộ bài khởi đầu</small>
        <div class="chips deckchips">${deckChipsHTML()}</div>
        <div class="reward">${CFG.decks[ui.deck].text}.</div></div>
      <div class="panel howto" role="group" aria-label="Cách chơi"><small>Cách chơi · 8 chặng, mỗi chặng 3 ải, ải cuối có trùm</small>
        <ul>${HOWTO.map(([ic, t, d]) => `<li>${gicon(ic)}<div><b>${t}</b><span>${d}</span></div></li>`).join('')}</ul></div>
      </div>
      <div class="tfoot"><div class="hscore">${gicon('tui_loc')}<span>Điểm kỷ lục</span><b>${fmt(store.get('highScore', 0))}</b></div><button class="mini" data-act="achievements" type="button">${gicon('the_bai')}Thành Tích</button><button class="mini" data-act="settings" type="button">${gicon('cai_dat')}Cài đặt</button></div></div>${overlays()}`;
  }

  // Điều kiện bật chế độ gợi ý: Dễ + Bộ Chuẩn + chặng 1-2
  function isHintMode() {
    return !!(run && run.difficultyId === 'de' && run.deckId === 'chuan' && run.chang <= 2);
  }
  // Trả về Set id các lá trên tay sẽ cải thiện bộ khi thêm vào (1–4 lá đang chọn)
  // Thử mọi cách thêm 1..(5 - số lá đang chọn) lá trên tay, nên gợi ý được cả bộ cần nhiều lá (Sảnh, Cù lũ, Lèo, Tôm, Phu dọc...).
  // Ưu tiên: bộ mà mọi lá đều ghi điểm → bộ mạnh hơn → cần thêm ít lá hơn. Các cách hoà nhau cùng được tô sáng.
  const hintMemo = { key: '', plan: null };
  function hintPlan() {
    const none = { ids: new Set(), type: null, add: 0 };
    if (!isHintMode() || ui.sel.size === 0 || ui.sel.size >= 5 || !run.round || run.phase !== 'playing') return none;
    const sel = [...ui.sel];
    const key = sel.join(',') + '|' + run.round.hand.map((c) => `${c.id}:${c.rank}:${c.color}:${c.enh || ''}`).join(',');
    if (hintMemo.key === key && hintMemo.plan) return hintMemo.plan;
    const ord = DATA.hands.map((h) => h.id); // mạnh → yếu, index nhỏ = mạnh hơn
    const cur = run.preview(sel);
    if (!cur) return none;
    const curIdx = ord.indexOf(cur.type);
    const pool = run.round.hand.filter((c) => !ui.sel.has(c.id) && c.rank !== 'junk').map((c) => c.id);
    const maxAdd = Math.min(5 - sel.length, pool.length);
    let best = null;
    const rec = (start, picked) => {
      if (picked.length) {
        const p = run.preview([...sel, ...picked]); const idx = ord.indexOf(p.type);
        // chỉ gợi ý khi mọi lá (đang chọn lẫn thêm vào) đều nằm trong bộ; không thì lá đang chọn bị bỏ rơi, gợi ý thành ra sai
        if (idx < curIdx && p.unscored.length === 0) {
          const clean = true; const add = picked.length;
          const wins = !best || (clean !== best.clean ? clean : idx !== best.idx ? idx < best.idx : add < best.add);
          if (wins) best = { clean, idx, add, sets: [picked.slice()] };
          else if (clean === best.clean && idx === best.idx && add === best.add) best.sets.push(picked.slice());
        }
      }
      if (picked.length >= maxAdd) return;
      for (let i = start; i < pool.length; i++) { picked.push(pool[i]); rec(i + 1, picked); picked.pop(); }
    };
    rec(0, []);
    const plan = best ? { ids: new Set(best.sets.flat()), type: ord[best.idx], add: best.add } : none;
    hintMemo.key = key; hintMemo.plan = plan;
    return plan;
  }
  // Set id các lá trên tay nên chọn thêm
  function getHintCards() { return hintPlan().ids; }

  function calcState() {
    if (ui.sel.size && run.round && run.phase === 'playing') {
      const p = run.preview([...ui.sel]);
      const warns = [];
      if (p.unscored.length) warns.push(`${p.unscored.length} quân ngoài bộ, không ghi điểm`);
      if (p.banned) warns.push('Trùm phạt bộ này: còn nửa chip, nửa hệ số');
      if (p.debuffed.length) warns.push(`${p.debuffed.length} quân bị trùm vô hiệu`);
      if (p.lockedBetter) warns.push(`🔒 Đủ quân cho <b>${H[p.lockedBetter].vi}</b> nhưng bộ này chưa mở khóa`);
      const hp = hintPlan();
      const est = `Cấp ${p.level} · dự kiến <b class="est">${fmt(p.estimate)}</b> điểm (đã tính bùa)${hp.type ? `<br><span class="hintline">Gợi ý: thêm ${hp.add} ${hp.ids.size > hp.add ? 'trong các lá' : 'lá'} đang sáng →<b>${H[hp.type].vi}</b></span>` : ''}`;
      return { name: H[p.type].vi, sub: warns.length ? `<span class="warn">${warns.join('. ')}</span><br>${est}` : est, chips: p.chips, mult: p.mult, tier: HAND_TIER[p.type] };
    }
    return { name: 'Chọn quân để đánh', sub: 'Tối đa 5 quân', chips: 0, mult: 0, tier: '' };
  }

  // Lá đã chọn bay lên bàn đánh, bỏ chọn thì bay về chỗ cũ; các lá còn lại xô lại theo.
  function playCardsHTML() {
    const r = run.round;
    const inHand = ui.layout === 'port'; // màn dọc: lá được chọn nhô cao và tỏa sáng ngay trong tay bài, không bay lên bàn
    const picked = inHand ? [] : r.hand.filter((c) => ui.sel.has(c.id));
    const rest = inHand ? r.hand : r.hand.filter((c) => !ui.sel.has(c.id));
    const nH = rest.length;
    const hintSet = getHintCards();
    const hand = rest.map((c, i) => { const off = i - (nH - 1) / 2; return cardHTML(c, { act: true, sel: inHand && ui.sel.has(c.id), isNew: !ui.known.has(c.id), cls: ui.stage && !ui.known.has(c.id) ? 'hold' : '', delay: i * 45, fan: { rot: off * 2.2, ty: Math.pow(Math.abs(off), 1.7) * 1.4 }, hint: hintSet.has(c.id) }); }).join('');
    const stage = picked.map((c) => cardHTML(c, { act: true, sel: true })).join('');
    return { stage, hand };
  }
  // Dựng lại bàn đánh và tay bài rồi chạy hoạt ảnh bay (FLIP) từ vị trí cũ sang vị trí mới của từng lá.
  function syncCards() {
    const first = new Map();
    $$('#hand .card, #stage .card').forEach((el) => first.set(el.dataset.id, el.getBoundingClientRect()));
    const { stage, hand } = playCardsHTML();
    const hint = '<div class="hint">Chạm lá để chọn (tối đa 5), rồi bấm Đánh. Chỉ lá thuộc bộ mới ghi điểm; lá còn trên tay có thể kích hoạt bùa.</div>';
    $('#stage').innerHTML = stage || hint; $('#hand').innerHTML = hand;
    fit();
    if (REDUCED) return;
    $$('#hand .card, #stage .card').forEach((el) => {
      const a = first.get(el.dataset.id); if (!a) return;
      const b = el.getBoundingClientRect(); if (!b.width) return;
      const dx = a.left + a.width / 2 - (b.left + b.width / 2); const dy = a.top + a.height / 2 - (b.top + b.height / 2); const s = a.width / b.width;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(s - 1) < 0.02) return;
      el.classList.remove('new'); el.style.animation = 'none'; el.style.zIndex = 8;
      const an = el.animate([{ translate: dx + 'px ' + dy + 'px', scale: String(s) }, { translate: '0px 0px', scale: '1' }], { duration: FAST ? 10 : 260, easing: 'cubic-bezier(.2,.8,.3,1)' });
      an.onfinish = () => { el.style.zIndex = ''; };
    });
  }
  function viewPlay() {
    const r = run.round; const cs = calcState();
    const pct = Math.min(100, (r.score / r.target) * 100);
    const rw = CFG.rewards[r.kind];
    const hint = ui.sel.size ? '' : '<div class="hint">Chạm quân để chọn (tối đa 5), rồi bấm Đánh. Chỉ quân thuộc bộ mới ghi điểm; quân còn trên tay có thể kích hoạt bùa.</div>';
    const { stage: stageCards, hand } = playCardsHTML();
    const stage = ui.stage ? ui.stage.map((c) => cardHTML(c)).join('') : (stageCards || hint);
    const canPlay = !ui.busy && ui.sel.size > 0 && run.phase === 'playing';
    const canDis = canPlay && r.discardsLeft > 0;
    return `<div class="pl"><img class="hudlogo" src="assets/brand/logo.png" alt="PHỖNG.EXE" draggable="false"><div class="blindbar k-${r.kind}"><div class="bb1"><small>Chặng ${r.chang}/${CFG.changCount}</small><b>${CFG.aiNames[r.kind]}</b></div><div class="tools"><button class="mini" data-act="deck" type="button">${gicon('the_bai')}Bộ bài</button><button class="mini" data-act="info" type="button">${gicon('cuon_giay')}Bảng bộ</button><button class="mini" data-act="items" type="button">${gicon('tui_loc')}Vật phẩm${itemsBadge()}</button></div></div>
      ${r.boss ? `<div class="panel boss"><b>${r.boss.vi}</b><span>${r.boss.text}${r.debuffColor ? ` <b class="dc ${r.debuffColor}">Họ bị vô hiệu: ${HO_VI[r.debuffColor]}.</b>` : ''}</span></div>` : `<div class="panel boss strip"><b>Thưởng ải</b><span>${rw} đồng, mỗi lượt đánh dư thêm ${CFG.rewards.perUnusedHand}.</span></div>`}
      <div class="panel target"><div><small>Mục tiêu</small><b class="num">${fmt(r.target)}</b></div>
        <div class="sc"><small>Điểm</small><b class="num score" id="scoreNum">${fmt(r.score)}</b></div>
        <div class="bar"><i id="barFill" style="width:${pct}%"></i></div>
        <div class="reward">Thưởng ải ${rw} đồng, mỗi lượt đánh dư thêm ${CFG.rewards.perUnusedHand}</div></div>
      <div class="panel calc" id="calc"><div class="hname"><b><span id="htierBadge" class="htier t${cs.tier}">${TIER_ICON[cs.tier]||cs.tier}</span> <span id="hname">${cs.name}</span></b><em id="hsub">${cs.sub}</em></div>
        <div class="eq"><div class="cbox" id="chipsBox">${cs.chips}</div><span class="x">×</span><div class="mbox" id="multBox">${fmtM(cs.mult)}</div></div></div>
      <div class="stats"><div class="stat st-h"><small>Lượt đánh</small><b class="num">${r.handsLeft}</b></div><div class="stat st-d"><small>Lượt bỏ</small><b class="num">${r.discardsLeft}</b></div><div class="stat st-m coin"><small>Tiền</small><b class="num" id="money">${run.money}</b></div><div class="stat st-p"><small>Bộ rút</small><b class="num">${r.draw.length}<i>/${run.deck.length}</i></b></div></div>
      </div><div class="pc"><div class="pc-charms"><div class="capt">Bùa ${run.usedSlots()}/${run.slots}</div>${charmsRowHTML()}${consBarHTML()}</div>
      <div class="stage${ui.stage ? ' scoring' : ''}" id="stage">${stage}</div>
      <div class="hand${ui.selCons != null ? ' cons-pick' : ''}" id="hand" role="group" aria-label="Tay bài">${hand}</div>
      <div class="controls">
        <button class="btn play" id="btnPlay" data-act="play" type="button" ${canPlay ? '' : 'disabled'}>Đánh<small>còn ${r.handsLeft} lượt</small></button>
        <button class="btn discard" id="btnDis" data-act="discard" type="button" ${canDis ? '' : 'disabled'}>Bỏ bài<small>còn ${r.discardsLeft} lượt</small></button>
      </div>
      </div><div class="pr"><div class="pile" title="Bộ rút: bấm để xem Bộ bài" role="button" tabindex="0" data-act="deck" aria-label="Xem Bộ bài"><i></i><i></i><i></i><b class="num">${r.draw.length}</b><small>/ ${run.deck.length}</small></div>
      <div class="meta">${consBarHTML(true)}${r.hand.some((c) => c.junk) ? `<span class="mnote">${r.hand.filter((c) => c.junk).length} lá Tạp trên tay</span>` : ''}<span class="sorts"><small>Xếp bài</small><button class="mini${ui.sortMode === 'rank' ? ' on' : ''}" data-act="sort" data-mode="rank" type="button">Theo số</button><button class="mini${ui.sortMode === 'color' ? ' on' : ''}" data-act="sort" data-mode="color" type="button">Theo họ</button></span></div></div>
      ${overlays()}`;
  }

  // Màn chọn ải kiểu Balatro: ba ải của chặng, thẻ bỏ qua xem trước, trùm hiện sẵn
  function viewSelect() {
    const r = run.round; const bl = run.blinds();
    const panels = bl.map((b) => {
      const info = CFG.aiNames[b.kind];
      const tag = b.tag ? CFG.skipTags[b.tag] : null;
      const junk = run.junkBase(b.chang, b.kind);
      const hist = run.history.find((h) => h.chang === b.chang && h.aiIdx === b.idx);
      const state = b.status === 'done' ? (hist && hist.outcome === 'skip' ? 'Đã bỏ qua' : 'Đã qua') : b.status === 'now' ? 'Đang chờ bạn' : 'Sắp tới';
      const now = b.status === 'now';
      return `<div class="blind ${b.kind} ${b.status}" style="--i:${b.idx}"><div class="bh"><b>${info}</b><span class="tag">${state}</span></div>`
        + `<div class="bt"><small>Mục tiêu</small><span class="num">${fmt(b.target)}</span></div>`
        + `<div class="bl">Thưởng ${b.reward} đồng${junk > 0 ? ` · lá Tạp khoảng ${junk % 1 === 0 ? junk : junk.toFixed(1).replace('.', ',')}` : ''}</div>`
        + (b.boss ? `<div class="bb"><b>${b.boss.vi}</b> ${b.boss.text}</div>` : '')
        + (tag && b.status !== 'done' ? `<div class="btag">${itemImg('skip', b.tag)}<span><b>Bỏ qua:</b> Nhận ${tag.vi}, ${tag.text[0].toLowerCase() + tag.text.slice(1)}</span></div>` : '')
        + (now ? `<div class="bbtn"><button class="btn play" data-act="intro-go" type="button">Chọn ải<small>${r.handsLeft} lượt đánh, ${r.discardsLeft} lượt bỏ, tay ${r.handSize} quân</small></button>${run.canSkip() ? `<button class="btn discard" data-act="skip" type="button">Bỏ qua<small>${tag ? 'Nhận ' + tag.vi : ''}</small></button>` : ''}</div>` : '')
        + '</div>';
    }).join('');
    return `${topHTML()}<div class="panel selhead"><small>Chặng ${r.chang}/${CFG.changCount}</small><b>Chọn ải để vào</b></div>${panels}
      <div class="panel shop-sec"><h3>Bùa của bạn<span class="reward">${run.usedSlots()}/${run.slots} ô · chạm để đổi chỗ hoặc bán</span></h3>${charmsRowHTML()}</div>${overlays()}`;
  }

  // Mở Gói: ba lá úp lật lần lượt, chọn một hoặc bỏ qua
  function viewPack() {
    const pk = run.pack; const isBua = pk.pack === 'bua';
    const cards = pk.choices.map((c, i) => {
      let face;
      if (c.kind === 'charm') {
        const info = CH[c.id]; const fake = { uid: 'p' + i, id: c.id, variant: c.variant, state: {} };
        const v = c.variant ? `<b>${CFG.variants[c.variant].vi}:</b> ${CFG.variants[c.variant].text}. ` : '';
        face = `${charmHTML(fake, i, 'div')}<div class="desc"><span class="tag ${info.rarity}">${RARITY[info.rarity]}</span> ${moneyText(info.text)}<br>${v}</div>`;
      } else if (c.kind === 'card') {
        const card = { id: 'pk' + i, color: c.color, rank: c.rank, enh: c.enh, seal: c.seal };
        const line = (img, name, text) => `<div class="pkline"><img class="px" src="${img}" alt="" draggable="false"><div><b>${name}</b><span>${text}</span></div></div>`;
        const lines = [c.enh ? line(`assets/an/${c.enh}.png`, CFG.enhancements[c.enh].vi, CFG.enhancements[c.enh].text) : '', c.seal ? line(`assets/an/trien_${c.seal}.png`, CFG.seals[c.seal].vi, CFG.seals[c.seal].text) : ''].filter(Boolean).join('');
        face = `<div class="pk-card">${cardHTML(card, {})}</div><div class="desc pkdesc"><b class="pkname">${cardName(c)} ${HO_VI[c.color]}</b>${lines || '<span class="pkplain">Lá thường, không phù phép.</span>'}</div>`;
      } else {
        const h = H[c.hand]; const lv = run.handLevels[c.hand];
        face = `<div class="que"><b>Quẻ<br>${h.vi}</b><span class="lv">${queLv(c.hand)}</span></div><div class="desc">${queDesc(c.hand)}</div>`;
      }
      return `<div class="offer pcard" style="--i:${i}"><div class="flipin">${face}<button class="buy" data-act="pack-pick" data-i="${i}" type="button">Chọn</button></div></div>`;
    }).join('');
    const replacing = ui.packPick != null;
    return `${topHTMLFor(ui.cashout || { chang: run.chang, kind: 'thuong' })}
      <div class="panel cash"><small>Gói vừa mở</small><div class="big">${PACK_NAME[pk.pack]}</div><p>${replacing ? 'Ô bùa đã đầy: chạm một bùa của bạn để thay bằng lựa chọn này.' : 'Chọn một món, hoặc bỏ qua nếu không ưng.'}</p></div>
      <div class="offers packrow">${cards}</div>
      ${replacing ? `<div class="panel shop-sec"><h3>Thay bùa nào?<span class="reward">chạm một bùa</span></h3><div class="charms" style="grid-template-columns:repeat(${run.charms.length},1fr)">${run.charms.map((c, i) => charmHTML(c, i).replace('data-act="charm"', 'data-act="pack-replace"')).join('')}</div><button class="btn discard" data-act="pack-cancel" type="button">Quay lại</button></div>`
        : `<button class="btn discard" data-act="pack-skip" type="button">Bỏ qua Gói</button><div class="panel shop-sec"><h3>Bùa của bạn<span class="reward">${run.usedSlots()}/${run.slots} ô</span></h3>${charmsRowHTML()}</div>`}${overlays()}`;
  }
  function viewSkip() {
    const r = run.round;
    return `${topHTML()}<div class="panel cash"><small>Chặng ${r.chang}/${CFG.changCount}</small><div class="big">Bỏ qua ${CFG.aiNames[r.kind]}</div><p>Chọn một Quẻ miễn phí. Ván đi thẳng tới ải kế tiếp, không qua chợ.</p>
      <div class="offers">${run.skipOffer.map((h) => { return `<div class="offer"><div class="que"><b>Quẻ<br>${H[h].vi}</b><span class="lv">${queLv(h)}</span></div><div class="desc">${queDesc(h)}</div><button class="buy" data-act="skip-pick" data-hand="${h}" type="button">Nhận</button></div>`; }).join('')}</div></div>${overlays()}`;
  }

  function viewCashout() {
    const c = ui.cashout; const rw = c.reward;
    let k = 0; const row = (label, v) => `<div class="line rowin" style="--d:${(k++ * 0.42).toFixed(2)}s"><span>${label}</span><span class="num" data-count="${v}">+0</span></div>`;
    const rows = [row(`Thưởng ${CFG.aiNames[c.kind]}`, rw.base)];
    if (rw.unused > 0) rows.push(row(`Lượt đánh dư × ${rw.unused}`, rw.unused * rw.perUnused));
    if (rw.extra > 0) rows.push(row('Từ bùa', rw.extra));
    if (rw.interest > 0) rows.push(row(`Lãi (1 đồng mỗi ${CFG.interest.per} đồng đang giữ)`, rw.interest));
    if (rw.invest > 0) rows.push(row('Thẻ Đầu Tư', rw.invest));
    const totalDelay = (k * 0.42).toFixed(2);
    return `${topHTMLFor(c)}<div class="panel cash"><small>Chặng ${c.chang}/${CFG.changCount}</small><div class="big">Qua ${CFG.aiNames[c.kind]}!</div>
      <div class="line"><span>Điểm</span><span class="num">${fmt(c.score)} / ${fmt(c.target)}</span></div>
      ${rw.sealLevels && rw.sealLevels.length ? `<p>Triện Lam: ${rw.sealLevels.map((h) => H[h].vi).join(', ')} lên 1 cấp.</p>` : ''}
      ${rw.how === 'saved' ? '<p>Phao Cứu Sinh đã cứu ải này và tự mất.</p>' : ''}
      ${rows.join('')}<div class="line rowin total" style="--d:${totalDelay}s"><span><b>Tổng thưởng</b></span><span class="num" data-count="${rw.total}">+0</span></div>
      <button class="btn play big rowin" style="--d:${(+totalDelay + 0.5).toFixed(2)}s" data-act="cash-next" type="button">${run.phase === 'than' ? 'Chọn bùa Thần' : 'Vào chợ'}</button></div>${overlays()}`;
  }
  function topHTMLFor(c) {
    return `<div class="panel top"><div class="where"><small>Chặng ${c.chang}/${CFG.changCount}</small><b>${CFG.aiNames[c.kind]}</b><small>${CFG.difficultyPresets[run.difficultyId].vi} · ${CFG.decks[run.deckId].vi}</small></div>`
      + `<button class="mini" data-act="deck" type="button">${gicon('the_bai')}Bộ bài</button><button class="mini" data-act="info" type="button">${gicon('cuon_giay')}Bảng bộ</button><button class="mini" data-act="items" type="button">${gicon('tui_loc')}Vật phẩm${itemsBadge()}</button><div class="coin">${gicon('thoi_vang')}<span>${run.money}</span></div></div>`;
  }

  function viewThan() {
    const offers = run.thanOffers.map((id) => ({ uid: id, id, variant: null }));
    const full = run.usedSlots() >= run.slots;
    let body;
    if (ui.thanPick) {
      body = `<div class="panel shop-sec"><h3>Hết ô bùa<span class="reward">Chạm bùa muốn thay</span></h3>
        <div class="charms" style="grid-template-columns:repeat(${run.charms.length},1fr)">${run.charms.map((c) => charmHTML(c, 0).replace('data-act="charm"', 'data-act="than-replace"')).join('')}</div>
        <button class="btn discard" data-act="than-cancel" type="button">Quay lại</button></div>`;
    } else {
      body = `<div class="panel shop-sec"><h3>Chọn một bùa Thần<span class="reward">${full ? 'Ô bùa đã đầy, sẽ phải thay một bùa' : 'Còn ô trống'}</span></h3>
        <div class="offers">${offers.map((o) => `<div class="offer">${charmHTML({ ...o, state: {} }, 0, 'div')}<div class="desc">${moneyText(CH[o.id].text)}</div><button class="buy" data-act="than-pick" data-id="${o.id}" type="button">Nhận</button></div>`).join('')}</div>
        <button class="btn discard" data-act="than-skip" type="button">Bỏ qua</button></div>`;
    }
    return `${topHTMLFor(ui.cashout)}<div class="panel cash"><small>Chiến lợi phẩm</small><div class="big">Hạ trùm chặng ${ui.cashout.chang}</div><p>Bùa Thần rất mạnh và không bán ở chợ.</p></div>${body}${overlays()}`;
  }

  function viewShop() {
    const nextChang = run.aiIdx === 2 ? run.chang + 1 : run.chang;
    const nextIdx = (run.aiIdx + 1) % 3;
    const nextKind = CFG.aiKinds[nextIdx];
    const tgt = run.targetFor(nextChang, nextIdx);
    const boss = run.bosses[nextChang - 1];
    const charmOffers = run.shop.offers.filter((o) => o.kind === 'charm');
    const queOffers = run.shop.offers.filter((o) => o.kind === 'que');
    const anOffers = run.shop.offers.filter((o) => o.kind === 'an');
    const packOffers = run.shop.offers.filter((o) => o.kind === 'pack');
    const phuOffers = run.shop.offers.filter((o) => o.kind === 'phu');
    const consOffers = run.shop.offers.filter((o) => o.kind === 'cons');
    const last = ui.cashout || { chang: run.chang, kind: 'thuong' };
    const owned = run.vouchers.map((id) => PHU[id].vi).join(', ');
    const bulbs = (cls) => `<div class="bulbs ${cls}">${'<i></i>'.repeat(11)}</div>`;
    const sign = `<div class="shopsign" role="img" aria-label="Chợ">${bulbs('t')}<div class="ss-in"><b>CHỢ</b><small>Sắm sửa cho ván bài</small></div>${bulbs('b')}</div>`;
    return `${sign}${topHTMLFor(last)}
      <div class="panel next-boss"><small>Ải kế tiếp</small><br><b style="color:var(--gold);font-size:18px">Chặng ${nextChang} · ${CFG.aiNames[nextKind]}</b>, mục tiêu <b class="num" style="font-size:22px">${fmt(tgt)}</b>.<br>
        Trùm chặng ${nextChang}: <b>${boss.vi}</b>, ${boss.text.toLowerCase()}.</div>
      <div class="panel shop-sec"><h3>Bùa<span class="reward">Làm mới ${run.rerollCost()} đồng</span></h3>
        <div class="offers list-offers">${charmOffers.map(offerCharmHTML).join('') || '<div class="reward">Hết bùa để bán.</div>'}</div>
        <button class="btn discard" data-act="reroll" type="button" ${run.money < run.rerollCost() ? 'disabled' : ''}>${gicon('lam_moi')}Làm mới chợ<small>${run.rerollCost()} đồng · Gói và Phù giữ nguyên</small></button></div>
      <div class="panel shop-sec"><h3>Gói và Phù<span class="reward">${phuOffers.length ? 'Phù hiếm: mỗi chặng một món' : 'Hết Phù chặng này'}</span></h3>
        <div class="offers list-offers">${packOffers.map(offerPackHTML).join('')}${phuOffers.map(offerPhuHTML).join('')}</div>
        ${owned ? `<div class="reward">Phù đã có: ${owned}.</div>` : ''}</div>
      <div class="panel shop-sec cons-sec"><h3>Vật Phẩm Tiêu Hao<span class="reward">${run.consumables.length}/${run.consumableSlots} ô</span></h3><div class="offers list-offers">${consOffers.map(offerConsHTML).join('') || '<div class="reward no-offer">Chặng này không có hàng.</div>'}</div></div>
      <div class="panel shop-sec que-an-sec"><h3>Quẻ và Ấn<span class="reward">sửa bộ bài, nâng bộ</span></h3>
        <div class="offers list-offers">${queOffers.map(offerQueHTML).join('')}${anOffers.map(offerAnHTML).join('')}</div>
        <div class="reward">Giữ tiền để ăn lãi: cuối mỗi ải được 1 đồng cho mỗi ${CFG.interest.per} đồng, tối đa ${CFG.interest.cap + run.bonus('interestCapBonus')}.</div></div>
      <div class="panel shop-sec charms-sec"><h3>Bùa của bạn<span class="reward">${run.usedSlots()}/${run.slots} ô · chạm để bán hoặc đổi chỗ</span></h3>${charmsRowHTML()}</div>
      <button class="btn play big" data-act="leave-shop" type="button">Vào ải kế</button>${overlays()}`;
  }

  function viewEnd() {
    const won = run.phase === 'won'; const last = run.history[run.history.length - 1];
    const hist = run.history.map((h) => `<i class="${h.outcome === 'lose' ? 'lose' : h.kind === 'trum' ? 't' : ''}" title="Chặng ${h.chang} ${CFG.aiNames[h.kind]}: ${fmt(h.score)}/${fmt(h.target)}"></i>`).join('');
    const cleared = run.history.filter((h) => h.outcome !== 'lose').length;
    return `<div class="panel cash"><small>Kết thúc ván</small>
      <div class="big">${won ? 'Thắng rồi! Hạn Bạt đã bị hạ.' : `Dừng ở chặng ${last.chang}, ${CFG.aiNames[last.kind]}`}</div>
      ${won ? '' : `<div class="line"><span>Điểm</span><span class="num">${fmt(last.score)} / ${fmt(last.target)}</span></div>`}
      <div class="line"><span>Số ải vượt qua</span><span class="num">${cleared} / ${CFG.changCount * 3}</span></div>
      <div class="hist" aria-label="Lịch sử các ải">${hist}</div>
      <small>Bùa cuối ván</small>${run.charms.length ? `<div class="charms" style="grid-template-columns:repeat(${Math.max(5, run.charms.length)},1fr)">${run.charms.map((c) => charmHTML(c, 0, 'div')).join('')}</div>` : '<div class="reward">Không có bùa nào.</div>'}
      <div class="reward">Độ khó: ${CFG.difficultyPresets[run.difficultyId].vi} · ${CFG.decks[run.deckId].vi} · Hạt giống ván: ${run.seed}</div>
      ${ui.unlockMsg ? `<div class="unlock">${gicon('hop_qua')}<b>${ui.unlockMsg}</b></div>` : ''}
      <button class="btn play big" data-act="again" type="button">Chơi ván mới</button><button class="btn discard big" data-act="home" type="button">Chọn bộ bài và độ khó</button></div>`;
  }

  // Ấn đã dùng suy ra từ bộ bài (Ấn phù phép, Triện); Thẻ bỏ qua lấy từ lịch sử ván
  const ENH_AN = { ngoc: 'ngoc', kim: 'kim', son: 'son', thep: 'thep', linh: 'linh', luu_ly: 'luu_ly' };
  const SEAL_AN = { do: 'trien_do', vang: 'trien_vang', lam: 'trien_lam' };
  function itemsData() {
    const an = new Map();
    for (const c of run.deck) {
      if (c.enh && ENH_AN[c.enh]) an.set(ENH_AN[c.enh], (an.get(ENH_AN[c.enh]) || 0) + 1);
      if (c.seal && SEAL_AN[c.seal]) an.set(SEAL_AN[c.seal], (an.get(SEAL_AN[c.seal]) || 0) + 1);
    }
    const the = new Map();
    for (const h of run.history) if (h.outcome === 'skip' && h.tag) the.set(h.tag, (the.get(h.tag) || 0) + 1);
    return { phu: run.vouchers.slice(), an: [...an], the: [...the] };
  }
  function itemsBadge() { if (!run) return ''; const d = itemsData(); const n = d.phu.length + d.an.length + d.the.length; return n ? ` <b class="ibadge">${n}</b>` : ''; }
  function itemsOverlay() {
    const d = itemsData();
    const row = (dir, id, name, text, n) => `<li class="irow"><img class="px ic" src="assets/${dir}/${id}.png" alt="" draggable="false"><div><b>${name}${n > 1 ? ` <em>×${n}</em>` : ''}</b><span>${text}</span></div></li>`;
    const sec = (title, sub, rows) => `<div class="isec"><h3>${title}<small>${sub}</small></h3>${rows.length ? `<ul class="ilist">${rows.join('')}</ul>` : '<p class="reward">Chưa có.</p>'}</div>`;
    const phu = d.phu.map((id) => row('phu', id, PHU[id].vi, PHU[id].text, 1));
    const an = d.an.map(([id, n]) => row('an', id, AN[id].vi, AN[id].text, n));
    const the = d.the.map(([id, n]) => row('skip', id, CFG.skipTags[id].vi, CFG.skipTags[id].text, n));
    const pend = run.pendingInvest > 0 ? `<p class="reward">Thẻ Đầu Tư đang chờ: +${run.pendingInvest} đồng sau khi hạ trùm kế tiếp.</p>` : '';
    return `<div class="overlay" data-act="close-bg"><div class="panel sheet wide" role="dialog" aria-label="Vật phẩm"><h2>Vật phẩm đã có</h2>
      ${sec('Phù', 'nâng cấp vĩnh viễn', phu)}${sec('Ấn đã dùng', 'đang nằm trên lá bài (số lá)', an)}${sec('Thẻ bỏ qua', 'đã nhận trong ván', the)}${pend}
      <p class="reward">Ấn Nhân Bản, Trừ Tà, Đảo Họ sửa thẳng bộ bài nên không hiện ở đây; xem trong Bộ bài.</p>
      <button class="btn play" data-act="close" type="button">Đóng</button></div></div>`;
  }

  function overlays() {
    let out = '';
    if (ui.picker) {
      const a = AN[ui.picker.anId];
      const cards = sortDeck(run.deck).map((c) => cardHTML(c, { cls: ui.picker.sel.has(c.id) ? 'picked' : '' }).replace('class="card', 'data-act="pick" class="card')).join('');
      out += `<div class="overlay${ui.picker.still ? ' still' : ''}"><div class="panel sheet wide" data-nox role="dialog" aria-label="${a.vi}"><h2>${a.vi}</h2><p>${a.text}. Đã chọn ${ui.picker.sel.size}/${a.max}. Bộ bài hiện có ${run.deck.length} quân.</p>
        <div class="deckgrid">${cards}</div>
        <div class="row btns"><button class="btn discard" data-act="pick-cancel" type="button">Huỷ</button><button class="btn play" data-act="pick-ok" type="button" ${ui.picker.sel.size ? '' : 'disabled'}>Dùng Ấn (${ui.picker.price} đồng)</button></div></div></div>`;
    }
    if (ui.deckView) {
      const inPlay = ui.view === 'play' && run.phase === 'playing';
      const left = inPlay ? new Set(run.round.draw.map((c) => c.id)) : null;
      const groups = new Map();
      for (const c of sortDeck(run.deck)) {
        const k = [c.color, c.rank, c.enh || '', c.seal || '', c.tmp ? 't' : ''].join('|');
        const g = groups.get(k) || { c, n: 0, left: 0 }; g.n++; if (left && left.has(c.id)) g.left++; groups.set(k, g);
      }
      const cards = [...groups.values()].map((g) => `<div class="dgroup">${cardHTML(g.c, { cls: left && g.left === 0 ? 'used' : '', noDeb: true })}<b class="cbadge">${left ? `${g.left}/${g.n}` : '×' + g.n}</b></div>`).join('');
      out += `<div class="overlay" data-act="close-bg"><div class="panel sheet wide" role="dialog" aria-label="Bộ bài"><h2>Bộ bài (${run.deck.length} quân, ${groups.size} loại)</h2>
        <p class="reward">${inPlay ? `Số nhỏ là còn bao nhiêu bản chưa rút trong ải này (còn/tổng); lá mờ là đã hết. Còn ${left.size} quân chưa rút.` : 'Bộ bài dùng cho mọi ải. Ấn ở chợ sẽ sửa bộ bài này.'}</p>
        <div class="deckgrid">${cards}</div><button class="btn play" data-act="close" type="button">Đóng</button></div></div>`;
    }
    if (ui.settings) out += settingsOverlay();
    if (ui.items) out += itemsOverlay();
    if (ui.consDetail != null) {
      const cons = run.consumables.find((c) => c.uid === ui.consDetail);
      if (!cons) { ui.consDetail = null; }
      else {
        const def = CDATA.find((x) => x.id === cons.id);
        const catVI = { phu: 'Phù', lt: 'Linh Thạch', phep: 'Phép' };
        const catLabel = catVI[def.category] || 'Tiêu Hao';
        out += `<div class="overlay" data-act="close-bg"><div class="panel sheet cons-popup" role="dialog" aria-label="${def.vi}">
          <div class="cons-popup-top">
            <img class="px gi cons-popup-icon" src="assets/icons/${def.icon}.png" alt="" draggable="false">
            <div class="cons-popup-info">
              <span class="tag" style="background:var(--lacquer2);color:var(--muted)">${catLabel}</span>
              <h2>${def.vi}</h2>
              <p>${def.text}</p>
            </div>
          </div>
          <div class="row btns">
            <button class="btn discard" data-act="close" type="button">Hủy</button>
            <button class="btn play" data-act="confirm-use-cons" data-uid="${cons.uid}" type="button">Dùng ngay</button>
          </div></div></div>`;
      }
    }
    if (ui.detail != null) {
      const i = run.charms.findIndex((c) => c.uid === ui.detail);
      if (i < 0) ui.detail = null;
      else {
        const c = run.charms[i]; const info = CH[c.id]; const v = c.variant ? CFG.variants[c.variant] : null;
        const live = c.state && c.state.mult > 0 && (c.id === 'tot_thi' || c.id === 'ma_tang_toc') ? `<p>Đang cộng <b>+${c.state.mult}</b> hệ số.</p>` : '';
        out += `<div class="overlay" data-act="close-bg"><div class="panel sheet" role="dialog" aria-label="${info.vi}">
          <div class="row" style="align-items:center"><span class="tag ${info.rarity}">${RARITY[info.rarity]}</span><span class="tag" style="background:var(--lacquer2);color:var(--muted)">${BUILD[info.build]}</span></div>
          <h2>${info.vi}</h2><p>${moneyText(info.text)}</p>${v ? `<p><b>${v.vi}:</b> ${v.text}</p>` : ''}${live}
          <p class="reward">Thứ tự hiện tại: ô ${i + 1}. Bùa bên trái được tính trước.</p>
          <div class="row btns"><button class="btn discard" data-act="move-l" type="button" ${i === 0 ? 'disabled' : ''}>◀ Sang trái</button><button class="btn discard" data-act="move-r" type="button" ${i === run.charms.length - 1 ? 'disabled' : ''}>Sang phải ▶</button></div>
          <div class="row btns"><button class="btn red" data-act="sell" type="button">Bán +${c.sell}</button><button class="btn discard" data-act="close" type="button">Đóng</button></div></div></div>`;
      }
    }
    if (ui.info) {
      const rows = Object.keys(H).map((id) => {
        const h = H[id]; const lv = run.handLevels[id];
        const val = `${h.chips + (lv - 1) * h.lvChips} × ${h.mult + (lv - 1) * h.lvMult}`;
        const meta = `Cấp ${lv}${ui.playCount[id] ? ' · đã đánh ' + ui.playCount[id] : ''}`;
        const tier = HAND_TIER[id];
        return `<li class="hrow${lv > 1 ? ' up' : ''}"><div class="hn"><b><span class="htier t${tier}">${TIER_ICON[tier]||tier}</span> ${h.vi}</b><span>${h.desc}</span></div><div class="hv"><b class="num">${val}</b><small>${meta}</small></div></li>`;
      }).join('');
      out += `<div class="overlay" data-act="close-bg"><div class="panel sheet wide" role="dialog" aria-label="Bảng bộ"><h2>Bảng bộ</h2>
        <p class="reward">Xếp từ mạnh đến yếu. Số in đậm là <b>chip × hệ số</b> hiện tại. Game tự lấy bộ điểm cao nhất; lá ngoài bộ không ghi điểm.</p>
        <ul class="hlist">${rows}</ul>
        ${run.vouchers.length ? `<p class="reward"><b>Phù đã có:</b> ${run.vouchers.map((id) => PHU[id].vi + ' (' + PHU[id].text + ')').join('; ')}.</p>` : ''}
        <div class="row btns"><button class="btn play" data-act="close" type="button">Đóng</button></div></div></div>`;
    }
    return out.replace(/(<div class="panel sheet[^"]*" role="dialog" aria-label="[^"]*">)/g, '$1<button class="sx" data-act="close" type="button" aria-label="Đóng">×</button>');
  }

  // ------------------------------------------------------------------ vẽ lại và cập nhật nhỏ
  function render() {
    hideTip();
    let html = '';
    const sel = ui.view === 'play' && ui.intro;
    if (ui.view === 'achievements') html = viewAchievements();
    else if (ui.view === 'title' || !run) html = viewTitle();
    else if (sel) html = viewSelect();
    else if (ui.view === 'play') html = viewPlay();
    else if (ui.view === 'cashout') html = viewCashout();
    else if (ui.view === 'than') html = viewThan();
    else if (ui.view === 'shop') html = viewShop();
    else if (ui.view === 'pack') html = viewPack();
    else if (ui.view === 'end') html = viewEnd();
    else if (ui.view === 'skip') html = viewSkip();
    root.innerHTML = html;
    if (run && ui.view === 'play' && !ui.intro && !ui.stage) ui.known = new Set(run.round.hand.map((c) => c.id));
    // nền đổi màu theo ngữ cảnh: ải trùm đỏ, chợ lục ngọc
    const mood = !run || ui.view === 'title' || ui.view === 'end' ? 'normal'
      : ui.view === 'play' ? (run.round.kind === 'trum' ? 'boss' : 'normal')
      : ui.view === 'pack' ? 'pack' : 'shop';
    document.body.dataset.mood = mood;
    const stg = run ? Math.min(CFG.changCount, Math.max(1, run.chang || 1)) : 5;
    (function() {
      const bgEl = document.querySelector('.bgimg');
      if (!bgEl) return;
      const lyt = document.documentElement.dataset.layout || 'port';
      const key = `assets/bg/stage${stg}_${lyt === 'land' ? 'l' : 'p'}.webp`;
      const url = (typeof __A !== 'undefined' && __A && __A[key]) ? __A[key] : key;
      bgEl.style.backgroundImage = `url(${url})`;
      bgEl.style.backgroundSize = 'cover';
      bgEl.style.backgroundPosition = 'center bottom';
      bgEl.style.backgroundRepeat = 'no-repeat';
    })();
    root.dataset.view = ui.view + (sel ? '-select' : '');
    const key = ui.view + (sel ? ':select' : '');
    const viewChanged = ui.prevView !== key;
    if (viewChanged) { root.classList.remove('enter'); void root.offsetWidth; root.classList.add('enter'); ui.prevView = key; }
    // tiền nhấp nháy khi đổi
    const coin = $('.coin');
    if (coin && run && ui.lastMoney != null && run.money !== ui.lastMoney) {
      coin.classList.add(run.money > ui.lastMoney ? 'gain' : 'loss'); setTimeout(() => coin.classList.remove('gain', 'loss'), 700);
    }
    if (run) ui.lastMoney = run.money;
    ui.justBought = null;
    if (ui.view === 'cashout') $$('[data-count]').forEach((el, i) => setTimeout(() => countUp(el, +el.dataset.count, 380), (FAST ? 1 : 1000) * i * 0.42 * (FAST ? 0.01 : 1) + 80));
    fit(); requestAnimationFrame(fit); setTimeout(fit, 450);
    { const ov = root.querySelector(':scope > .overlay'); const okey = ov ? ((ov.querySelector('[role="dialog"]') || ov).getAttribute('aria-label') || ov.className) : ''; const now = performance.now(); if (okey !== ui.ovKey) ui.ovT = now; if (ov && okey === ui.ovKey && now - (ui.ovT || 0) > 150) ov.classList.add('still'); ui.ovKey = okey; }
    if (viewChanged) viewIn(); dealIn();
    if (ui.view === 'end') clearSave(); else queueSave();
    updateDev(); updateGear();
    document.body.classList.toggle('scoring', !!ui.stage && ui.view === 'play');
  }
  // Hai bố cục dùng chung một bộ thành phần (GDD mục 10): ngang nếu rộng/cao >= 1,2; dọc nếu nhỏ hơn. ?layout=land|port để thử.
  function setLayout() {
    const forced = (location.search.match(/[?&]layout=(land|port)/) || [])[1] || (settings.layout !== 'auto' ? settings.layout : undefined);
    const next = forced || (window.innerWidth >= 560 && window.innerWidth / Math.max(1, window.innerHeight) >= 1.2 ? 'land' : 'port');
    document.documentElement.dataset.layout = next;
    if (ui.layout !== next) { ui.layout = next; render(); }
  }
  function fit() {
    const h = $('#hand'); if (!h || !run || !run.round) return;
    const n = Math.max(6, run.round.hand.length || run.round.handSize);
    const W = h.clientWidth || 340;
    let cw; let cols;
    if (ui.layout === 'land') {
      cols = n; cw = Math.min(92, W / (n - (n - 1) * 0.14), (window.innerHeight - 250) / 5.8);
    } else {
      cols = n; cw = Math.min(92, (W - 8) / (n - (n - 1) * 0.36 + 0.78)); // chừa chỗ cho lá ngoài cùng xoè nghiêng và lá được chọn phóng to
    }
    const st = document.documentElement.style;
    cw = Math.max(ui.layout === 'port' ? 44 : 38, cw);
    const pl = $('#app[data-view="play"] .pl');
    if (pl) { pl.style.zoom = ''; pl.style.height = ''; pl.style.maxHeight = ''; if (ui.layout === 'land') { const avail = window.innerHeight - 32; const kids = Array.from(pl.children).filter((c) => c.offsetHeight > 0); const need = kids.reduce((s, c) => { const cs = getComputedStyle(c); return s + c.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom); }, 0) + Math.max(0, kids.length - 1) * 10 + 14; if (need > avail + 1) { const z = avail / need; pl.style.zoom = z.toFixed(3); pl.style.height = (avail / z).toFixed(1) + 'px'; pl.style.maxHeight = pl.style.height; } } }
    st.setProperty('--cols', cols); st.setProperty('--cw', cw.toFixed(1) + 'px');
    // thu nhỏ lá cho đến khi cả màn chơi vừa một khung hình, không phải cuộn (tối thiểu 46 px)
    const root = $('#app');
    // màn ngang thấp (điện thoại xoay ngang): lá to hết mức mà cột giữa vẫn vừa chiều cao, đo thật thay vì ước lượng
    if (root.dataset.view === 'play' && ui.layout === 'land' && window.innerHeight <= 520) {
      const pc = $('.pc');
      if (pc) {
        let lo = 30; let hi = Math.min(92, (W - 24) / (n - (n - 1) * 0.14)); // chừa 24px vì lá ngoài cùng xoè nghiêng
        const ctl = $('.controls'); const top = $('.pc-charms'); const ratio = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ratio')) || 2.4;
        // không dùng scrollHeight: lá bài xoè bằng transform nên luôn bị tính là tràn
        const fitsL = (v) => { st.setProperty('--cw', v.toFixed(1) + 'px'); const need = (top ? top.offsetHeight : 0) + (v * ratio * 0.6 + 8) + h.offsetHeight + (ctl ? ctl.offsetHeight + 4 : 0) + 18; return need <= pc.clientHeight + 1; };
        if (!fitsL(hi)) { for (let i = 0; i < 9; i++) { const mid = (lo + hi) / 2; if (fitsL(mid)) lo = mid; else hi = mid; } fitsL(lo); }
      }
    }
    root.style.zoom = ''; root.style.height = '';
    if (root.dataset.view === 'play' && ui.layout === 'port') {
      const fits = (v) => { st.setProperty('--cw', v.toFixed(1) + 'px'); const m = $('.meta'); return m ? m.offsetTop + m.offsetHeight + 8 <= root.clientHeight + 1 : root.scrollHeight - root.clientHeight <= 1; };
      const shrink = (top) => { fits(top); return fits(top); };
      if (!shrink(cw)) {
        // màn hình thấp (Safari có thanh công cụ, máy nhỏ): lá đã nhỏ hết mức mà vẫn tràn thì thu nhỏ cả màn chơi cho vừa khung nhìn
        const VH = window.innerHeight; let z = 1;
        for (let pass = 0; pass < 4; pass++) {
          const m = $('.meta'); const need = m ? m.offsetTop + m.offsetHeight + 8 : root.scrollHeight;
          z = Math.max(0.55, Math.min(1, z * (VH / z) / need));
          root.style.zoom = z.toFixed(3); root.style.height = (VH / z).toFixed(1) + 'px';
          shrink(cw);
          if (fits(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cw')) || 38)) break;
        }
      }
    }
  }

  function setCalc(name, sub, chips, mult, bump, anim, tier) {
    const a = $('#hname'); if (!a) return;
    a.textContent = name; $('#hsub').innerHTML = sub;
    if (tier !== undefined) { const tb = $('#htierBadge'); if (tb) { tb.textContent = tier ? (TIER_ICON[tier] || tier) : ''; tb.className = 'htier t' + (tier || ''); } }
    const c = $('#chipsBox'); const m = $('#multBox');
    if (anim) { rollTo(c, chips, (v) => String(Math.round(v)), 300); rollTo(m, mult, fmtM, 300); }
    else { c._v = chips; m._v = mult; c._rid = (c._rid || 0) + 1; m._rid = (m._rid || 0) + 1; c.textContent = Math.round(chips); m.textContent = fmtM(mult); heatBox(c, 0, 1); heatBox(m, 0, 1); }
    if (bump === 'c' || bump === 'm') {
      const el = bump === 'c' ? c : m;
      if (anim && !NOFX()) punch(el, bump === 'm' ? 0.26 : 0.18, 2.5, 460);
      else { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), anim ? 260 : 140); }
    }
  }
  function refreshSel() {
    const pv = ui.sel.size && run.phase === 'playing' ? run.preview([...ui.sel]) : null;
    const scoringIds = new Set(pv ? pv.cards.map((c) => c.id) : []);
    const debIds = new Set(pv ? pv.debuffed : []);
    if (!refreshSel.skipSync) syncCards();
    $$('#stage .card, #hand .card').forEach((el) => {
      const sel = ui.sel.has(el.dataset.id);
      el.classList.toggle('sel', sel); el.classList.toggle('dim', sel && !scoringIds.has(el.dataset.id));
      if (pv && sel) el.classList.toggle('deb', debIds.has(el.dataset.id));
    });
    const cs = calcState(); setCalc(cs.name, cs.sub, cs.chips, cs.mult, undefined, undefined, cs.tier);
    const r = run.round;
    $('#btnPlay').disabled = !(ui.sel.size > 0 && !ui.busy);
    $('#btnDis').disabled = !(ui.sel.size > 0 && !ui.busy && r.discardsLeft > 0);
  }
  function floatAt(el, text, cls, dy = 0) {
    if (!el) return;
    const b = el.getBoundingClientRect(); const d = document.createElement('div');
    d.className = 'float ' + cls; d.textContent = text;
    if (REDUCED) d.style.animationDuration = '.01s';
    d.style.left = b.left + b.width / 2 + 'px'; d.style.top = b.top + b.height * 0.15 + dy + 'px';
    document.body.appendChild(d);
    if (!NOFX() && (cls === 'c' || cls === 'm' || cls === 'x' || cls === 'again')) { springTag(d, cls); setTimeout(() => d.remove(), 1100); } else setTimeout(() => d.remove(), 950);
  }
  // ---- chuyển động lò xo: lấy mẫu đáp ứng bậc thang có nảy (overshoot) thành keyframes cho WAAPI, chạy trên GPU
  const NOFX = () => FAST || REDUCED || settings.reduce;
  const SPR = (() => { const n = 20; const w = 16; const z = 0.42; const wd = w * Math.sqrt(1 - z * z); const T = 0.5; const a = []; for (let i = 0; i <= n; i++) { const t = (i / n) * T; a.push(1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t))); } return a; })();
  // nhãn số: bật ra có nảy, xoay lệch rồi chính lại, nằm yên một nhịp, bay lên và mờ
  function springTag(d, cls) {
    d.style.animation = 'none';
    const r0 = (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 10); const r1 = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3);
    const big = cls === 'x' ? 1.12 : 1; const n = SPR.length - 1; const kf = [];
    SPR.forEach((x, i) => kf.push({ offset: (i / n) * 0.4, opacity: Math.min(1, x * 3), transform: `translate(-50%, ${(14 - 24 * x).toFixed(1)}px) scale(${(x * big).toFixed(3)}) rotate(${(r0 + (r1 - r0) * x).toFixed(2)}deg)` }));
    kf.push({ offset: 0.78, opacity: 1, transform: `translate(-50%, -10px) scale(${big}) rotate(${r1}deg)` });
    kf.push({ offset: 1, opacity: 0, transform: `translate(-50%, -44px) scale(${(0.9 * big).toFixed(2)}) rotate(${r1}deg)` });
    d.animate(kf, { duration: ui.skip ? 420 : 1000, fill: 'forwards', easing: 'linear' });
  }
  // nhấn nảy: phóng to rồi lò xo về, kèm lắc nhẹ (dùng cho ô chip/hệ số, tên bộ)
  function punch(el, amp = 0.2, rot = 2, dur = 440) {
    if (!el || NOFX()) return;
    const s = rot ? (Math.random() < 0.5 ? -1 : 1) : 0; const n = SPR.length - 1;
    el.animate(SPR.map((x, i) => ({ offset: i / n, scale: String((1 + amp * (1 - x)).toFixed(3)), rotate: `${(s * rot * (1 - x)).toFixed(2)}deg` })), { duration: dur, easing: 'linear' });
  }
  // lá bài / bùa nhảy lên khi ghi điểm: bật lên, dãn dọc, rơi xuống và nén lại như có trọng lượng
  function popEl(el) {
    if (!el) return;
    if (NOFX()) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 420); return; }
    const charm = !!el.closest('#charms'); const H0 = charm ? 12 : 22; const wob = charm ? 9 : 3; const n = SPR.length - 1; const s = Math.random() < 0.5 ? -1 : 1;
    const kf = [{ offset: 0, translate: '0 0', scale: '1 1', rotate: '0deg' }, { offset: 0.16, translate: `0 ${-H0}px`, scale: '0.94 1.1', rotate: `${s * wob}deg` }];
    SPR.forEach((x, i) => { if (i === 0) return; kf.push({ offset: 0.16 + (i / n) * 0.84, translate: `0 ${(-H0 * (1 - x)).toFixed(2)}px`, scale: `${(1 + 0.08 * (1 - x)).toFixed(3)} ${(1 - 0.08 * (1 - x)).toFixed(3)}`, rotate: `${(s * wob * (1 - x)).toFixed(2)}deg` }); });
    el.animate(kf, { duration: charm ? 520 : 460, easing: 'linear' });
  }
  // điểm xuất phát/đích của lá bài: chồng bài (ngang) hoặc ô Bộ rút (dọc, khi chồng bài bị ẩn)
  function deckRect() {
    for (const el of $$('.pile, .st-p')) { const b = el.getBoundingClientRect(); if (b.width > 0) return b; }
    const h = $('#hand'); if (h) { const b = h.getBoundingClientRect(); return { left: b.right - 20, top: b.top + b.height * 0.5, width: 0, height: 0 }; }
    return { left: innerWidth - 40, top: innerHeight - 80, width: 0, height: 0 };
  }
  // chia bài: từng lá bay từ chồng bài ra vị trí, xoay thẳng dần, lò xo nảy khi đến nơi
  function dealIn() {
    if (NOFX() || ui.view !== 'play') return;
    const cards = $$('#hand .card.new'); if (!cards.length) return;
    const pb = deckRect();
    const px = pb.left + pb.width / 2; const py = pb.top + pb.height / 2; const n = SPR.length - 1;
    cards.forEach((el, i) => {
      const b = el.getBoundingClientRect(); if (!b.width) return;
      const dx = px - (b.left + b.width / 2); const dy = py - (b.top + b.height / 2); const r0 = (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 16);
      el.animate(SPR.map((x, j) => ({ offset: j / n, translate: `${(dx * (1 - x)).toFixed(1)}px ${(dy * (1 - x)).toFixed(1)}px`, rotate: `${(r0 * (1 - x)).toFixed(2)}deg`, scale: (0.5 + 0.5 * x).toFixed(3), opacity: Math.min(1, x * 4) })), { duration: 520, delay: i * 70, easing: 'linear', fill: 'backwards' });
      if (i < 8) setTimeout(() => playSfx('card_select', 0.1, 1 + i * 0.05), i * 70);
    });
  }
  // vào màn mới: các khối trượt lên lần lượt bằng lò xo; chợ thì các món hàng bật ra thêm một nhịp; bảng tổng kết đếm từng dòng
  function viewIn() {
    if (NOFX() || !['cashout', 'shop', 'pack', 'than', 'skip', 'end'].includes(ui.view)) return;
    const n = SPR.length - 1;
    const rise = (el, delay, dy, from) => el.animate(SPR.map((x, j) => ({ offset: j / n, translate: `0 ${(dy * (1 - x)).toFixed(1)}px`, scale: (from + (1 - from) * x).toFixed(3), opacity: Math.min(1, x * 3.5) })), { duration: 560, delay, easing: 'linear', fill: 'backwards' });
    $$('#app > *').slice(0, 9).forEach((el, i) => rise(el, i * 55, 46, 0.97));
    if (ui.view === 'shop') $$('#app .offer').slice(0, 14).forEach((el, i) => rise(el, 260 + i * 45, 18, 0.88));
    if (ui.view === 'cashout') $$('#app .rowin').forEach((el, i) => {
      const d = (parseFloat(el.style.getPropertyValue('--d')) || 0) * 1000;
      el.animate(SPR.map((x, j) => ({ offset: j / n, translate: `${(-26 * (1 - x)).toFixed(1)}px 0`, scale: (0.92 + 0.08 * x).toFixed(3), opacity: Math.min(1, x * 4) })), { duration: 520, delay: d, easing: 'linear', fill: 'backwards' });
      if (!el.classList.contains('total') && el.tagName !== 'BUTTON') setTimeout(() => playSfx('chip', 0.3, 1 + i * 0.07), d + 60);
    });
  }
  // lá đã ghi điểm bay xéo vào chồng bỏ bài, lần lượt từng lá
  async function flyAway() {
    if (NOFX() || ui.skip) return;
    const cards = $$('#stage .card'); if (!cards.length) return;
    const pb = deckRect();
    const tx = pb.left + pb.width / 2; const ty = pb.top + pb.height / 2;
    cards.forEach((el, i) => {
      const b = el.getBoundingClientRect(); const dx = tx - (b.left + b.width / 2); const dy = ty - (b.top + b.height / 2); const rot = (Math.random() < 0.5 ? -1 : 1) * (25 + Math.random() * 35);
      el.style.zIndex = 60;
      el.animate([{ translate: '0 0', rotate: '0deg', scale: '1', opacity: 1 }, { offset: 0.22, translate: '0 -18px', rotate: `${-rot * 0.2}deg`, scale: '1.06', opacity: 1 }, { translate: `${dx}px ${dy}px`, rotate: `${rot}deg`, scale: '0.35', opacity: 0.1 }], { duration: 430, delay: i * 55, easing: 'cubic-bezier(.5,0,.8,.45)', fill: 'forwards' });
    });
    await new Promise((r) => setTimeout(r, 430 + cards.length * 55));
  }

  async function animateScore(res, before) {
    const steps = res.steps; const r = run.round;
    ui.skip = false;
    { const sc0 = $('#scoreNum'); const bf0 = $('#barFill'); if (sc0) sc0.textContent = fmt(before); if (bf0) { bf0.style.transition = 'none'; bf0.style.width = Math.min(100, (before / r.target) * 100) + '%'; } } // thanh điểm đứng yên ở giá trị cũ cho đến khi chip × hệ số nổ ra
    const onTap = () => { ui.skip = true; };
    document.addEventListener('pointerdown', onTap);
    let hint = null;
    if (!FAST && !REDUCED) { hint = document.createElement('div'); hint.className = 'skiphint'; hint.textContent = 'Chạm để tua nhanh'; document.body.appendChild(hint); }
    const hs = steps.find((x) => x.kind === 'hand');
    const hv = hs ? hs.chips * hs.mult : 0; // sức nặng của bộ ở cấp hiện tại
    const grand = hv >= 600; const mid = hv >= 250;
    const lo = grand ? 240 : mid ? 200 : 150; const hi = grand ? 400 : mid ? 340 : 270;
    const delay = Math.max(lo, Math.min(hi, 4200 / Math.max(steps.length, 1)));
    let n = 0; let xCount = 0; let combo = 0;
    for (const st of steps) {
      await sleep(st.kind === 'hand' ? 300 : delay);
      if (st.kind === 'hand') {
        setCalc(H[st.type].vi, `Cấp ${st.level}`, st.chips, st.mult, null, false, HAND_TIER[st.type]);
        playSfx('card_flip', 0.6); punch($('#hname'), grand ? 0.5 : mid ? 0.35 : 0.2, 3, 520);
        if (mid) {
          fanfare(H[st.type].vi, grand);
          if (grand) { arpeggio(5); playSfx('fanfare', 0.7, 1, 2.5); flash(false); shake(9); const c = $('#calc').getBoundingClientRect(); burst(c.left + c.width / 2, c.top + 30, 26); await sleep(800); }
          else { playSfx('card_flip', 0.5); await sleep(560); }
        }
        continue;
      }
      if (st.kind === 'banned') { floatAt($('#calc'), 'Bị phạt', 'w'); setCalc($('#hname').textContent, '<span class="warn">Trùm phạt bộ này</span>', st.chips, st.mult, null, true); thud(); shake(5); continue; }
      const charmEl = st.charmIdx != null ? $(`#charms [data-idx="${st.charmIdx}"]`) : null;
      if (st.kind === 'again') {
        const el = $(`#stage [data-id="${st.cardId}"]`);
        popEl(el); popEl(charmEl); floatAt(el, 'Lại!', 'again');
        blip(560 + st.n * 90, 0.09, 'triangle', 0.06); whoosh();
        continue;
      }
      let anchor = charmEl;
      if (st.kind === 'card' || st.kind === 'enh') {
        anchor = $(`#stage [data-id="${st.cardId}"]`) || $(`#hand [data-id="${st.cardId}"]`); popEl(anchor);
        if (st.debuffed) { floatAt(anchor, '0', 'w'); continue; }
      } else {
        popEl(charmEl);
        if (st.where === 'card') popEl($(`#stage [data-id="${st.cardId}"]`));
        if (st.where === 'held') popEl($(`#hand [data-id="${st.cardId}"]`));
      }
      let dy = 0;
      const vname = st.kind === 'variant' && CFG.variants[st.variant] ? CFG.variants[st.variant].vi + ' ' : ''; // men của bùa: ghi rõ tên để khỏi nhầm với hiệu ứng bùa
      if (st.dChips) { floatAt(anchor, vname + '+' + Math.round(st.dChips), 'c', dy); dy -= 30; }
      if (st.dMult) { floatAt(anchor, vname + '+' + fmtM(st.dMult), 'm', dy); dy -= 30; }
      if (st.xMult) { floatAt(anchor, vname + '×' + fmtM(st.xMult), 'x', dy); xCount++; shake(Math.min(14, 4 + xCount * 3)); flash(false); }
      else if (st.dMult && n % 2 === 0) shake(2);
      combo++; setCombo(combo);
      setCalc($('#hname').textContent, $('#hsub').innerHTML, st.chips, st.mult, st.xMult || st.dMult ? 'm' : 'c', true);
      // ô chip và hệ số to dần, nóng dần theo con số
      const cb0 = $('#chipsBox'); const mb0 = $('#multBox');
      const ch = st.chips >= 300 ? 3 : st.chips >= 150 ? 2 : st.chips >= 70 ? 1 : 0; const mh = st.mult >= 60 ? 3 : st.mult >= 24 ? 2 : st.mult >= 10 ? 1 : 0;
      heatBox(cb0, ch, (1 + Math.min(0.15, Math.log2(st.chips + 1) / 45)).toFixed(3)); heatBox(mb0, mh, (1 + Math.min(0.24, Math.log2(st.mult + 1) / 24)).toFixed(3));
      if (mb0 && (st.dMult || st.xMult)) { const b = mb0.getBoundingClientRect(); embers(b.left + b.width / 2, b.top + 4, [2, 4, 7, 12][mh], b.width * 0.7, 60 + mh * 30); }
      playSfx(st.xMult ? 'mult' : 'chip', st.xMult ? 0.7 : 0.55);
      if (st.xMult) sweep(220, 880, 0.25, 'sawtooth', 0.05);
      n++;
    }
    // chip và hệ số lao vào nhau, nổ thành điểm
    await sleep(420);
    const cb = $('#chipsBox'); const mb = $('#multBox'); const eq = $('#calc .eq');
    clearCombo();
    if (cb && mb) { cb.classList.add('smash-l'); mb.classList.add('smash-r'); sweep(180, 1200, 0.3, 'sawtooth', 0.06); }
    await sleep(320);
    const ratio = res.score / r.target;
    const total = before + res.score; const over = total >= r.target; const crossed = over && before < r.target;
    const tier = ratio < 0.1 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 1 ? 3 : 4;
    if (eq) { $('#calc').classList.add('merged'); eq.innerHTML = `<div class="merge t${tier}">${fmt(res.score)}</div>`; }
    const m = $('#calc .merge');
    const box = (m || $('#calc')).getBoundingClientRect();
    const cx = box.left + box.width / 2; const cy = box.top + box.height / 2;
    burst(cx, cy, [8, 18, 34, 60, 120][tier]);
    if (tier >= 2) { embers(cx, cy + 10, tier === 4 ? 36 : tier === 3 ? 18 : 8, box.width, tier === 4 ? 200 : tier === 3 ? 130 : 70); flash(tier === 4); }
    shake([7, 10, 14, 19, 26][tier]);
    if (tier >= 2) thud();
    if (tier >= 3) { arpeggio(tier === 4 ? 7 : 5); if (tier === 4) playSfx('fanfare', 0.7, 1, 2.5); } else chime();
    if (tier >= 1) floatAt($('#calc'), ['', 'Khá!', 'Hay!', 'Tuyệt vời!', 'QUÁ TẢI!!'][tier], 'tier', -34);
    // điểm chạy vào thanh: càng nhiều điểm càng chạy lâu, tiếng tích tăng dần
    const dur = FAST ? 20 : [500, 800, 1100, 1450, 1900][tier];
    const to = r.score; const pctOf = (v) => Math.min(100, (v / r.target) * 100);
    await sleep(520); // để người chơi thấy con số điểm vừa nổ ra, rồi mới nạp vào thanh
    const barBox = $('.target'); const bar = $('#barFill'); if (bar) bar.style.transition = 'none';
    if (bar) bar.classList.add('charging'); if (barBox) barBox.classList.add('charging'); if (!FAST) { sweep(160, 900, Math.min(2, dur / 1000), 'triangle', 0.05); }
    let lastTick = 0; let overShown = false; const t0 = performance.now();
    await new Promise((done) => {
      const tick = (t) => {
        const spd = ui.skip ? 6 : 1;
        const k = Math.min(1, ((t - t0) * spd) / dur); const v = before + (to - before) * (1 - Math.pow(1 - k, 2.2));
        const sc = $('#scoreNum'); const bf = $('#barFill');
        if (sc) sc.textContent = fmt(v); if (bf) bf.style.width = pctOf(v) + '%';
        if (!FAST && t - lastTick > 55 && k < 1) { lastTick = t; playSfx('score_tick', 0.18 + k * 0.25, 0.6 + k * 0.8) || blip(300 + k * 700, 0.04, 'square', 0.025); }
        if (!FAST && bf && Math.random() < 0.55 && k < 1) { const q = bf.getBoundingClientRect(); embers(q.right, q.top + q.height / 2, 1, 4, 40 + k * 60); }
        if (v >= r.target && !overShown && barBox) {
          overShown = true; barBox.classList.add('over'); flash(false); shake(10); sweep(220, 1800, 0.55, 'sawtooth', 0.12); sweep(440, 3000, 0.4, 'square', 0.07); setTimeout(() => sweep(600, 2200, 0.35, 'sawtooth', 0.09), 60);
          const bb = $('.bar'); if (bb) { const q = bb.getBoundingClientRect(); embers(q.right - 10, q.top, 14, 40, 110); floatAt(bb, crossed ? 'VƯỢT MỤC TIÊU!' : 'TRÀN BAR!', 'tier', -40); }
        }
        if (overShown && !FAST && Math.random() < 0.35) { const bb = $('.bar'); if (bb) { const q = bb.getBoundingClientRect(); embers(q.left + Math.random() * q.width, q.top, 1, 6, 70); } }
        if (k < 1) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
    if (over && !FAST && total >= r.target * 1.5) { const bb = $('.bar'); if (bb) floatAt(bb, `×${fmtM(Math.round((total / r.target) * 10) / 10)} mục tiêu`, 'x', 10); }
    await sleep(over ? 900 : 420);
    if (barBox) barBox.classList.remove('over', 'charging');
    if (bar) { bar.style.transition = ''; bar.classList.remove('charging'); }
    document.removeEventListener('pointerdown', onTap); if (hint) hint.remove(); ui.skip = false;
    const cb2 = $('#chipsBox'); const mb2 = $('#multBox'); heatBox(cb2, 0, 1); heatBox(mb2, 0, 1);
  }

  // ------------------------------------------------------------------ hành động
  function startGame() {
    unlockAudio(); sanitizeSel();
    store.set('runsStarted', store.get('runsStarted', 0) + 1);
    run = new Run({ seed: Math.floor(Math.random() * 1e9), difficulty: ui.difficulty, deck: ui.deck });
    ui.achRun = { discardUsedThisAi: false, tripleSpecial: new Set(), flush5Count: 0, bossStreak: 0, glassStreak: 0, noBuy: true, sweepTypes: new Set() };
    ui.view = 'play'; ui.intro = true; ui.sel.clear(); ui.playCount = {}; ui.known = new Set(); ui.stage = null; ui.detail = null; ui.consDetail = null; ui.info = false; ui.busy = false; ui.lastMoney = null; ui.prevView = null; ui.packPick = null; ui.justBought = null; ui.selCons = null;
    render();
  }
  async function doPlay() {
    if (ui.busy || !ui.sel.size || run.phase !== 'playing') return;
    ui.busy = true; unlockAudio();
    const r = run.round; const before = r.score;
    const ids = [...ui.sel]; // Set giữ thứ tự chọn → lá chọn trước ghi điểm trước
    const played = ids.map((id) => r.hand.find((c) => c.id === id)).filter(Boolean).map((c) => ({ ...c }));
    const prePos = new Map();
    $$('#hand .card, #stage .card').forEach((el) => prePos.set(el.dataset.id, el.getBoundingClientRect()));
    let res;
    try { res = run.play(ids); } catch (err) { toast(err.message); ui.busy = false; return; }
    ui.sel.clear(); ui.stage = played; ui.playCount[res.hand.type] = (ui.playCount[res.hand.type] || 0) + 1;
    checkPlayAch(res, played);
    if (ui.sortMode && run.phase === 'playing') run.sortHand(ui.sortMode);
    render();
    if (!REDUCED && !FAST) {
      blip(640, 0.09, 'triangle', 0.07);
      $$('#stage .card').forEach((el) => {
        const a = prePos.get(el.dataset.id); if (!a) return;
        const b = el.getBoundingClientRect(); if (!b.width) return;
        const dx = a.left + a.width / 2 - (b.left + b.width / 2); const dy = a.top + a.height / 2 - (b.top + b.height / 2); const s = a.width / b.width;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(s - 1) < 0.02) return;
        el.animate([{ translate: `${dx}px ${dy}px`, scale: String(s) }, { translate: '0px 0px', scale: '1' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)' });
      });
    }
    await animateScore(res, before);
    await flyAway();
    ui.stage = null;
    const handScore = res.total - before;
    if (handScore > 0) {
      const hs = store.get('highScore', 0);
      if (handScore > hs) {
        store.set('highScore', handScore);
        if (hs > 0) showRecord('Kỷ lục mới!', `${fmt(handScore)} điểm (hơn ${fmt(hs)})`);
        else showRecord('Kỷ lục đầu tiên!', `${fmt(handScore)} điểm trong 1 lần đánh`);
      }
    }
    const out = res.outcome;
    if (res.leveled && res.leveled.length) showLevelUp(res.leveled);
    if (res.sealMoney) { toast(`Triện Vàng: +${res.sealMoney} đồng`); blip(990, 0.1, 'triangle', 0.07); }
    if (res.broken && res.broken.length) { toast(`Lưu Ly vỡ ${res.broken.length} quân, mất khỏi bộ bài`); shake(6); playSfx('glass_break', 0.8); }
    if (res.hooked && res.hooked.length) { toast(`${r.boss.vi} móc mất ${res.hooked.length} quân trên tay`); shake(8); thud(); }
    if (res.tax) { toast(`${r.boss.vi} thu ${res.tax} đồng`); thud(); }
    if (out === 'continue') { ui.busy = false; render(); const _sv = ui.view, _si = ui.intro; setTimeout(() => { if (ui.view === _sv && !ui.intro === !_si) blip(600, 0.09, 'triangle', 0.06); }, 120); return; }
    await sleep(250);
    if (out === 'lost' || out === 'won') { out === 'won' ? playSfx('fanfare', 0.9, 1, 3.5) : thud(); ui.unlockMsg = out === 'won' ? recordWin() : null; ui.view = 'end'; }
    else { ui.cashout = { reward: run.lastReward, score: r.score, target: r.target, kind: r.kind, chang: r.chang }; ui.view = 'cashout'; }
    ui.busy = false; render();
  }
  async function doDiscard() {
    if (ui.busy || !ui.sel.size || run.phase !== 'playing' || run.round.discardsLeft <= 0) return;
    ui.busy = true; unlockAudio();
    const ids = [...ui.sel];
    $$('#hand .card, #stage .card').forEach((el) => { if (ids.includes(el.dataset.id)) el.classList.add('discarding'); });
    playSfx('card_discard', 0.7);
    await sleep(260);
    const flip = run.charms.some((c) => charmDefs[c.id].flipOnDiscard);
    let dres;
    try { dres = run.discard(ids); } catch (err) { toast(err.message); ui.busy = false; render(); return; }
    if (ui.achRun) ui.achRun.discardUsedThisAi = true;
    ui.sel.clear(); ui.busy = false; if (ui.sortMode) run.sortHand(ui.sortMode); render();
    const _sv2 = ui.view, _si2 = ui.intro; setTimeout(() => { if (ui.view === _sv2 && !ui.intro === !_si2) blip(580, 0.09, 'triangle', 0.055); }, 80);
    if (dres && dres.money) { toast(`Nhặt Ve Chai: +${dres.money} đồng`); blip(990, 0.1, 'triangle', 0.07); }
    else if (flip) toast('Lá bị bỏ đã đổi họ và quay lại bộ bài');
  }

  // Sau khi đóng Gói: về chợ, hoặc sang ải kế nếu Gói đến từ Thẻ Gói
  function afterPack() {
    ui.packPick = null;
    if (run.phase === 'shop') ui.view = 'shop';
    else { ui.view = 'play'; ui.intro = true; ui.known = new Set(); ui.sel.clear(); if (ui.sortMode) run.sortHand(ui.sortMode); }
  }
  function skipToast(res) {
    const T = CFG.skipTags;
    if (res.charmId) return `${T.bua.vi}: nhận ${CH[res.charmId].vi}`;
    if (res.tag === 'bua') return `${T.bua.vi}: ô bùa đầy nên nhận ${res.money} đồng`;
    if (res.tag === 'tien') return `${T.tien.vi}: +${res.money} đồng`;
    if (res.tag === 'dautu') return `${T.dautu.vi}: sẽ nhận ${res.invest} đồng sau khi hạ trùm kế tiếp`;
    if (res.tag === 'nhanh') return `${T.nhanh.vi}: +${res.money} đồng (${res.skips} lần bỏ qua)`;
    if (res.tag === 'cap') return `${T.cap.vi}: ${H[res.hand].vi} lên ${res.levels} cấp`;
    if (res.tag === 'cons') {
      if (res.consId) { const cd = CDATA.find((x) => x.id === res.consId); return `${T.cons.vi}: nhận ${cd ? cd.vi : res.consId}`; }
      return `${T.cons.vi}: ô tiêu hao đầy nên nhận ${res.money} đồng`;
    }
    return '';
  }
  // ------------------------------------------------------------------ chú giải quân bài (di chuột, hoặc nhấn giữ trên điện thoại)
  let tipEl = null; let tipFor = null; let pressTimer = null; let pressXY = null; let noClickUntil = 0;
  // Bộ đặc biệt của Tổ tôm: đúng 3 lá cụ thể (khớp SPECIAL trong engine)
  const SPECIAL_SETS = {
    tom: [['van', 'n7'], ['sach', 'n3'], ['wan', 'n3']],
    leo: [['sach', 'n8'], ['wan', 'n9'], ['van', 'n10']],
    tam_yeu: [['van', 'n10'], ['sach', 'n10'], ['wan', 'n10']],
  };
  // Các bộ có thể gồm lá này: mỗi bộ một dòng ngắn (tên bộ + lá cần ghép)
  function tipSets(rank, color) {
    const k = +rank.slice(1); const hv = HO_VI[color];
    const nm = (n) => cardName({ rank: 'n' + n, color });
    const lock = (id) => (run.handLevels[id] === 0 ? ' <i class="tag-lock">chưa mở</i>' : '');
    const row = (label, html) => `<div class="tiprow"><b>${label}</b><span>${html}</span></div>`;
    const out = [];
    out.push(row('Cùng số', `${H.pair_mixed.vi} · ${H.three.vi} · ${H.four.vi}`));
    const run3 = [k > 1 ? nm(k - 1) : null, '<em>' + nm(k) + '</em>', k < 10 ? nm(k + 1) : null].filter(Boolean).join(' › ');
    out.push(row('Sảnh', `${run3}<small>3–5 lá liền số. Cùng họ ${hv} = ${H.run3_same.vi}</small>`));
    out.push(row(H.flush5.vi, `5 lá cùng họ ${hv}`));
    for (const [id, need] of Object.entries(SPECIAL_SETS)) {
      if (!need.some(([h, r]) => h === color && r === rank)) continue;
      const names = need.map(([h, r]) => { const n = cardName({ rank: r, color: h }) + (r === 'n10' ? '' : ' ' + HO_VI[h]); return h === color && r === rank ? '<em>' + n + '</em>' : n; });
      out.push(row(H[id].vi + lock(id), names.join(' + ')));
    }
    return `<div class="tipsets">${out.join('')}</div>`;
  }
  function hideTip() { if (tipEl) { tipEl.remove(); tipEl = null; tipFor = null; } }
  function showTip(card) {
    if (!run || !card || !card.dataset) return;
    const d = card.dataset; if (!d.rank || !R[d.rank]) return;
    hideTip(); tipFor = card;
    const colorVi = HO_VI[d.color];
    const chips = (card.querySelector('.chipv') || {}).textContent;
    const lines = [];
    if (d.enh && CFG.enhancements[d.enh]) lines.push(`<span><b class="tg">${CFG.enhancements[d.enh].vi}:</b> ${CFG.enhancements[d.enh].text}.</span>`);
    if (d.seal && CFG.seals[d.seal]) lines.push(`<span><b class="tg">${CFG.seals[d.seal].vi}:</b> ${CFG.seals[d.seal].text}.</span>`);
    if (card.classList.contains('deb')) lines.push('<span class="warn">Bị trùm vô hiệu: không ghi điểm.</span>');
    lines.push(d.rank === 'junk' ? '<small>Lá Tạp: không ghép được bộ nào.</small>' : tipSets(d.rank, d.color));
    const t = document.createElement('div'); t.className = 'tip';
    t.innerHTML = `<div class="tipname"><i class="dot ${d.color}"></i><span>${cardName({ rank: d.rank, color: d.color })} ${colorVi}</span>${d.rank === 'junk' ? '' : `<em class="tipchip">${chips} chip</em>`}</div>${lines.join('')}`;
    document.body.appendChild(t); tipEl = t;
    const b = card.getBoundingClientRect(); const w = t.offsetWidth; const h = t.offsetHeight;
    let x = b.left + b.width / 2 - w / 2; x = Math.max(6, Math.min(innerWidth - w - 6, x));
    let y = b.top - h - 10; if (y < 6) y = Math.min(innerHeight - h - 6, b.bottom + 10);
    t.style.left = x + 'px'; t.style.top = y + 'px';
  }
  document.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const c = e.target.closest && e.target.closest('.card'); if (c && c !== tipFor) { showTip(c); if (!REDUCED && !FAST && settings.sfxOn && !ui.intro) blip(600 + (Math.random() * 100 | 0), 0.055, 'triangle', 0.036); } else if (!c) hideTip(); });
  document.addEventListener('pointerout', (e) => { if (e.pointerType !== 'mouse') return; const c = e.target.closest && e.target.closest('.card'); if (c && !(e.relatedTarget && c.contains(e.relatedTarget))) hideTip(); });
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') { hideTip(); return; }
    const c = e.target.closest && e.target.closest('.card'); if (!c) { hideTip(); return; }
    pressXY = [e.clientX, e.clientY]; clearTimeout(pressTimer);
    pressTimer = setTimeout(() => { showTip(c); noClickUntil = Date.now() + 700; }, 420); // nhấn giữ: xem chú giải, không chọn quân
  });
  document.addEventListener('pointermove', (e) => { if (pressXY && Math.hypot(e.clientX - pressXY[0], e.clientY - pressXY[1]) > 10) { clearTimeout(pressTimer); pressXY = null; } });
  const endPress = () => { clearTimeout(pressTimer); pressXY = null; if (tipEl && Date.now() < noClickUntil) { noClickUntil = Date.now() + 350; setTimeout(hideTip, 1600); } };
  document.addEventListener('pointerup', endPress); document.addEventListener('pointercancel', endPress);
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('.card')) e.preventDefault(); });

  function onClick(e) {
    if (Date.now() < noClickUntil && e.target.closest('.card')) return; // vừa nhấn giữ để xem chú giải
    const t = e.target.closest('[data-act]'); if (!t) return;
    const act = t.dataset.act;
    if (act === 'close-bg' && e.target !== t) return;
    if (ui.busy && !['info', 'close', 'close-bg', 'mute', 'deck'].includes(act)) return;
    switch (act) {
      case 'diff': ui.difficulty = t.dataset.id; render(); break;
      case 'deckpick': ui.deck = t.dataset.id; sanitizeSel(); render(); break;
      case 'locked': toast(t.dataset.hint || 'Chưa mở khóa'); playSfx('negative', 0.5); break;
      case 'home': playSfx('card_select', 0.2, 0.85); run = null; ui.view = 'title'; ui.intro = false; ui.unlockMsg = null; render(); break;
      case 'achievements': ui.view = 'achievements'; render(); break;
      case 'set-dev': settings.dev = t.dataset.id === '1'; if (settings.dev) settings.devOpen = true; saveSettings(); updateDev(); render(); break;
      case 'start': playSfx('card_flip', 0.5); startGame(); break;
      case 'again': playSfx('card_flip', 0.5); if (run) { ui.difficulty = run.difficultyId; ui.deck = run.deckId; } startGame(); break;
      case 'continue': unlockAudio(); playSfx('card_flip', 0.5); loadRun(); break;
      case 'settings': ui.settings = true; ui.info = false; playSfx('card_select', 0.18, 1.3); render(); break;
      case 'set-music': settings.musicOn = t.dataset.id === '1'; saveSettings(); applySettings(); if (settings.musicOn) unlockAudio(); render(); break;
      case 'set-sfx': settings.sfxOn = t.dataset.id === '1'; saveSettings(); applySettings(); if (settings.sfxOn) { unlockAudio(); playSfx('card_select', 0.7); } render(); break;
      case 'clear-ask': ui.confirmClear = true; render(); break;
      case 'clear-cancel': ui.confirmClear = false; render(); break;
      case 'clear-do': clearAllData(); break;
      case 'set-reduce': settings.reduce = t.dataset.id === '1'; applySettings(); saveSettings(); render(); break;
      case 'set-layout': settings.layout = t.dataset.id; saveSettings(); setLayout(); render(); break;
      case 'replay-story': ui.settings = false; render(); showStory(); break;
      case 'quit': clearTimeout(saveTimer); saveRun(); stopTutorial(false); playSfx('card_select', 0.2, 0.85); run = null; ui.view = 'title'; ui.intro = false; ui.unlockMsg = null; ui.settings = false; ui.sel.clear(); ui.stage = null; ui.busy = false; render(); break;
      case 'ios-guide': ui.settings = false; render(); openIosGuide(); break;
      case 'replay-tut': ui.settings = false; store.set('tutDone', false); store.set('tutForce', true); render(); if (run && ui.view === 'play' && !ui.intro) startTutorial(); else toast('Hướng dẫn sẽ hiện ở ván tới'); break;
      case 'mute': ui.muted = !ui.muted; if (!ui.muted) unlockAudio(); render(); break;
      case 'intro-go': {
        playSfx('shuffle', 0.4);
        ui.intro = false; ui.known = new Set(); render();
        maybeTutorial();
        const r = run.round;
        blindBanner(r);
        if (r.kind === 'trum') { thud(); shake(8); } else whoosh();
        break;
      }
      case 'card': {
        const id = t.dataset.id;
        if (ui.selCons != null) {
          const uid = ui.selCons; ui.selCons = null; ui.consDetail = null;
          try {
            const cr = run.useConsumable(uid, [id]);
            playSfx('card_flip', 0.6, 1.1);
            const def = CDATA.find((x) => x.id === (run.consumables.find((c) => c.uid === uid) || {}).id) || CDATA.find(() => true);
            if (cr.enh) toast(`Áp ${CFG.enhancements[cr.enh].vi} lên quân đã chọn`);
            else if (cr.seal) toast(`Đóng ${CFG.seals[cr.seal].vi} lên quân đã chọn`);
            else if (cr.cardId) toast('Đã nhân bản quân vào bộ bài');
          } catch (err) { toast(err.message); }
          render(); break;
        }
        if (ui.sel.has(id)) { ui.sel.delete(id); playSfx('card_select', 0.35, 0.72); }
        else if (ui.sel.size >= CFG.maxPlay) { toast('Chỉ chọn được tối đa 5 quân'); break; }
        else { ui.sel.add(id); playSfx('card_select', 0.55); }
        refreshSel(); break;
      }
      case 'use-cons': {
        if (run.phase !== 'playing') break;
        const uid = +t.dataset.uid;
        if (!run.consumables.find((c) => c.uid === uid)) break;
        if (ui.selCons === uid) { ui.selCons = null; ui.consDetail = null; render(); break; }
        ui.consDetail = uid; render();
        break;
      }
      case 'confirm-use-cons': {
        if (run.phase !== 'playing') break;
        const uid = +t.dataset.uid;
        const cons = run.consumables.find((c) => c.uid === uid);
        if (!cons) { ui.consDetail = null; render(); break; }
        const def = CDATA.find((x) => x.id === cons.id);
        ui.consDetail = null;
        if (def.target === 'card_hand') {
          ui.selCons = uid; render();
          toast(`${def.vi}: chọn 1 quân trên tay`);
        } else {
          try {
            const cr = run.useConsumable(uid, []);
            playSfx('card_flip', 0.6, 1.1);
            if (cr.money) toast(`${def.vi}: +${cr.money} đồng`);
            else if (cr.hand) { toast(`${def.vi}: ${H[cr.hand].vi} lên 1 cấp`); showLevelUp([cr.hand]); }
            else if (cr.restored) toast(`${def.vi}: bùa vô hiệu hoạt động lại`);
            else if (cr.mult) toast(`${def.vi}: +${cr.mult} hệ số lần đánh tới`);
            else if (cr.redrawn != null) toast(`${def.vi}: rút lại ${cr.redrawn} quân`);
            else toast(`Đã dùng ${def.vi}`);
          } catch (err) { toast(err.message); }
          ui.selCons = null; render();
        }
        break;
      }
      case 'play': doPlay(); break;
      case 'discard': doDiscard(); break;
      case 'info': playSfx('card_select', 0.18, 1.2); ui.info = true; render(); break;
      case 'items': playSfx('card_select', 0.18, 1.2); ui.items = true; render(); break;
      case 'close': case 'close-bg': {
        const ov = $('.overlay'); if (ov && ov.classList.contains('leaving')) break;
        const fin = () => { ui.info = false; ui.items = false; ui.settings = false; ui.confirmClear = false; ui.detail = null; ui.consDetail = null; ui.deckView = false; ui.selCons = null; render(); };
        playSfx('card_select', 0.18, 1.3);
        if (ov && !NOFX()) { ov.classList.add('leaving'); setTimeout(fin, 190); } else fin();
        break;
      }
      case 'charm': playSfx('card_select', 0.15, 1.25); ui.detail = +t.dataset.uid; render(); break;
      case 'sell': { run.sell(ui.detail); ui.detail = null; playSfx('buy', 0.6, 0.78); render(); break; }
      case 'move-l': case 'move-r': {
        const i = run.charms.findIndex((c) => c.uid === ui.detail);
        run.moveCharm(i, act === 'move-l' ? i - 1 : i + 1); render(); break;
      }
      case 'cash-next': playSfx('buy', 0.5); ui.view = run.phase === 'than' ? 'than' : 'shop'; ui.thanPick = null; render(); if (ui.view === 'shop') setTimeout(startShopTutorial, 80); break;
      case 'than-pick': {
        const id = t.dataset.id;
        if (run.usedSlots() >= run.slots) { ui.thanPick = id; render(); break; }
        run.pickThan(id); ui.view = 'shop'; playSfx('card_flip', 0.7, 1.15); render(); break;
      }
      case 'than-replace': run.pickThan(ui.thanPick, +t.dataset.uid); ui.thanPick = null; ui.view = 'shop'; playSfx('card_flip', 0.7, 1.15); render(); break;
      case 'than-cancel': ui.thanPick = null; render(); break;
      case 'than-skip': run.skipThan(); ui.view = 'shop'; render(); break;
      case 'buy': {
        const offer = run.shop.offers.find((x) => x.uid === +t.dataset.uid);
        const res = run.buy(+t.dataset.uid);
        if (res.ok) {
          if (ui.achRun) ui.achRun.noBuy = false;
          coin();
          if (res.pack) { ui.view = 'pack'; ui.packPick = null; render(); whoosh(); blip(440, 0.18, 'triangle', 0.07); break; }
          if (res.phu) {
            toast(`Đã mua ${PHU[res.phu].vi}`); coin(); burst(innerWidth / 2, innerHeight / 2, 18);
            if (run.vouchers.length >= Object.keys(PHU).length) unlockAch('ach_all_phu');
          } else if (res.cons) {
            const cdef = CDATA.find((x) => x.id === res.cons);
            toast(`Nhận ${cdef ? cdef.vi : res.cons}`); coin();
          } else if (offer && offer.kind === 'charm') {
            ui.justBought = run.charms[run.charms.length - 1].uid;
            trackCharmOwned(offer.id);
          } else if (offer && offer.kind === 'que') { render(); showLevelUp([offer.hand]); break; }
        }
        else toast(res.reason === 'money' ? 'Không đủ đồng' : res.reason === 'full' ? 'Hết ô bùa: hãy bán bớt một bùa ở phần "Bùa của bạn"' : 'Món này không còn');
        render(); break;
      }
      case 'reroll': { const res = run.reroll(); if (!res.ok) toast('Không đủ đồng'); else playSfx('shuffle', 0.55); render(); break; }
      case 'leave-shop': if (ui.achRun) { ui.achRun.discardUsedThisAi = false; ui.achRun.sweepTypes = new Set(); } run.leaveShop(); if (ui.sortMode) run.sortHand(ui.sortMode); ui.view = 'play'; ui.intro = true; ui.known = new Set(); ui.sel.clear(); render(); break;
      case 'pack-pick': {
        const i = +t.dataset.i; const c = run.pack.choices[i];
        if (c.kind === 'charm' && c.variant !== 'ran' && run.usedSlots() >= run.slots) { ui.packPick = i; render(); break; }
        run.pickPack(i); afterPack();
        if (c.kind === 'charm') { ui.justBought = run.charms[run.charms.length - 1].uid; trackCharmOwned(c.id); playSfx('card_flip', 0.7, 1.15); render(); }
        else if (c.kind === 'card') { playSfx('pack_take', 0.7); render(); toast(`Đã thêm ${cardName(c)} ${HO_VI[c.color]} vào bộ bài`); }
        else { render(); showLevelUp([c.hand]); }
        break;
      }
      case 'pack-replace': { const _pr = run.pack.choices[ui.packPick]; run.pickPack(ui.packPick, +t.dataset.uid); afterPack(); ui.justBought = run.charms[run.charms.length - 1].uid; if (_pr) trackCharmOwned(_pr.id); playSfx('card_flip', 0.7, 1.15); render(); break; }
      case 'pack-cancel': ui.packPick = null; render(); break;
      case 'pack-skip': run.pickPack(null); afterPack(); render(); break;
      case 'deck': playSfx('card_select', 0.18, 1.2); ui.deckView = true; render(); break;
      case 'sort': sweep(380, 720, 0.14, 'triangle', 0.055); ui.sortMode = t.dataset.mode; run.sortHand(ui.sortMode); render(); break;
      case 'skip': {
        const res = run.skipAi(); ui.known = new Set(); ui.sel.clear();
        if (res.tag === 'que') { ui.intro = false; ui.view = 'skip'; render(); break; }
        if (res.tag === 'goi') { ui.intro = false; ui.view = 'pack'; ui.packPick = null; render(); playSfx('pack_open', 0.8) || whoosh(); break; }
        ui.intro = true; ui.view = 'play'; ui.justBought = null;
        if (res.charmId) { ui.justBought = run.charms[run.charms.length - 1].uid; playSfx('card_flip', 0.7, 1.15); }
        else playSfx('buy', 0.6);
        render();
        toast(skipToast(res));
        if (res.tag === 'cap') showLevelUp([res.hand], res.levels);
        break;
      }
      case 'skip-pick': { run.pickSkip(t.dataset.hand); if (ui.sortMode) run.sortHand(ui.sortMode); ui.view = 'play'; ui.intro = true; ui.known = new Set(); ui.sel.clear(); render(); showLevelUp([t.dataset.hand]); break; }
      case 'buy-an': {
        const o = run.shop.offers.find((x) => x.uid === +t.dataset.uid);
        if (!o) break;
        if (run.money < o.price) { toast('Không đủ đồng'); break; }
        ui.picker = { offerUid: o.uid, anId: o.id, price: o.price, sel: new Set() }; render(); break;
      }
      case 'pick': {
        // không vẽ lại cả màn (gây nháy): chỉ đổi lớp của lá, số đã chọn và nút xác nhận
        const id = t.dataset.id; const max = AN[ui.picker.anId].max;
        if (ui.picker.sel.has(id)) ui.picker.sel.delete(id);
        else if (ui.picker.sel.size >= max) { if (max === 1) { ui.picker.sel.clear(); ui.picker.sel.add(id); } else { toast(`Chỉ chọn tối đa ${max} quân`); break; } }
        else ui.picker.sel.add(id);
        $$('.deckgrid .card').forEach((el) => el.classList.toggle('picked', ui.picker.sel.has(el.dataset.id)));
        const p = $('.sheet p'); if (p) p.innerHTML = p.innerHTML.replace(/Đã chọn \d+\/\d+/, `Đã chọn ${ui.picker.sel.size}/${max}`);
        const ok = $('[data-act="pick-ok"]'); if (ok) ok.disabled = !ui.picker.sel.size;
        break;
      }
      case 'pick-cancel': ui.picker = null; render(); break;
      case 'pick-ok': {
        try { run.buy(ui.picker.offerUid, [...ui.picker.sel]); coin(); ui.picker = null; } catch (err) { toast(err.message); }
        render(); break;
      }
      default: break;
    }
  }
  root.addEventListener('click', onClick);
  root.addEventListener('animationend', (e) => { if (e.target === root) root.classList.remove('shake', 'enter'); else if (e.target.classList && e.target.classList.contains('new')) e.target.classList.remove('new'); });

  // ------------------------------------------------------------------ lưu và nạp ván (tự lưu sau mỗi lần vẽ lại, chỉ khi không đang chạy hoạt ảnh)
  let saveTimer = 0;
  function saveRun() {
    if (FAST || !run || ui.busy || ui.view === 'title' || ui.view === 'end' || run.phase === 'lost' || run.phase === 'won') return;
    store.set('save', { v: 1, t: Date.now(), run: run.snapshot(), ui: { view: ui.view, intro: ui.intro, difficulty: ui.difficulty, deck: ui.deck, sortMode: ui.sortMode, playCount: ui.playCount, cashout: ui.cashout } });
  }
  const queueSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveRun, 250); };
  const clearSave = () => { clearTimeout(saveTimer); store.set('save', null); };
  function savedGame() { const s = store.get('save', null); return s && s.v === 1 && s.run && s.run.state ? s : null; }
  function continueHTML() {
    const s = savedGame(); if (!s) return '';
    const st = s.run.state; const kind = CFG.aiKinds[st.aiIdx];
    return `<button class="btn play big" data-act="continue" type="button">${gicon('tiep_tuc')}<span class="bl">Tiếp tục<small>Chặng ${st.chang}/${CFG.changCount} · ${CFG.aiNames[kind]} · ${st.money} đồng</small></span></button>`;
  }
  function loadRun() {
    const s = savedGame(); if (!s) return false;
    try {
      run = Run.restore(s.run);
      Object.assign(ui, { difficulty: s.ui.difficulty || ui.difficulty, deck: s.ui.deck || ui.deck, sortMode: s.ui.sortMode || null, playCount: s.ui.playCount || {}, cashout: s.ui.cashout || null, view: s.ui.view, intro: !!s.ui.intro });
      const want = { playing: 'play', shop: 'shop', than: 'than', pack: 'pack', skip: 'skip' }[run.phase];
      if (!want) throw new Error('trạng thái không nạp được: ' + run.phase);
      if (ui.view === 'cashout' ? !ui.cashout : ui.view !== want) { ui.view = want; ui.intro = want === 'play'; }
      Object.assign(ui, { sel: new Set(), known: new Set(), stage: null, detail: null, info: false, items: false, deckView: false, picker: null, packPick: null, thanPick: null, busy: false, justBought: null, lastMoney: null, prevView: null });
      render(); toast('Đã nạp ván đang chơi');
      return true;
    } catch (err) { console.error(err); clearSave(); run = null; ui.view = 'title'; render(); toast('Không nạp được ván đã lưu'); return false; }
  }
  window.addEventListener('pagehide', saveRun);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveRun(); });

  // ------------------------------------------------------------------ chế độ Dev: bảng công cụ thử game, ẩn hiện được (Ctrl+Shift+D, hoặc ?dev trên địa chỉ)
  let gearEl = null;
  function updateGear() {
    const show = !!run && ui.view !== 'title';
    if (!show) { if (gearEl) { gearEl.remove(); gearEl = null; } return; }
    if (gearEl) gearEl.style.display = document.querySelector('.overlay') ? 'none' : '';
    if (!gearEl) {
      gearEl = document.createElement('button'); gearEl.type = 'button'; gearEl.className = 'gear'; gearEl.title = 'Cài đặt'; gearEl.setAttribute('aria-label', 'Cài đặt');
      gearEl.innerHTML = '<img class="px" src="assets/icons/cai_dat.png" alt="" draggable="false">';
      gearEl.addEventListener('click', () => { unlockAudio(); ui.settings = true; ui.info = false; render(); });
      document.body.appendChild(gearEl);
    }
    gearEl.style.display = document.querySelector('.overlay') ? 'none' : '';
  }
  let devEl = null;
  function devHTML() {
    const inRun = !!run; const playing = inRun && run.phase === 'playing' && ui.view === 'play' && !ui.intro && !ui.busy;
    const d = (ok) => (ok ? '' : ' disabled');
    const charmOpts = Object.entries(CH).map(([id, c]) => `<option value="${id}"${ui.devCharm === id ? ' selected' : ''}>${c.vi}</option>`).join('');
    const changOpts = Array.from({ length: CFG.changCount }, (_, i) => `<option value="${i + 1}"${+ui.devChang === i + 1 ? ' selected' : ''}>Chặng ${i + 1}</option>`).join('');
    return `<div class="dev-head"><b>DEV</b><span><button data-dev="fold" type="button" title="Thu gọn">–</button><button data-dev="off" type="button" title="Tắt chế độ Dev">×</button></span></div>
      <label class="dev-chk"><input type="checkbox" data-dev="unlock" ${settings.devUnlock ? 'checked' : ''}> Mở khóa mọi độ khó và bộ bài</label>
      <div class="dev-grid">
        <button data-dev="money" type="button"${d(inRun)}>+100 đồng</button><button data-dev="hand" type="button"${d(playing)}>+1 lượt đánh</button>
        <button data-dev="disc" type="button"${d(playing)}>+1 lượt bỏ</button><button data-dev="clear" type="button"${d(playing)}>Qua ải ngay</button>
        <button data-dev="unlockhands" type="button"${d(inRun)}>Mở mọi bộ bài</button><button data-dev="levelall" type="button"${d(inRun)}>Lên cấp mọi bộ</button>
      </div>
      <div class="dev-row"><select data-dev-sel="charm"${d(inRun)}>${charmOpts}</select><button data-dev="addcharm" type="button"${d(inRun)}>Thêm bùa</button></div>
      <div class="dev-row"><select data-dev-sel="chang"${d(inRun)}>${changOpts}</select><button data-dev="jump" type="button"${d(inRun)}>Nhảy tới</button></div>
      <div class="dev-grid"><button data-dev="progall" type="button">Mở hết tiến trình</button><button data-dev="progreset" type="button">Đặt lại tiến trình</button></div>
      <small>Ván đang chơi: ${inRun ? `${CFG.decks[run.deckId].vi} · ${CFG.difficultyPresets[run.difficultyId].vi}` : 'chưa có'}</small>`;
  }
  function updateDev() {
    if (!settings.dev) { if (devEl) { devEl.remove(); devEl = null; document.body.classList.remove('dev-open'); fit(); } return; }
    if (!devEl) {
      devEl = document.createElement('div'); devEl.id = 'dev'; document.body.appendChild(devEl);
      devEl.addEventListener('click', onDevClick);
      devEl.addEventListener('change', (e) => {
        const s = e.target.dataset.devSel; if (s === 'charm') ui.devCharm = e.target.value; else if (s === 'chang') ui.devChang = e.target.value;
        else if (e.target.dataset.dev === 'unlock') { settings.devUnlock = e.target.checked; saveSettings(); sanitizeSel(); if (ui.view === 'title') render(); else updateDev(); }
      });
    }
    devEl.className = 'dev' + (settings.devOpen ? '' : ' folded');
    document.body.classList.toggle('dev-open', !!settings.devOpen); fit();
    devEl.innerHTML = settings.devOpen ? devHTML() : '<button class="dev-tab" data-dev="fold" type="button">DEV ▸</button>';
  }
  function onDevClick(e) {
    const t = e.target.closest('[data-dev]'); if (!t || t.tagName === 'INPUT') return;
    const k = t.dataset.dev;
    switch (k) {
      case 'fold': settings.devOpen = !settings.devOpen; saveSettings(); updateDev(); return;
      case 'off': settings.dev = false; saveSettings(); updateDev(); if (ui.settings || ui.view === 'title') render(); return;
      case 'money': run.money += 100; break;
      case 'hand': run.round.handsLeft++; break;
      case 'disc': run.round.discardsLeft++; break;
      case 'clear': if (run.round.hand.length) { ui.sel = new Set([run.round.hand[0].id]); run.round.score = run.round.target; doPlay(); } return;
      case 'unlockhands': for (const id of Object.keys(run.handLevels)) if (run.handLevels[id] === 0) run.handLevels[id] = 1; break;
      case 'levelall': for (const id of Object.keys(run.handLevels)) { if (run.handLevels[id] === 0) run.handLevels[id] = 1; run.levelUp(id); } break;
      case 'addcharm': { const id = ui.devCharm || Object.keys(CH)[0]; if (run.usedSlots() >= run.slots) run.slots = run.usedSlots() + 1; try { run._addCharm(id); } catch (err) { toast(err.message); } break; }
      case 'jump': { const n = +(ui.devChang || 1); run.chang = n; run.aiIdx = 0; run.startAi(); ui.view = 'play'; ui.intro = true; ui.sel.clear(); ui.known = new Set(); break; }
      case 'progall': progress.decks = DECK_ORDER.length; DECK_ORDER.forEach((id) => { progress.diff[id] = DIFF_ORDER.length; }); store.set('progress', progress); break;
      case 'progreset': progress.decks = 1; progress.diff = {}; store.set('progress', progress); sanitizeSel(); break;
      default: return;
    }
    render();
  }
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) { e.preventDefault(); settings.dev = !settings.dev; if (settings.dev) settings.devOpen = true; saveSettings(); updateDev(); if (ui.settings || ui.view === 'title') render(); }
  });

  // ------------------------------------------------------------------ cài đặt, mở đầu, hướng dẫn
  // ---- nhạc nền từ file MP3
  const music = { el: null, gain: null };
  const musicLevel = () => settings.musicVol / 100;
  function setMusicVol() {
    if (!music.el) return;
    if (music.gain) music.gain.gain.value = musicLevel();
    else try { music.el.volume = musicLevel(); } catch(e) {}
  }
  function musicStart() {
    if (!settings.musicOn) return;
    if (!music.el) {
      music.el = new Audio('assets/music/bgm.mp3');
      music.el.loop = true;
      if (actx) try {
        const src = actx.createMediaElementSource(music.el);
        music.gain = actx.createGain();
        src.connect(music.gain);
        music.gain.connect(actx.destination);
      } catch(e) {}
    }
    setMusicVol();
    music.el.play().catch(() => {});
  }
  function musicStop() {
    if (music.el) { music.el.pause(); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) musicStop(); else musicStart(); });
  document.addEventListener('pointerdown', unlockAudio);

  const saveSettings = () => store.set('settings', settings);
  function applySettings() {
    document.documentElement.classList.toggle('reduce', !!settings.reduce);
    ui.vol = Math.max(0, Math.min(100, settings.sfxVol)) / 100; ui.muted = false;
    setMusicVol();
    if (!settings.musicOn) musicStop(); else musicStart();
  }
  function settingsOverlay() {
    const chip = (act, id, on, lab) => `<button class="mini${on ? ' on' : ''}" data-act="${act}" data-id="${id}" type="button">${lab}</button>`;
    const onoff = (act, on) => `${chip(act, 1, on, 'Bật')}${chip(act, 0, !on, 'Tắt')}`;
    const slider = (id, v, off, label) => `<input id="${id}" type="range" min="0" max="100" step="5" value="${v}" aria-label="${label}" ${off ? 'disabled' : ''}><output id="${id}-v">${v}%</output>`;
    const clear = ui.confirmClear
      ? `<div class="srow danger"><div><b>Xóa toàn bộ dữ liệu?</b><span>Mất ván đang lưu, cài đặt và tiến trình hướng dẫn. Không hoàn tác được.</span></div><div class="chips"><button class="mini" data-act="clear-cancel" type="button">Hủy</button><button class="mini red" data-act="clear-do" type="button">Xóa hết</button></div></div>`
      : `<div class="srow"><div><b>Dữ liệu</b><span>Xóa ván đã lưu và cài đặt để chơi lại từ đầu</span></div><div class="chips"><button class="mini" data-act="clear-ask" type="button">Xóa dữ liệu</button></div></div>`;
    return `<div class="overlay" data-act="close-bg"><div class="panel sheet set" role="dialog" aria-label="Cài đặt"><h2>${gicon('cai_dat')}Cài đặt</h2>
      <div class="srow"><div><b>Nhạc nền</b><span>Nhạc Shop — Bà Hàng Mã</span></div><div class="sctl">${slider('set-mvol', settings.musicVol, false, 'Âm lượng nhạc nền')}</div></div>
      <div class="srow"><div><b>Hiệu ứng âm thanh</b><span>Tiếng chọn bài, ghi điểm, qua ải</span></div><div class="sctl">${slider('set-vol', settings.sfxVol, false, 'Âm lượng hiệu ứng')}</div></div>
      <div class="srow"><div><b>Giảm chuyển động</b><span>Tắt rung màn hình, hạt và hoạt ảnh dài; số điểm vẫn chạy</span></div><div class="chips">${onoff('set-reduce', settings.reduce)}</div></div>
      <div class="srow"><div><b>Bố cục</b><span>Tự theo màn hình, hoặc ép dọc hay ngang</span></div><div class="chips">${chip('set-layout', 'auto', settings.layout === 'auto', 'Tự động')}${chip('set-layout', 'port', settings.layout === 'port', 'Dọc')}${chip('set-layout', 'land', settings.layout === 'land', 'Ngang')}</div></div>
      ${A2HS ? '<div class="srow"><div><b>Lưu game ra màn hình chính</b><span>Hướng dẫn từng bước trên iPhone, iPad và Android</span></div><div class="chips"><button class="mini" data-act="ios-guide" type="button">Xem hướng dẫn</button></div></div>' : ''}
      <div class="srow"><div><b>Mở đầu và hướng dẫn</b><span>Xem lại câu chuyện, hoặc hướng dẫn trong ván</span></div><div class="chips"><button class="mini" data-act="replay-story" type="button">${gicon('cuon_giay')}Mở đầu</button><button class="mini" data-act="replay-tut" type="button">${gicon('den_long')}Hướng dẫn</button></div></div>
      ${clear}
      ${run && ui.view !== 'title' ? '<button class="btn discard" data-act="quit" type="button">Thoát ra sảnh<small>Ván được lưu, bấm Tiếp tục để chơi tiếp</small></button>' : ''}
      <button class="btn play" data-act="close" type="button">Đóng</button></div></div>`;
  }
  root.addEventListener('input', (e) => {
    const id = e.target.id; if (id !== 'set-vol' && id !== 'set-mvol') return;
    const v = +e.target.value; const out = $('#' + id + '-v'); if (out) out.textContent = v + '%';
    if (id === 'set-vol') { settings.sfxVol = v; ui.vol = v / 100; } else { settings.musicVol = v; setMusicVol(); }
  });
  root.addEventListener('change', (e) => { if (e.target.id === 'set-vol' || e.target.id === 'set-mvol') { saveSettings(); unlockAudio(); if (e.target.id === 'set-vol') { if (!playSfx('card_select', 0.7) && actx) blip(660, 0.08, 'triangle', 0.08); } } });
  function clearAllData() {
    clearTimeout(saveTimer); stopTutorial(false); closeStory(); musicStop();
    ['save', 'settings', 'storySeen', 'tutDone', 'tutForce', 'runsStarted', 'progress'].forEach((k) => store.set(k, null));
    progress.decks = 1; progress.diff = {};
    Object.assign(settings, { musicOn: true, musicVol: 30, sfxOn: true, sfxVol: 85, reduce: false, layout: 'auto', dev: false, devUnlock: true, devOpen: true }); ui.difficulty = DIFF_ORDER[0]; ui.deck = DECK_ORDER[0];
    run = null; ui.view = 'title'; ui.intro = false; ui.settings = false; ui.confirmClear = false; ui.sel.clear(); ui.busy = false;
    applySettings(); setLayout(); render(); toast('Đã xóa dữ liệu. Chơi lại từ đầu');
  }

  // Mở đầu: màn chạm để bắt đầu, rồi ba thẻ lời Phỗng (GDD mục 4). Chỉ tự hiện lần đầu.
  const STORY = [
    { bg: 1, text: 'Từ đợt sập nguồn, ký ức của cả dân làng bị nén hết vào 120 lá bài Tổ tôm. Gọi là hồn làng…' },
    { bg: 4, text: 'Server của đình làng vừa dính virus Nhà Cái. Nó bắt cóc hồn làng làm con tin, muốn chuộc thì phải đánh bài thắng nó. Hết bài, còn hồn…' },
    { bg: 8, text: 'Ta là Phỗng. Tượng đá canh đình làng. Ta chọn ngươi chơi cùng. Cố mà qua 8 chặng, đập 12 con bug với trùm cuối Hạn Bạt. Nhận bài đi!' },
  ];
  let storyEl = null;
  function closeStory() { if (storyEl) { storyEl.remove(); storyEl = null; document.removeEventListener('keydown', storyKey); } }
  function storyKey(e) {
    if (!storyEl) return;
    if (e.key === 'Escape') { e.preventDefault(); finishStory(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); storyEl.click(); }
  }
  function finishStory() { store.set('storySeen', true); closeStory(); }
  function showStory() {
    closeStory();
    let i = 0; let busy = false;
    const el = storyEl = document.createElement('div');
    el.className = 'story'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Mở đầu');
    document.body.appendChild(el); document.addEventListener('keydown', storyKey);
    const setBg = (n) => { el.style.setProperty('--bgp', `url(assets/bg/stage${n}_p.webp)`); el.style.setProperty('--bgl', `url(assets/bg/stage${n}_l.webp)`); };
    // Preload all background images so scene transitions are instant (no flash)
    [1, ...STORY.map(s => s.bg)].forEach(n => { new Image().src = `assets/bg/stage${n}_p.webp`; new Image().src = `assets/bg/stage${n}_l.webp`; });
    const draw = () => {
      if (i < 0) {
        setBg(1);
        el.innerHTML = `<button class="mini st-skip" data-st="skip" type="button">Bỏ qua</button><div class="st-splash"><img class="st-logo" src="assets/brand/logo.png" alt="PHỖNG.EXE, game xếp bài Tổ Tôm" draggable="false"><p class="st-tap">Chạm để bắt đầu</p></div>`;
        return;
      }
      const s = STORY[i];
      setBg(s.bg);
      el.innerHTML = `<button class="mini st-skip" data-st="skip" type="button">Bỏ qua mở đầu</button>
        <div class="st-box"><img class="st-face" src="assets/brand/app_icon.png" alt="" draggable="false"><div><b class="st-name">Phỗng</b><p class="st-text" aria-live="polite">${s.text}</p></div></div>
        <div class="st-foot"><span class="st-dots" aria-hidden="true">${STORY.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span><button class="btn play" data-st="next" type="button">${i === STORY.length - 1 ? 'Vào đình' : 'Tiếp'}</button></div>`;
    };
    const goNext = () => {
      if (busy) return;
      busy = true;
      unlockAudio(); blip(440 + (i + 1) * 110, 0.08, 'triangle', 0.06);
      el.classList.add('st-leaving');
      setTimeout(() => { i++; el.classList.remove('st-leaving'); draw(); busy = false; }, 220);
    };
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-st]');
      if (a && a.dataset.st === 'skip') { finishStory(); return; }
      if (i >= STORY.length - 1) { finishStory(); return; }
      goNext();
    });
    draw();
  }

  // Hướng dẫn trong ván: các thẻ chỉ vào từng vùng, không chặn thao tác. Hiện lần đầu vào ải; bật lại ở Cài đặt.
  const TUT = [
    { sel: '.target', text: 'Mục tiêu của ải: ghi đủ số điểm này trước khi hết lượt đánh.' },
    { sel: '#hand', text: 'Chạm quân bài để chọn, tối đa 5 quân. Chạm lại để bỏ chọn. Nhấn giữ để xem chú giải.' },
    { sel: '.calc', text: 'Điểm = chip (ô xanh) nhân hệ số (ô đỏ). Bộ càng hiếm càng mạnh; xem đủ ở nút Bảng bộ.' },
    { sel: '#btnPlay', text: 'Chọn xong thì bấm Đánh. Chỉ quân thuộc bộ mới ghi điểm.' },
    { sel: '#btnDis', text: 'Quân xấu thì Bỏ bài để rút quân mới. Số lượt bỏ có hạn.' },
    { sel: '#charms', text: 'Bùa nằm ở hàng này. Mua ở chợ sau mỗi ải; bùa tính từ trái sang phải nên thứ tự là chiến thuật.' },
  ];
  let tutEl = null; let tutRaf = 0;
  function stopTutorial(done) {
    if (done) { store.set('tutDone', true); store.set('tutForce', false); }
    cancelAnimationFrame(tutRaf); if (tutEl) { tutEl.remove(); tutEl = null; }
  }
  function startShopTutorial() {
    if (!isHintMode() || store.get('shopTutDone') || ui.view !== 'shop') return;
    stopTutorial(false);
    const visible = (sel) => { const t = $(sel); if (!t) return null; const r = t.getBoundingClientRect(); return r.width > 4 && r.height > 4 ? t : null; };
    const shopSteps = [
      { sel: '.shop-sec', text: 'Chào mừng đến Chợ! Mua Bùa để tăng điểm, Quẻ/Ấn để nâng cấp bộ bài, Vật Phẩm để dùng trong ải.' },
      { sel: '.offers .offer', text: 'Chạm vào món để xem chi tiết. Giá tiền hiển thị trên nút mua. Dùng Làm mới để xáo chợ nếu không thấy gì phù hợp.' },
      { sel: '.charms-sec', text: 'Bùa đã mua xếp ở đây. Bùa tính từ trái sang phải – thứ tự là chiến thuật!' },
      { sel: 'button[data-act="leave-shop"]', text: 'Mua xong, nhấn đây để tiến vào ải kế tiếp. Chúc may mắn!' },
    ].filter((s) => visible(s.sel));
    if (!shopSteps.length) { store.set('shopTutDone', true); return; }
    let k = 0;
    const el = tutEl = document.createElement('div'); el.className = 'tut'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Hướng dẫn chợ');
    el.innerHTML = '<div class="tut-ring"></div><div class="tut-tip"><img class="tut-face" src="assets/brand/app_icon.png" alt=""><div class="tut-body"><p class="tut-text"></p><div class="tut-foot"><small class="tut-n"></small><span><button class="mini" data-tut="skip" type="button">Bỏ qua</button><button class="mini on" data-tut="next" type="button"></button></span></div></div></div>';
    document.body.appendChild(el);
    const ring = $('.tut-ring', el), tip = $('.tut-tip', el);
    const show = () => { $('.tut-text', el).textContent = shopSteps[k].text; $('.tut-n', el).textContent = `${k + 1}/${shopSteps.length}`; $('[data-tut=next]', el).textContent = k === shopSteps.length - 1 ? 'Xong' : 'Tiếp';
      // cuộn trang tới vùng đang được chỉ, kẻo ô hướng dẫn nằm ngoài màn hình và người chơi chỉ thấy nền tối
      const t = $(shopSteps[k].sel); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'center', inline: 'nearest', behavior: REDUCED || settings.reduce ? 'auto' : 'smooth' }); };
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-tut]'); if (!a) return;
      if (a.dataset.tut === 'skip' || k >= shopSteps.length - 1) { store.set('shopTutDone', true); stopTutorial(false); return; }
      k++; blip(520, 0.05, 'square', 0.03); show();
    });
    const place = () => {
      if (!tutEl) return;
      const t = $(shopSteps[k].sel);
      if (!t || ui.view !== 'shop') { stopTutorial(false); return; }
      const r = t.getBoundingClientRect(), pad = 5;
      ring.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
      const th = tip.offsetHeight, tw = tip.offsetWidth, vw = innerWidth, vh = innerHeight;
      let y = r.bottom + 14; if (y + th > vh - 8) y = r.top - th - 14; if (y < 8) y = Math.max(8, Math.min(vh - th - 8, r.top + 10));
      const x = Math.max(8, Math.min(vw - tw - 8, r.left + r.width / 2 - tw / 2));
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
      tutRaf = requestAnimationFrame(place);
    };
    show(); place();
  }
  function startTutorial() {
    stopTutorial(false);
    const visible = (sel) => { const t = $(sel); if (!t) return null; const r = t.getBoundingClientRect(); return r.width > 4 && r.height > 4 ? t : null; };

    // Kịch bản ván đầu: chỉ vào bộ bài cụ thể trên tay để người mới biết cách ghép
    const extraSteps = [];
    if (store.get('runsStarted', 0) <= 1 && run && run.round && run.round.hand.length) {
      const hand = run.round.hand;
      const byRank = {};
      for (const c of hand) if (c.rank !== 'junk') (byRank[c.rank] = byRank[c.rank] || []).push(c);
      let pairRank = null; let isSamePair = false;
      // Ưu tiên pair_same (cùng họ) hơn pair_mixed để demo bộ mạnh hơn
      for (const [rank, cs] of Object.entries(byRank)) {
        if (cs.length >= 2) {
          const byCol = {};
          for (const c of cs) (byCol[c.color] = byCol[c.color] || []).push(c);
          if (Object.values(byCol).some((g) => g.length >= 2)) { pairRank = rank; isSamePair = true; break; }
          if (!pairRank) { pairRank = rank; isSamePair = false; }
        }
      }
      extraSteps.push({ sel: '#hand', text: 'Ván đầu tiên! Mỗi lượt chọn 2–5 lá rồi nhấn Đánh — trò chơi tự ghép bộ điểm cao nhất từ các lá bạn chọn.' });
      if (pairRank) {
        const pairName = isSamePair ? 'Đôi cùng họ (mạnh hơn)' : 'Đôi khác họ';
        extraSteps.push({ sel: '#hand', text: `Trên tay có 2 lá ${R[pairRank].vi} → ${pairName}! Chọn cả hai lá đó rồi nhấn Đánh để ghi điểm đầu tiên.` });
      }
    }

    const steps = [...extraSteps, ...TUT].filter((s) => visible(s.sel));
    if (!steps.length) return;
    let k = 0;
    const el = tutEl = document.createElement('div'); el.className = 'tut'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Hướng dẫn');
    el.innerHTML = '<div class="tut-ring"></div><div class="tut-tip"><img class="tut-face" src="assets/brand/app_icon.png" alt=""><div class="tut-body"><p class="tut-text"></p><div class="tut-foot"><small class="tut-n"></small><span><button class="mini" data-tut="skip" type="button">Bỏ qua</button><button class="mini on" data-tut="next" type="button"></button></span></div></div></div>';
    document.body.appendChild(el);
    const ring = $('.tut-ring', el), tip = $('.tut-tip', el);
    const show = () => { $('.tut-text', el).textContent = steps[k].text; $('.tut-n', el).textContent = `${k + 1}/${steps.length}`; $('[data-tut=next]', el).textContent = k === steps.length - 1 ? 'Xong' : 'Tiếp'; };
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-tut]'); if (!a) return;
      if (a.dataset.tut === 'skip' || k >= steps.length - 1) { stopTutorial(true); return; }
      k++; blip(520, 0.05, 'square', 0.03); show();
    });
    const place = () => {
      if (!tutEl) return;
      const t = $(steps[k].sel);
      if (!t || ui.view !== 'play' || ui.intro) { stopTutorial(false); return; }
      const r = t.getBoundingClientRect(), pad = 5;
      ring.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
      const th = tip.offsetHeight, tw = tip.offsetWidth, vw = innerWidth, vh = innerHeight;
      let y = r.bottom + 14; if (y + th > vh - 8) y = r.top - th - 14; if (y < 8) y = Math.max(8, Math.min(vh - th - 8, r.top + 10));
      const x = Math.max(8, Math.min(vw - tw - 8, r.left + r.width / 2 - tw / 2));
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
      tutRaf = requestAnimationFrame(place);
    };
    show(); place();
  }
  function maybeTutorial() { if (!FAST && !store.get('tutDone', false) && (store.get('runsStarted', 0) <= 1 || store.get('tutForce', false)) && ui.view === 'play' && !ui.intro) startTutorial(); }

  // chạm vào bất kỳ đâu: tắt các thông báo tạm (bảng bộ mạnh, thông báo ải, chú giải, tin nhắn)
  document.addEventListener('pointerdown', () => { $$('.fanfare, .fandim, .banner, .bandim, .lvup, .toast, .float').forEach((e) => e.remove()); hideTip(); }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    $$('.fanfare, .fandim, .banner, .bandim, .lvup, .toast').forEach((x) => x.remove()); hideTip();
    if (ui.info || ui.deckView || ui.items || ui.settings || ui.detail != null || ui.consDetail != null) { ui.info = false; ui.deckView = false; ui.items = false; ui.settings = false; ui.confirmClear = false; ui.detail = null; ui.consDetail = null; render(); }
  });

  // ------------------------------------------------------------------ hướng dẫn lưu game ra màn hình chính (chỉ trình duyệt di động: iOS và Android)
  const UA = navigator.userAgent;
  const IOS = /iphone|ipad|ipod/i.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ANDROID = /Android/i.test(UA);
  const PLATFORM = IOS ? 'ios' : ANDROID ? 'android' : null;
  const IS_APP = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  const A2HS = !!PLATFORM && !IS_APP; // máy tính hoặc đã mở từ biểu tượng ngoài màn hình chính: không hiện gì
  const INAPP = /FBAN|FBAV|Instagram|Zalo|Line\/|MicroMessenger|TikTok|Messenger|GSA\/|; wv\)/i.test(UA);
  const IOS_CHROME = /CriOS|EdgiOS|FxiOS/.test(UA);
  const ICO = {
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="8 7 12 3 16 7"/><path d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="5" y1="7" x2="19" y2="7"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="17" x2="19" y2="17"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2.3"/><circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="19" r="2.3"/></svg>',
    install: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 7v7"/><polyline points="9 11.5 12 14.5 15 11.5"/></svg>',
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  };
  let deferredInstall = null; // Android Chrome: cho phép cài bằng một chạm khi trình duyệt báo sẵn sàng
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if (igEl) showNativeInstall(); });
  window.addEventListener('appinstalled', () => { deferredInstall = null; const p = $('.ios-pill'); if (p) p.remove(); if (igEl) igEl.querySelector('[data-ig="close"]').click(); toast('Đã cài game. Hãy mở bằng biểu tượng mới!'); });
  function showNativeInstall() { const b = igEl && igEl.querySelector('.ig-native'); if (b) b.hidden = false; }

  function guideSteps() {
    if (PLATFORM === 'android') {
      return [
        ['Chạm nút ⋮ ở góc trên bên phải trình duyệt', `<div class="ig-mock"><div class="ig-bar"><em>cansa420.github.io</em><span class="ig-hl">${ICO.dots}</span></div><small>Ba chấm dọc <b>⋮</b>, cạnh thanh địa chỉ. Nút đang <b>sáng nhấp nháy</b></small></div>`],
        ['Chọn “Cài đặt ứng dụng”', `<div class="ig-mock"><div class="ig-menu"><div>Thẻ mới</div><div class="ig-hl row">${ICO.install}<b>Cài đặt ứng dụng</b></div><div class="ig-hl alt row">${ICO.add}<b>Thêm vào Màn hình chính</b></div><div>Chia sẻ…</div></div><small>Thấy dòng nào trong hai dòng sáng thì chọn dòng đó</small></div>`],
        ['Chạm “Cài đặt” (hoặc “Thêm”)', `<div class="ig-mock"><div class="ig-dlg"><b>Cài đặt ứng dụng?</b><span>PHỖNG.EXE</span><div class="ig-btns"><i>Hủy</i><i class="ig-hl">Cài đặt</i></div></div><small>Nếu hiện “Thêm vào Màn hình chính”, chạm <b>Thêm</b></small></div>`],
      ];
    }
    return [
      [IOS_CHROME ? 'Chạm nút Chia sẻ ở thanh địa chỉ' : 'Chạm nút ≡ ở thanh địa chỉ phía dưới', `<div class="ig-mock"><div class="ig-bar"><span class="ig-hl">${ICO.menu}</span><em>cansa420.github.io</em><span class="ig-hl alt">${ICO.share}</span></div><small>Thanh địa chỉ ở <b>dưới cùng</b> màn hình. Chạm nút sáng nhấp nháy (≡ hoặc ⬆)</small></div>`],
      ['Chọn “Chia sẻ”', `<div class="ig-mock"><div class="ig-menu"><div>Dịch trang web…</div><div class="ig-hl row">${ICO.share}<b>Chia sẻ</b></div><div>Thêm vào Dấu trang</div></div></div>`],
      ['Chọn “Thêm vào Màn hình chính”', `<div class="ig-mock"><div class="ig-menu"><div>Thêm vào Mục ưa thích</div><div>Tìm trên trang</div><div class="ig-hl row">${ICO.add}<b>Thêm vào Màn hình chính</b></div></div><small>Không thấy? <b>Vuốt lên</b> để cuộn danh sách xuống</small></div>`],
      ['Chạm “Thêm” để hoàn tất', `<div class="ig-mock"><div class="ig-top"><span>Hủy</span><b>Thêm vào MH chính</b><span class="ig-hl">Thêm</span></div><small>Nút <b>Thêm</b> ở góc trên bên phải</small></div>`],
    ];
  }
  function guideHTML() {
    const step = (n, [title, mock]) => `<li class="ig-step"><i class="ig-n">${n + 1}</i><div><b>${title}</b>${mock}</div></li>`;
    const browser = PLATFORM === 'android' ? 'Chrome' : 'Safari';
    const warn = INAPP ? `<div class="ig-warn"><b>Bạn đang mở trong ứng dụng khác (Zalo, Facebook…)</b>Hãy mở link này bằng <b>${browser}</b> trước: nhấn <b>⋯</b> (hoặc <b>⋮</b>) ở góc rồi chọn <b>Mở bằng trình duyệt</b>.<button class="ig-copy" type="button">Sao chép link game</button></div>` : '';
    const native = PLATFORM === 'android' ? `<button class="ig-native" type="button" hidden>${ICO.install}<span><b>Cài đặt ngay</b><small>Chỉ một chạm, không cần làm theo các bước</small></span></button>` : '';
    const alt = PLATFORM === 'android' ? `<div class="ig-alt"><b>Dùng trình duyệt khác?</b><span><b>Samsung Internet:</b> nút ≡ ở dưới cùng → <b>Thêm trang vào</b> → <b>Màn hình chính</b>.</span><span><b>Firefox:</b> nút ⋮ → <b>Cài đặt</b>.</span></div>` : '';
    return `<div class="ig-back" data-ig="close"></div><div class="ig-sheet" role="dialog" aria-label="Lưu game ra màn hình chính">
      <button class="ig-x" data-ig="close" type="button" aria-label="Đóng">✕</button>
      <div class="ig-head"><span class="ig-ico">${ICO.add}</span><div><h3>Lưu game ra màn hình chính</h3><p>Chơi toàn màn hình như một ứng dụng, mở nhanh bằng một chạm</p></div></div>
      ${warn}${native}<ol class="ig-steps">${guideSteps().map((s, i) => step(i, s)).join('')}</ol>${alt}
      <div class="ig-done">Xong! Từ giờ hãy mở game bằng <b>biểu tượng mới trên màn hình chính</b>. Tiến trình ván chơi được giữ lại.</div>
      <button class="ig-ok" data-ig="close" type="button">Đã hiểu</button>
      ${PLATFORM === 'ios' ? '<div class="ig-arrow" aria-hidden="true">▼<small>Nút nằm ngay dưới đây</small></div>' : ''}
    </div>`;
  }
  let igEl = null;
  function openIosGuide() {
    if (igEl || !A2HS) return;
    igEl = document.createElement('div'); igEl.className = 'iosg'; igEl.innerHTML = guideHTML(); document.body.appendChild(igEl);
    const close = () => { if (!igEl) return; const e = igEl; igEl = null; e.classList.add('out'); setTimeout(() => e.remove(), 260); store.set('a2hsSeen2', true); const p = $('.ios-pill'); if (p) p.classList.remove('pulse'); };
    igEl.addEventListener('click', (e) => { if (e.target.closest('[data-ig="close"]')) close(); });
    const cp = igEl.querySelector('.ig-copy');
    if (cp) cp.addEventListener('click', () => { const url = location.href.split('#')[0]; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { cp.textContent = 'Đã sao chép! Dán vào ' + (PLATFORM === 'android' ? 'Chrome' : 'Safari'); }, () => { cp.textContent = 'Giữ vào thanh địa chỉ để sao chép'; }); });
    const nat = igEl.querySelector('.ig-native');
    if (nat) { if (deferredInstall) nat.hidden = false; nat.addEventListener('click', async () => { if (!deferredInstall) return; const d = deferredInstall; deferredInstall = null; try { d.prompt(); await d.userChoice; } catch (err) { /* người chơi hủy */ } nat.hidden = true; }); }
    if (!NOFX()) {
      const sh = igEl.querySelector('.ig-sheet'); const n = SPR.length - 1;
      sh.animate(SPR.map((x, i) => ({ offset: i / n, translate: `0 ${(60 * (1 - x)).toFixed(1)}%`, opacity: Math.min(1, x * 4) })), { duration: 600, easing: 'linear' });
      igEl.querySelectorAll('.ig-step').forEach((el, i) => el.animate(SPR.map((x, j) => ({ offset: j / n, translate: `0 ${(26 * (1 - x)).toFixed(1)}px`, opacity: Math.min(1, x * 4) })), { duration: 520, delay: 220 + i * 110, easing: 'linear', fill: 'backwards' }));
    }
  }
  // nút nổi ở đáy màn hình: luôn thấy cho tới khi người chơi tự ẩn đi
  (function installPill() {
    if (!A2HS) return;
    const seen = store.get('a2hsSeen2', false);
    const pill = document.createElement('button'); pill.type = 'button'; pill.className = 'ios-pill' + (seen ? '' : ' pulse');
    pill.innerHTML = `<span class="ios-pill-ico">${ICO.add}</span><span><b>Lưu game ra màn hình chính</b><small>Chạm để xem cách làm, chỉ ${PLATFORM === 'android' ? '3' : '4'} bước</small></span><i class="ios-pill-x" aria-label="Ẩn">✕</i>`;
    pill.addEventListener('click', (e) => { if (e.target.closest('.ios-pill-x')) { pill.remove(); store.set('a2hsPillHidden2', true); return; } openIosGuide(); });
    if (!store.get('a2hsPillHidden2', false)) document.body.appendChild(pill);
    if (!seen) (window.__whenBoot || ((f) => f()))(() => setTimeout(openIosGuide, FAST ? 10 : 1800));
  })();
  window.__openIosGuide = openIosGuide;

  // ------------------------------------------------------------------ khởi động
  applySettings();
  setLayout();
  window.addEventListener('resize', () => { setLayout(); fit(); });
  render();
  (function pressFx() {
    // :active không chạy trên iOS nếu không có touchstart; thêm lớp .pressed để cảm ứng cũng lún xuống rõ ràng
    document.addEventListener('touchstart', () => {}, { passive: true });
    let cur = null;
    const release = () => { if (!cur) return; const e = cur; cur = null; setTimeout(() => e.classList.remove('pressed'), 90); };
    document.addEventListener('pointerdown', (e) => { const b = e.target.closest && e.target.closest('button:not(:disabled), [data-act]'); if (!b || b.classList.contains('card') || b.classList.contains('overlay')) return; cur = b; b.classList.add('pressed'); }, { passive: true });
    ['pointerup', 'pointercancel', 'dragend'].forEach((ev) => document.addEventListener(ev, release, { passive: true }));
    window.addEventListener('blur', release);
  })();
  window.__bootTap = () => { try { unlockAudio(); } catch (e) { /* chưa có âm thanh */ } };
  if (!FAST) window.__whenBoot((() => { if (!store.get('storySeen', false)) showStory(); }));
  window.__tc = { get run() { return run; }, ui, render, music, get actx() { return actx; }, recordWin, progress, settings, fanfare, blindBanner }; window.__tcData = DATA;
})();
