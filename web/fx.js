(function () {
  'use strict';
  // Hiệu ứng nền và chất liệu (giai đoạn 1): khói loang theo cảnh, đom đóm, bài nghiêng theo chuột kèm ánh bóng.
  // Nguyên tắc: chỉ vẽ bằng canvas và transform/opacity (chạy trên GPU), tự hạ chất lượng khi máy yếu,
  // tắt hẳn khi bật "Giảm chuyển động" hoặc chạy thử tự động (?fast).
  const FAST = /[?&]fast/.test(location.search);
  const html = document.documentElement;
  const reduced = () => FAST || html.classList.contains('reduce');
  const bg = document.querySelector('.bg');
  if (!bg) return;

  // ---- bảng màu theo cảnh: [tối, sáng] cho khói, màu đom đóm
  const PAL = {
    normal: { a: [14, 58, 54], b: [96, 208, 176], fly: [255, 226, 140], alpha: 0.42, rise: 0 },
    boss: { a: [88, 18, 18], b: [236, 84, 60], fly: [255, 150, 90], alpha: 0.5, rise: 1 },
    shop: { a: [86, 58, 10], b: [244, 196, 86], fly: [255, 214, 120], alpha: 0.42, rise: 0 },
    pack: { a: [38, 28, 100], b: [150, 128, 255], fly: [200, 180, 255], alpha: 0.46, rise: 0 },
  };
  const cur = JSON.parse(JSON.stringify(PAL.normal));
  const lerp = (a, b, k) => a + (b - a) * k;
  function mixPalette(target, k) {
    for (let i = 0; i < 3; i++) { cur.a[i] = lerp(cur.a[i], target.a[i], k); cur.b[i] = lerp(cur.b[i], target.b[i], k); cur.fly[i] = lerp(cur.fly[i], target.fly[i], k); }
    cur.alpha = lerp(cur.alpha, target.alpha, k); cur.rise = lerp(cur.rise, target.rise, k);
  }

  // ---- khói: tính ở độ phân giải thấp rồi để CSS phóng to (mịn, rẻ)
  const smoke = document.createElement('canvas'); smoke.className = 'bgfx bgsmoke';
  const fly = document.createElement('canvas'); fly.className = 'bgfx bgfly';
  const shade = bg.querySelector('.bgshade');
  bg.insertBefore(smoke, shade); bg.insertBefore(fly, shade);
  const sctx = smoke.getContext('2d'); const fctx = fly.getContext('2d');
  let SW = 0; let SH = 0; let img = null; let FW = 0; let FH = 0;
  let tier = 0; // 0 đầy đủ, 1 nhẹ, 2 chỉ đom đóm ít, 3 tắt
  const SCALE = [7, 10, 14, 14];
  function resize() {
    const w = innerWidth; const h = innerHeight;
    SW = Math.max(48, Math.round(w / SCALE[tier])); SH = Math.max(36, Math.round(h / SCALE[tier]));
    smoke.width = SW; smoke.height = SH; img = sctx.createImageData(SW, SH);
    FW = fly.width = Math.round(w); FH = fly.height = Math.round(h);
  }
  let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  resize();

  // sprite quầng sáng cho đom đóm
  const spr = document.createElement('canvas'); spr.width = spr.height = 48;
  (function () { const g = spr.getContext('2d'); const r = g.createRadialGradient(24, 24, 0, 24, 24, 24); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 48, 48); })();
  const tinted = document.createElement('canvas'); tinted.width = tinted.height = 48; const tctx = tinted.getContext('2d');
  let tintKey = '';
  function retint(c) {
    const key = c.map((v) => Math.round(v / 6)).join(',');
    if (key === tintKey) return; tintKey = key;
    tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, 48, 48); tctx.drawImage(spr, 0, 0);
    tctx.globalCompositeOperation = 'source-in'; tctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; tctx.fillRect(0, 0, 48, 48);
  }
  const N = 30; const P = [];
  for (let i = 0; i < N; i++) P.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 1.1, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.004, vy: 0.002 + Math.random() * 0.004 });

  function drawSmoke(t) {
    const d = img.data; const asp = SW / SH; const al = cur.alpha * 255;
    const ar = cur.a[0]; const ag = cur.a[1]; const ab = cur.a[2]; const br = cur.b[0] - ar; const bgc = cur.b[1] - ag; const bb = cur.b[2] - ab;
    let i = 0;
    for (let y = 0; y < SH; y++) {
      const Y = (y / SH) * 3;
      for (let x = 0; x < SW; x++) {
        const X = (x / SW) * 3 * asp;
        const wx = Math.sin(Y * 1.3 + t * 0.35) * 0.9; const wy = Math.cos(X * 1.1 - t * 0.3) * 0.9;
        const a = Math.sin((X + wx) * 1.7 + t * 0.2) + Math.sin((Y + wy) * 2.1 - t * 0.25) + 0.5 * Math.sin((X + wy) * 3.1 + (Y + wx) * 2.3 + t * 0.4);
        let v = (a + 2.5) / 5; v = v < 0 ? 0 : v > 1 ? 1 : v;
        d[i] = ar + br * v; d[i + 1] = ag + bgc * v; d[i + 2] = ab + bb * v; d[i + 3] = al * v * v;
        i += 4;
      }
    }
    sctx.putImageData(img, 0, 0);
  }
  function drawFly(t, dt) {
    fctx.clearRect(0, 0, FW, FH);
    retint(cur.fly);
    fctx.globalCompositeOperation = 'lighter';
    const n = tier === 0 ? N : tier === 1 ? 20 : 12;
    for (let i = 0; i < n; i++) {
      const p = P[i];
      p.x += (p.vx + Math.sin(t * p.sp + p.ph) * 0.0009) * dt * 60;
      p.y -= (p.vy * (0.5 + cur.rise * 2.2) * (p.s)) * dt * 60 * (cur.rise > 0.5 ? 1 : -0.35);
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); } if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
      if (p.x < -0.05) p.x = 1.05; if (p.x > 1.05) p.x = -0.05;
      const tw = 0.35 + 0.65 * Math.max(0, Math.sin(t * p.sp * 1.7 + p.ph));
      const sz = (10 + p.s * 14) * (FW < 700 ? 0.8 : 1);
      fctx.globalAlpha = tw * 0.9;
      fctx.drawImage(tinted, p.x * FW - sz / 2, p.y * FH - sz / 2, sz, sz);
    }
    fctx.globalAlpha = 1; fctx.globalCompositeOperation = 'source-over';
  }

  // ---- vòng lặp chính + đo hiệu năng
  const stats = { fps: 0, smokeMs: 0, flyMs: 0, tier: 0, frames: 0 };
  window.__fx = stats;
  let last = performance.now(); let frame = 0; let acc = 0; let accN = 0; let slow = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (document.hidden) return;
    const off = reduced() || tier >= 3;
    smoke.style.display = fly.style.display = off ? 'none' : '';
    if (off) return;
    const mood = PAL[document.body.dataset.mood] || PAL.normal;
    mixPalette(mood, Math.min(1, dt * 1.6));
    frame++;
    const t = now / 1000;
    const every = tier === 0 ? 2 : 3;
    if (tier < 2 && frame % every === 0) { const a = performance.now(); drawSmoke(t); stats.smokeMs = stats.smokeMs * 0.9 + (performance.now() - a) * 0.1; }
    const b = performance.now(); drawFly(t, dt); stats.flyMs = stats.flyMs * 0.9 + (performance.now() - b) * 0.1;
    // tự hạ chất lượng nếu khung hình trung bình quá chậm (trên ~28ms) trong khoảng 2 giây
    acc += dt; accN++; stats.frames++;
    if (acc >= 2) {
      stats.fps = accN / acc;
      slow = stats.fps < 36 ? slow + 1 : 0;
      if (slow >= 2 && tier < 3) { tier++; stats.tier = tier; slow = 0; resize(); }
      acc = 0; accN = 0;
    }
  }
  requestAnimationFrame(loop);

  // ---- bài nghiêng theo chuột (lò xo) + ánh bóng
  const MAXA = 9; const state = new Map(); let hovered = null; let running = false;
  const tiltable = (c) => c && (c.closest('#hand') || c.closest('#stage')) && !c.classList.contains('discarding');
  function ensure() { if (!running) { running = true; requestAnimationFrame(tick); } }
  function entry(el) { let s = state.get(el); if (!s) { s = { rx: 0, ry: 0, vx: 0, vy: 0, tx: 0, ty: 0, sc: 1, vs: 0, ts: 1 }; state.set(el, s); } return s; }
  function release(el) { const s = state.get(el); if (s) { s.tx = 0; s.ty = 0; s.ts = 1; } el.classList.remove('tilting'); }
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduced()) return;
    const c = e.target.closest && e.target.closest('.card');
    const ok = tiltable(c) ? c : null;
    if (ok !== hovered) { if (hovered) release(hovered); hovered = ok; if (hovered) hovered.classList.add('tilting'); }
    if (!hovered) return;
    const r = hovered.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5; const ny = (e.clientY - r.top) / r.height - 0.5;
    const s = entry(hovered); s.ty = nx * 2 * MAXA; s.tx = -ny * 2 * MAXA; s.ts = 1.07;
    hovered.style.setProperty('--gx', ((nx + 0.5) * 100).toFixed(0) + '%'); hovered.style.setProperty('--gy', ((ny + 0.5) * 100).toFixed(0) + '%');
    ensure();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (hovered) { release(hovered); hovered = null; ensure(); } });
  document.addEventListener('pointerdown', () => { if (hovered) { const s = entry(hovered); s.ts = 0.97; ensure(); } }, { passive: true });
  function tick() {
    let alive = false;
    for (const [el, s] of state) {
      if (!el.isConnected) { state.delete(el); continue; }
      s.vx += (s.tx - s.rx) * 0.2; s.vx *= 0.76; s.rx += s.vx;
      s.vy += (s.ty - s.ry) * 0.2; s.vy *= 0.76; s.ry += s.vy;
      s.vs += (s.ts - s.sc) * 0.22; s.vs *= 0.74; s.sc += s.vs;
      const ang = Math.hypot(s.rx, s.ry);
      const rest = ang < 0.05 && Math.abs(s.sc - 1) < 0.002 && Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vs) < 0.01 && s.tx === 0 && s.ty === 0;
      if (rest) { el.style.removeProperty('rotate'); el.style.removeProperty('scale'); state.delete(el); continue; }
      el.style.rotate = `${s.rx.toFixed(3)} ${s.ry.toFixed(3)} 0 ${ang.toFixed(2)}deg`;
      el.style.scale = s.sc.toFixed(3);
      alive = true;
    }
    if (alive || state.size) requestAnimationFrame(tick); else running = false;
  }
})();
