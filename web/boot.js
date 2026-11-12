(function () {
  'use strict';
  // Màn tải đầu game: tranh nền ải 4 tách thành nhiều lớp (mạch sáng, màn hình, đèn LED, đèn lồng) để làm động,
  // logo rơi vào, xoè năm lá bài, thanh tiến độ tải thật (nạp trước ảnh), xong thì lật bài và chờ chạm để vào.
  const FAST = /[?&]fast/.test(location.search);
  const waiters = [];
  let finished = FAST;
  window.__whenBoot = (cb) => { if (finished) cb(); else waiters.push(cb); };
  if (FAST) return;

  const html = document.documentElement;
  const land = innerWidth / innerHeight > 1.05;

  const root = document.createElement('div');
  root.className = 'boot' + (land ? ' land' : ' port');
  root.setAttribute('role', 'status'); root.setAttribute('aria-label', 'Đang tải game');
  const scene = document.createElement('div'); scene.className = 'boot-scene';
  root.appendChild(scene);

  // ---- cảnh nền: tranh ải 4 (gian nhà gỗ đỏ, màn hình CRT) tách thành các lớp riêng để làm động
  const AR = land ? 1672 / 941 : 941 / 1672;
  const O = land ? 'l' : 'p';
  const L = (k) => `assets/bg/boot/s4_${O}_${k}.png`;
  const BASE = `assets/bg/stage4_${O}.webp`;
  root.style.setProperty('--ar', AR.toFixed(4));
  const rng = (function (s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(11);
  const stage = document.createElement('div'); stage.className = 'boot-bg';
  const img = (src, cls) => `<img class="${cls}" src="${src}" alt="" draggable="false">`;
  stage.innerHTML = img(BASE, 'b-base') + img(L('lamp'), 'b-lamp') + img(L('led'), 'b-led') + img(L('screen'), 'b-screen') + img(L('circuit'), 'b-circuit') + '<i class="b-roll"></i><i class="b-flick"></i>';
  scene.appendChild(stage);
  // tàn lửa / bụi sáng bay lên
  const flies = document.createElement('div'); flies.className = 'boot-flies';
  for (let i = 0; i < 28; i++) { const f = document.createElement('i'); f.style.cssText = `left:${(rng() * 100).toFixed(1)}%;top:${(40 + rng() * 60).toFixed(1)}%;--dx:${((rng() - 0.5) * 80).toFixed(0)}px;--dy:${(-60 - rng() * 160).toFixed(0)}px;--s:${(2 + rng() * 3).toFixed(1)}px;animation-duration:${(5 + rng() * 6).toFixed(1)}s,${(1.4 + rng() * 2).toFixed(1)}s;animation-delay:${(-rng() * 8).toFixed(1)}s,${(-rng() * 3).toFixed(1)}s`; flies.appendChild(f); }
  scene.appendChild(flies);

  // ---- giao diện phía trên cảnh: logo, năm lá bài, thanh tải, chữ chạm
  const shade = document.createElement('div'); shade.className = 'boot-shade'; root.appendChild(shade);
  const FACES = [['van', 'van_10', 'Chi Chi', 12, 'Văn', 'yeu'], ['sach', 'sach_5', 'Ngũ', 5, 'Sách', ''], ['wan', 'wan_9', 'Cửu', 9, 'Vạn', ''], ['van', 'van_3', 'Tam', 3, 'Văn', ''], ['sach', 'sach_8', 'Bát', 8, 'Sách', '']];
  const fan = FACES.map((f, i) => `<div class="bc" style="--i:${i};--o:${i - 2}"><div class="bc-in"><div class="bc-back"></div><div class="bc-front card ${f[0]}${f[5] ? ' yeu' : ''}"><i class="frame"></i><i class="glint"></i><div class="band"><span class="b1${f[2].length >= 6 ? ' long' : ''}">${f[2]}</span></div><div class="art"><img class="px" src="assets/cards/${f[1]}.png" alt="" draggable="false"></div><div class="foot"><span class="chipv num">${f[3]}</span><span class="b2">${f[4]}</span><i></i></div>${f[5] ? '<i class="yeu-mark">YÊU</i>' : ''}</div></div></div>`).join('');
  const ui = document.createElement('div'); ui.className = 'boot-ui';
  ui.innerHTML = `<div class="boot-logo-wrap"><img class="boot-logo" src="assets/brand/logo.png" alt="PHỖNG.EXE, game xếp bài Tổ Tôm" draggable="false"><i class="boot-sweep"></i></div>
    <div class="boot-fan">${fan}</div>
    <div class="boot-load"><div class="boot-bar"><i></i></div><p class="boot-pct">Đang tải <b>0%</b></p></div>
    <p class="boot-tap">Chạm để bắt đầu</p>`;
  root.appendChild(ui);
  document.body.appendChild(root);

  // ---- nạp trước dữ liệu thật
  const LIST = (window.__PRELOAD || []).slice();
  LIST.unshift(BASE, L('lamp'), L('led'), L('screen'), L('circuit'), 'assets/brand/logo.png', 'assets/brand/app_icon.png');
  let loaded = 0; const total = Math.max(1, LIST.length);
  const done = () => { loaded++; };
  LIST.forEach((src) => { const im = new Image(); im.onload = im.onerror = done; im.src = src; });
  const t0 = performance.now(); const MIN = 2900; const MAX = 12000;
  const bar = root.querySelector('.boot-bar i'); const pct = root.querySelector('.boot-pct b');
  let shown = 0; let ready = false; let leaving = false;
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  let fontsOk = false; fontsReady.then(() => { fontsOk = true; });
  function loop(now) {
    if (leaving) return;
    const el = now - t0;
    const real = Math.min(1, loaded / total);
    const target = Math.min(real, el / MIN);
    shown += (target - shown) * 0.12 + 0.002;
    if (shown > target) shown = target;
    bar.style.transform = `scaleX(${shown.toFixed(4)})`; pct.textContent = Math.round(shown * 100) + '%';
    if (!ready && ((real >= 1 && fontsOk && el >= MIN) || el >= MAX)) {
      ready = true; shown = 1; bar.style.transform = 'scaleX(1)'; pct.textContent = '100%'; root.classList.add('boot-ready');
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function leave() {
    if (!ready || leaving) return; leaving = true;
    try { if (window.__bootTap) window.__bootTap(); } catch (e) { /* bỏ qua */ }
    root.classList.add('boot-leave');
    const fast = html.classList.contains('reduce');
    setTimeout(() => { root.remove(); finished = true; waiters.splice(0).forEach((cb) => { try { cb(); } catch (e) { console.error(e); } }); }, fast ? 60 : 820);
  }
  root.addEventListener('pointerdown', leave);
  document.addEventListener('keydown', (e) => { if (!leaving && root.isConnected && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) { e.preventDefault(); leave(); } });
})();
