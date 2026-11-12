(function () {
  'use strict';
  // Màn tải đầu game: cảnh đình làng đêm vẽ bằng pixel art ngay trên canvas (nhiều lớp riêng để làm động),
  // logo rơi vào, xoè năm lá bài, thanh tiến độ tải thật (nạp trước ảnh), xong thì lật bài và chờ chạm để vào.
  const FAST = /[?&]fast/.test(location.search);
  const waiters = [];
  let finished = FAST;
  window.__whenBoot = (cb) => { if (finished) cb(); else waiters.push(cb); };
  if (FAST) return;

  const html = document.documentElement;
  const land = innerWidth / innerHeight > 1.05;
  const H = land ? 216 : 300;
  const W = Math.ceil((H * innerWidth) / innerHeight) + 2;
  const PX = innerHeight / H;

  const root = document.createElement('div');
  root.className = 'boot' + (land ? ' land' : ' port');
  root.setAttribute('role', 'status'); root.setAttribute('aria-label', 'Đang tải game');
  root.style.setProperty('--px', PX.toFixed(3) + 'px');
  const scene = document.createElement('div'); scene.className = 'boot-scene';
  root.appendChild(scene);

  // ---- tiện ích vẽ pixel
  const rng = (function (s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(11);
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const layer = (cls, w, h) => { const c = document.createElement('canvas'); c.width = w || W; c.height = h || H; c.className = 'bz ' + cls; scene.appendChild(c); return c; };
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const lerp = (a, b, k) => a + (b - a) * k;
  const Y0 = Math.round(H * 0.6); const GY = Math.round(H * 0.76); const CX = Math.round(W / 2);

  // trời: dải màu có rung hạt (dither) cho đúng chất pixel
  (function sky() {
    const c = layer('sky'); const g = c.getContext('2d');
    const stops = [[0, [6, 9, 28]], [0.4, [18, 32, 74]], [1, [52, 116, 124]]];
    const col = (t) => { let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++; const [t0, a] = stops[i]; const [t1, b] = stops[i + 1]; const k = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; };
    const N = 9;
    for (let y = 0; y < GY; y++) {
      const t = Math.min(1, y / Y0);
      const k = t * N; const base = Math.floor(k); const fr = k - base;
      for (let x = 0; x < W; x++) {
        const b = base + (fr > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? 1 : 0);
        const cc = col(Math.min(1, b / N));
        g.fillStyle = `rgb(${cc[0] | 0},${cc[1] | 0},${cc[2] | 0})`; g.fillRect(x, y, 1, 1);
      }
    }
  })();

  // sao: hai lớp nhấp nháy xen kẽ
  ['a', 'b'].forEach((k) => {
    const g = layer('stars ' + k).getContext('2d');
    for (let i = 0; i < Math.round(W * 0.28); i++) {
      const x = ri(0, W - 1); const y = ri(0, Math.round(Y0 * 0.8));
      g.fillStyle = rng() < 0.25 ? '#ffe9a8' : '#c9dcff'; g.fillRect(x, y, 1, 1);
      if (rng() < 0.18) { g.fillStyle = 'rgba(201,220,255,.5)'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    }
  });

  // trăng
  const MX = Math.round(W * (land ? 0.8 : 0.74)); const MY = Math.round(H * (land ? 0.2 : 0.17)); const MR = Math.round(H * 0.07);
  (function moon() {
    const g = layer('moon').getContext('2d');
    for (let y = -MR; y <= MR; y++) for (let x = -MR; x <= MR; x++) {
      const d = Math.hypot(x, y); if (d > MR) continue;
      let c = '#f6e8b8'; if (d > MR - 1.6) c = '#e8d49c'; if (x + y * 0.4 > MR * 0.35) c = '#d9c288';
      g.fillStyle = c; g.fillRect(MX + x, MY + y, 1, 1);
    }
    [[-0.3, -0.2, 2], [0.25, 0.25, 3], [-0.1, 0.45, 1], [0.35, -0.35, 1]].forEach(([a, b, r]) => { R(g, MX + a * MR, MY + b * MR, r, r, '#d1b878'); });
  })();
  const halo = document.createElement('div'); halo.className = 'boot-halo';
  halo.style.left = (MX / W * 100) + '%'; halo.style.top = (MY / H * 100) + '%'; halo.style.setProperty('--r', (MR * 7 * PX) + 'px');
  scene.appendChild(halo);

  // núi xa và gần
  const ridge = (cls, base, amp, col, rim, o) => {
    const g = layer(cls).getContext('2d');
    for (let x = 0; x < W; x++) {
      const y = Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * 0.04 + o)) - amp * 0.4 * Math.sin(x * 0.115 + o * 2.3) - amp * 0.15 * Math.sin(x * 0.31 + o));
      R(g, x, y, 1, GY - y, col); R(g, x, y, 1, 1, rim);
    }
  };
  ridge('far', Y0 - 2, H * 0.2, '#162d4a', '#2d5578', 1.2);
  ridge('near', Y0 + 3, H * 0.1, '#0f2036', '#1f3c5a', 4.1);

  // làng: nhà mái ngói, cửa sổ sáng nhấp nháy
  (function village() {
    const g = layer('village').getContext('2d');
    const lit = [layer('lit a').getContext('2d'), layer('lit b').getContext('2d'), layer('lit c').getContext('2d')];
    let x = Math.round(W * 0.04);
    while (x < W * 0.96) {
      const w = ri(11, 18); const h = ri(5, 8); const by = Y0 + 7;
      if (Math.abs(x + w / 2 - CX) < W * 0.1) { x += w + 4; continue; }
      R(g, x, by - h, w, h, '#0b1726');
      for (let r = 0; r < 4; r++) R(g, x - 2 + r, by - h - 4 + r, w + 4 - r * 2, 1, r === 3 ? '#1b1a2c' : '#13172a');
      R(g, x - 2, by - h - 1, w + 4, 1, '#26233a');
      const n = ri(1, 3);
      for (let i = 0; i < n; i++) { const wx = x + 2 + ri(0, Math.max(0, w - 5)); const wy = by - h + 2; const L = lit[ri(0, 2)]; R(L, wx, wy, 2, 2, '#ffd36b'); R(L, wx - 1, wy - 1, 4, 4, 'rgba(255,200,90,.25)'); }
      x += w + ri(3, 9);
    }
  })();

  // mặt nước ruộng
  (function water() {
    const g = layer('water').getContext('2d');
    for (let y = Y0 + 7; y < GY; y++) { const t = (y - Y0) / (GY - Y0); R(g, 0, y, W, 1, `rgb(${lerp(18, 8, t) | 0},${lerp(52, 24, t) | 0},${lerp(64, 34, t) | 0})`); }
    for (let i = 0; i < W * 0.5; i++) { const y = ri(Y0 + 8, GY - 1); const w = ri(4, 18); R(g, ri(0, W - w), y, w, 1, `rgba(120,200,210,${(0.12 + rng() * 0.2).toFixed(2)})`); }
    for (let y = Y0 + 8; y < GY; y += 2) R(g, MX + Math.round(Math.sin(y) * 2) - 1, y, 3, 1, 'rgba(255,230,160,.35)');
  })();

  // cổng đình
  const HW = Math.round(Math.min(W * 0.17, H * 0.27)); const PH = Math.round(H * 0.3);
  (function gate() {
    const g = layer('gate').getContext('2d');
    const base = GY + 2; const top = base - PH; const pw = Math.round(HW * 0.3);
    const stone = (x0, w) => {
      R(g, x0, top, w, PH, '#6f6150'); R(g, x0, top, 2, PH, '#9c8a68'); R(g, x0 + w - 2, top, 2, PH, '#3f352b');
      for (let y = top + 4; y < base; y += 5) { R(g, x0, y, w, 1, '#4a3f33'); const o = ri(1, w - 2); R(g, x0 + o, y - 4, 1, 4, '#4a3f33'); }
      for (let i = 0; i < w * 2; i++) R(g, x0 + ri(0, w - 1), top + ri(0, PH - 1), 1, 1, rng() < 0.5 ? '#43673f' : '#8d7c5b');
    };
    stone(CX - HW, pw); stone(CX + HW - pw, pw);
    // lòng cổng tối + vòm
    const ix0 = CX - HW + pw; const ix1 = CX + HW - pw; const rad = (ix1 - ix0) / 2;
    R(g, ix0, top + rad, ix1 - ix0, base - top - rad, '#0a1320');
    for (let x = ix0; x < ix1; x++) { const dx = x - CX + 0.5; const h = Math.sqrt(Math.max(0, rad * rad - dx * dx)); R(g, x, top + rad - h, 1, h + 1, '#0a1320'); }
    for (let x = ix0 - 2; x < ix1 + 2; x++) { const dx = x - CX + 0.5; const h = Math.sqrt(Math.max(0, (rad + 2) * (rad + 2) - dx * dx)); const y = Math.round(top + rad - h); R(g, x, y, 1, 2, '#8a7858'); }
    // mái ngói cong
    const rw = HW * 2 + 12; const rx = CX - rw / 2;
    for (let r = 0; r < 6; r++) { const inset = Math.max(0, 3 - r); R(g, rx + inset, top - 6 + r, rw - inset * 2, 1, r % 2 ? '#5a2f2a' : '#7a4538'); }
    R(g, rx - 3, top - 9, 6, 3, '#7a4538'); R(g, rx + rw - 3, top - 9, 6, 3, '#7a4538'); R(g, rx - 5, top - 11, 4, 2, '#a85d44'); R(g, rx + rw + 1, top - 11, 4, 2, '#a85d44');
    R(g, rx, top, rw, 2, '#2e1b19');
    R(g, CX - 5, top - 14, 10, 7, '#7a4538'); R(g, CX - 3, top - 17, 6, 3, '#a85d44'); R(g, CX - 1, top - 19, 2, 2, '#e2ad3c');
    for (let x = rx + 2; x < rx + rw - 2; x += 3) R(g, x, top - 5 + (x % 2), 1, 4, 'rgba(0,0,0,.25)');
  })();

  // sương mù trôi
  [['m1', 0.3, 0.55, 0.1], ['m2', 0.28, 0.72, 0.09]].forEach(([cls, hh, top, a]) => {
    const w = W * 2; const h = Math.round(H * hh); const c = layer('mist ' + cls, w, h); c.style.top = (top * 100) + '%'; c.style.height = (hh * 100) + '%';
    const g = c.getContext('2d');
    for (let i = 0; i < 16; i++) { const x = rng() * w; const y = h * (0.25 + rng() * 0.5); const r = h * (0.35 + rng() * 0.5); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(190,225,230,${a})`); gr.addColorStop(1, 'rgba(190,225,230,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  });

  // tre hai bên (đung đưa)
  const bamboo = (cls, x0, x1, n) => {
    const c = layer('bam ' + cls); const g = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      const x = Math.round(lerp(x0, x1, (i + rng() * 0.6) / n)); const w = ri(3, 5);
      R(g, x, 0, w, H, '#0c3a2c'); R(g, x, 0, 1, H, '#1f7050'); R(g, x + w - 1, 0, 1, H, '#06221a');
      for (let y = ri(6, 20); y < H; y += ri(14, 22)) { R(g, x - 1, y, w + 2, 2, '#0a2c22'); R(g, x - 1, y, w + 2, 1, '#2a8a5e'); }
      for (let b = 0; b < 7; b++) {
        const y = ri(0, Math.round(H * 0.6)); const dir = rng() < 0.5 ? -1 : 1; const len = ri(7, 13); const bx = x + (dir > 0 ? w : 0);
        for (let k = 0; k < len; k++) { const lx = bx + dir * k; const ly = y + (k >> 1); R(g, lx, ly, 1, 1, '#0e5a3a'); R(g, lx, ly + 1, 1, 1, k % 3 ? '#2b9a5c' : '#17703f'); if (k > 2 && k % 2) R(g, lx, ly + 2, 1, 1, '#0b4a30'); }
      }
    }
  };
  bamboo('l', -4, W * (land ? 0.13 : 0.2), land ? 4 : 3);
  bamboo('r', W * (land ? 0.87 : 0.8), W + 2, land ? 4 : 3);

  // đường đá + cỏ phía trước
  (function ground() {
    const g = layer('ground').getContext('2d');
    R(g, 0, GY, W, H - GY, '#0b1f19');
    for (let i = 0; i < W * (H - GY) * 0.06; i++) R(g, ri(0, W - 1), ri(GY, H - 1), 1, 1, rng() < 0.5 ? '#14382a' : '#0a1812');
    // bụi cỏ rậm dọc mép đất cho khỏi thành một đường thẳng
    for (let x = 0; x < W; x++) { const hh = ri(1, 4) + Math.round(2 * Math.sin(x * 0.2)); R(g, x, GY - hh, 1, hh + 1, '#0b2a20'); if (rng() < 0.35) R(g, x, GY - hh - 1, 1, 1, '#1b5a3c'); }
    const hw0 = W * 0.045; const hw1 = W * (land ? 0.2 : 0.36);
    let y = GY;
    while (y < H) {
      const t = (y - GY) / (H - GY); const rh = Math.max(2, Math.round(2 + t * 11)); const half = lerp(hw0, hw1, t);
      let x = CX - half; let alt = 0;
      while (x < CX + half) { const tw = Math.max(4, Math.round(rh * (1.8 + rng() * 1.3))); const w = Math.min(tw, CX + half - x); const c = ['#4b4a44', '#57554d', '#625f54', '#46453f'][ri(0, 3)]; R(g, x, y, w, rh, c); R(g, x, y, w, 1, 'rgba(255,255,255,.08)'); R(g, x, y + rh - 1, w, 1, 'rgba(0,0,0,.35)'); R(g, x + w - 1, y, 1, rh, 'rgba(0,0,0,.35)'); x += w; }
      alt ^= 1; y += rh;
    }
    for (let i = 0; i < W * 0.45; i++) { const x = ri(0, W - 1); const yy = ri(GY + 1, H - 3); const t = (yy - GY) / (H - GY); if (Math.abs(x - CX) < lerp(hw0, hw1, t)) continue; R(g, x, yy, 1, ri(2, 4), rng() < 0.5 ? '#1c5a3a' : '#2a7a4a'); }
  })();

  // đèn lồng treo hai bên cổng
  [-1, 1].forEach((s) => {
    const el = document.createElement('div'); el.className = 'boot-lamp'; el.style.left = ((CX + s * (HW + 3)) / W * 100) + '%'; el.style.top = ((GY - PH - 2) / H * 100) + '%'; el.style.animationDelay = (s > 0 ? '-1.3s' : '0s');
    const c = document.createElement('canvas'); c.width = 9; c.height = 17; const g = c.getContext('2d');
    R(g, 4, 0, 1, 4, '#3a2a1a'); R(g, 2, 4, 5, 2, '#6a2f20'); R(g, 1, 6, 7, 7, '#c8402b'); R(g, 2, 7, 5, 5, '#ffcf6a'); R(g, 3, 8, 3, 3, '#fff1b0'); R(g, 1, 6, 1, 7, '#e0654a'); R(g, 2, 13, 5, 2, '#6a2f20'); R(g, 4, 15, 1, 2, '#e2ad3c');
    const gl = document.createElement('i'); gl.className = 'lamp-glow';
    el.appendChild(gl); el.appendChild(c); scene.appendChild(el);
  });

  // đom đóm
  const flies = document.createElement('div'); flies.className = 'boot-flies';
  for (let i = 0; i < 26; i++) { const f = document.createElement('i'); f.style.cssText = `left:${(rng() * 100).toFixed(1)}%;top:${(45 + rng() * 50).toFixed(1)}%;--dx:${((rng() - 0.5) * 120).toFixed(0)}px;--dy:${(-20 - rng() * 90).toFixed(0)}px;animation-duration:${(5 + rng() * 6).toFixed(1)}s,${(1.4 + rng() * 2).toFixed(1)}s;animation-delay:${(-rng() * 8).toFixed(1)}s,${(-rng() * 3).toFixed(1)}s`; flies.appendChild(f); }
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
  const bgn = (location.search.match(/[?&]stage=(\d)/) || [])[1] || '1';
  LIST.unshift(`assets/bg/stage${bgn}_${land ? 'l' : 'p'}.webp`, 'assets/brand/logo.png', 'assets/brand/app_icon.png');
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
