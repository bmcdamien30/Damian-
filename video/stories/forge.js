// @headline Building <span>GarnettWork</span>
// @sources A 15-second foundry sequence: the gate opens, a crucible swings in and pours, "Building GarnettWork" is cast in molten gold and cools, and the camera dives into the top loop of the B. Lettering is Big Shoulders Display ExtraBold (SIL Open Font License), drawn as vector outlines. Everything, including the sound, is generated from code.
// @aspect 9 / 16
// @maxw 460px
// @asset glyphs assets/forge-glyphs.json
// @audio out/forge.m4a

PE.init(canvas, { width: 1080, height: 1920, fps: 30 });
PE.tooth = false; PE.boil = false; PE.shutter = 0.6;
const W = 1080, H = 1920, TAU = Math.PI * 2, GL = ASSETS.glyphs;
const { map, clamp, lerp, ease } = PE;
const sm = PE.smooth;
const DUR = 15;

// ---------- palette ----------
const FIRE = ['#fffbe8', '#fff0b0', '#ffd45a', '#ffad2a', '#ff7a12', '#e84a0c', '#a8260a', '#3c1a12'];
const SMOKE = ['#6a625c', '#4a4440'];

// ---------- key times ----------
const T = {
  crack: 0.35, open0: 1.0, open1: 2.8,
  swing: 2.4, tip0: 5.0, tipEnd: 6.6, lift0: 7.0, lift1: 7.9,
  cast0: 7.3, cool0: 9.05, gleam: 10.9, dive0: 12.0, dive1: 14.45,
};
const POOL_Y = 1560;
const PIVOT = [810, -560], CHAIN = 930;

// ---------- lettering ----------
const LINES = GL.lines.map((L, li) => {
  const x0 = (W - L.width) / 2, base = li === 0 ? 1000 : 1212;
  const path = new Path2D();
  const glyphs = L.glyphs.map((g, gi) => {
    const p = new Path2D(g.d); path.addPath(p);
    const bb = [g.bbox[0] + x0, g.bbox[1] + base, g.bbox[2] + x0, g.bbox[3] + base];
    return { ch: g.ch, p, bb, line: li, i: gi, cx: (bb[0] + bb[2]) / 2 };
  });
  return { ...L, x0, base, path, glyphs };
});
const ALL = LINES.flatMap((l) => l.glyphs);
ALL.forEach((g) => {
  g.f0 = T.cast0 + (g.cx / W) * 0.9 + (g.line === 0 ? 0.32 : 0);
  g.f1 = g.f0 + 0.5;
  g.c0 = T.cool0 + (g.cx / W) * 0.7 + (g.line === 0 ? 0.15 : 0);
  g.c1 = g.c0 + 1.35;
  g.heightPx = g.bb[3] - g.bb[1];
});
// the B's upper counter: the black hole the camera dives into
const BH = GL.bUpper, L0 = LINES[0];
const HOLE = { path: new Path2D(BH.d), cx: (BH.bbox[0] + BH.bbox[2]) / 2 + L0.x0, cy: (BH.bbox[1] + BH.bbox[3]) / 2 + L0.base };

// stems where molten drips can hang (scan just above each glyph's bottom edge)
const DRIPS = (() => {
  const probe = document.createElement('canvas').getContext('2d');
  const runsFor = (g, line) => {
    const y = g.bb[3] - line.base - 4, out = [];
    let start = null;
    for (let x = g.bb[0] - line.x0; x <= g.bb[2] - line.x0; x += 1.5) {
      const inside = probe.isPointInPath(g.p, x, y);
      if (inside && start === null) start = x;
      if (!inside && start !== null) { out.push([(start + x) / 2 + line.x0, x - start]); start = null; }
    }
    return out.filter((r) => r[1] > 10);
  };
  const want = [[1, 0, 0], [1, 2, 1], [1, 5, 0], [1, 7, 0], [1, 9, 0], [0, 0, 1], [0, 3, 0], [0, 5, 0], [0, 7, 0]];
  const r = PE.rng(9);
  return want.map(([li, gi, k], n) => {
    const line = LINES[li], g = line.glyphs[gi], runs = runsFor(g, line);
    const run = runs[Math.min(k, runs.length - 1)] || [g.cx, 20];
    return { x: run[0], y: g.bb[3] - 1, w: Math.min(16, run[1] * 0.45), t0: 9.05 + n * 0.17 + r() * 0.12, grow: 0.55 + r() * 0.35, len: 34 + r() * 40 };
  });
})();

// ---------- textures ----------
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
const SPR = {};
function sprite(col, hard = 0) {
  const k = col + hard; if (SPR[k]) return SPR[k];
  const [c, g] = mk(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, col); gr.addColorStop(hard, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  const rgb = col;
  void rgb;
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (SPR[k] = c);
}
const BRICKS = (() => {
  const [c, g] = mk(W, POOL_Y + 40), r = PE.rng(3);
  g.fillStyle = '#120e0c'; g.fillRect(0, 0, W, POOL_Y + 40);
  const bh = 64, bw = 150;
  for (let row = 0; row * bh < POOL_Y + 40; row++) {
    for (let x = -((row % 2) * bw) / 2; x < W; x += bw) {
      const v = 34 + r() * 22;
      g.fillStyle = `rgb(${v + 18},${v * 0.72},${v * 0.55})`;
      g.fillRect(x + 4, row * bh + 4, bw - 8, bh - 8);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 4, row * bh + bh - 14, bw - 8, 10);
      for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.2})`; g.fillRect(x + 4 + r() * (bw - 14), row * bh + 4 + r() * (bh - 12), 2 + r() * 6, 2 + r() * 4); }
    }
  }
  return c;
})();
const DOOR = (() => {
  const dw = 540, [c, g] = mk(dw, H), r = PE.rng(5);
  const gr = g.createLinearGradient(0, 0, dw, 0);
  gr.addColorStop(0, '#15120f'); gr.addColorStop(0.5, '#2a2420'); gr.addColorStop(1, '#1a1613');
  g.fillStyle = gr; g.fillRect(0, 0, dw, H);
  // rust and grime
  for (let i = 0; i < 2600; i++) {
    const x = r() * dw, y = r() * H, s = 1 + r() * r() * 9;
    g.fillStyle = r() < 0.5 ? `rgba(110,52,20,${0.08 + r() * 0.2})` : `rgba(0,0,0,${0.1 + r() * 0.25})`;
    g.fillRect(x, y, s, s * (0.5 + r()));
  }
  // plate seams
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 4;
  [480, 960, 1440].forEach((y) => { g.beginPath(); g.moveTo(0, y); g.lineTo(dw, y); g.stroke(); });
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2;
  [483, 963, 1443].forEach((y) => { g.beginPath(); g.moveTo(0, y); g.lineTo(dw, y); g.stroke(); });
  // straps with rivets
  [200, 760, 1180, 1720].forEach((y) => {
    const sg = g.createLinearGradient(0, y - 40, 0, y + 40);
    sg.addColorStop(0, '#3a322c'); sg.addColorStop(0.45, '#2a241f'); sg.addColorStop(1, '#0d0b0a');
    g.fillStyle = sg; g.fillRect(0, y - 40, dw, 80);
    for (let x = 30; x < dw; x += 70) {
      const rg = g.createRadialGradient(x - 4, y - 4, 1, x, y, 13);
      rg.addColorStop(0, '#6a5e54'); rg.addColorStop(0.5, '#2e2722'); rg.addColorStop(1, '#090807');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, 13, 0, TAU); g.fill();
    }
  });
  // vertical edge bar
  g.fillStyle = '#0e0c0a'; g.fillRect(dw - 36, 0, 36, H);
  return c;
})();

// ---------- particles (deterministic, born once, evaluated at time t) ----------
function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }
const POUR_T = (() => {
  // when the stream lands: computed from the spout height at pour start
  return { start: 5.42, stop: 6.75 };
})();
const FALL = 0.68;
const LAND_T = POUR_T.start + FALL;
const LAND_X = 548;
function mkFlames(n, seed, f) { const r = PE.rng(seed), out = []; for (let i = 0; i < n; i++) out.push(f(r, i)); return out; }
const WALL = mkFlames(640, 11, (r) => {
  const b = LAND_T + Math.pow(r(), 1.6) * 1.5;
  const spread = 220 + 440 * Math.min(1, (b - LAND_T) / 0.2);
  return { b, life: 0.5 + r() * 0.8, x: LAND_X + gauss(r) * spread, y: POOL_Y + 10, v: 900 + r() * 1100, buoy: 450, s: 90 + r() * 120, drift: gauss(r) * 70, ph: r() * 10 };
});
const LICKS = mkFlames(240, 12, (r) => ({ b: LAND_T + 0.4 + r() * 4.2, life: 0.4 + r() * 0.5, x: 90 + r() * 900, y: POOL_Y + 6, v: 160 + r() * 280, buoy: 200, s: 40 + r() * 50, drift: gauss(r) * 30, ph: r() * 10 }));
const LETTERF = mkFlames(300, 13, (r, i) => {
  const g = ALL[i % ALL.length];
  return { b: g.f0 - 0.05 + r() * 0.9, life: 0.35 + r() * 0.45, x: g.bb[0] + r() * (g.bb[2] - g.bb[0]), y: g.bb[3] - r() * 30, v: 120 + r() * 260, buoy: 260, s: 26 + r() * 40, drift: gauss(r) * 25, ph: r() * 10 };
});
const SPARKS = mkFlames(420, 14, (r, i) => {
  if (i < 160) { const a = -Math.PI / 2 + gauss(r) * 0.9; const sp = 500 + r() * 1100; return { b: LAND_T + r() * 0.5, life: 0.5 + r() * 0.7, x: LAND_X + gauss(r) * 40, y: POOL_Y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp }; }
  const g = ALL[i % ALL.length], a = -Math.PI / 2 + gauss(r) * 0.8, sp = 250 + r() * 600;
  return { b: g.f0 + r() * 0.7, life: 0.4 + r() * 0.6, x: g.bb[0] + r() * (g.bb[2] - g.bb[0]), y: g.bb[3] - r() * (g.bb[3] - g.bb[1]), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp };
});
const FURN = mkFlames(70, 17, (r) => ({ ph: r() * 3, life: 0.5 + r() * 0.5, x: 540 + gauss(r) * 150, v: 250 + r() * 300, s: 60 + r() * 70, drift: gauss(r) * 30 }));
const EMBERS = mkFlames(110, 15, (r) => ({ x: r() * W, ph: r(), sp: 60 + r() * 120, sz: 2 + r() * 4, sw: r() * 10 }));
const SMOKE_P = mkFlames(70, 16, (r) => { const g = ALL[Math.floor(r() * ALL.length)]; return { b: 9.3 + r() * 2.6, life: 1.6 + r() * 1.2, x: g.bb[0] + r() * (g.bb[2] - g.bb[0]), y: g.bb[1] + 10, v: 60 + r() * 90, s: 60 + r() * 80, drift: gauss(r) * 40 }; });

function drawFlames(c, list, t, gain = 1) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const p of list) {
    const a = t - p.b; if (a < 0 || a > p.life) continue;
    const u = a / p.life;
    const y = p.y - (p.v * a + 0.5 * p.buoy * a * a) * (1 - u * 0.35);
    const x = p.x + p.drift * a + Math.sin(p.ph + a * 9) * 12 * u;
    const s = p.s * (0.55 + u * 1.1) * (1 - u * u * 0.5);
    const ci = Math.min(FIRE.length - 1, Math.floor(u * 7.2));
    c.globalAlpha = gain * (1 - u) * (u < 0.08 ? u / 0.08 : 1) * 0.55;
    c.drawImage(sprite(FIRE[ci]), x - s / 2, y - s * 0.62, s, s * 1.25);
  }
  c.restore();
}
function drawSparks(c, t) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (const p of SPARKS) {
    const a = t - p.b; if (a < 0 || a > p.life) continue;
    const u = a / p.life, x = p.x + p.vx * a, y = p.y + p.vy * a + 900 * a * a, vy = p.vy + 1800 * a;
    c.strokeStyle = u < 0.5 ? '#fff2b8' : '#ffb347'; c.globalAlpha = 1 - u; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - p.vx * 0.022, y - vy * 0.022); c.stroke();
  }
  c.restore();
}
function drawEmbers(c, t, amt) {
  if (amt <= 0) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const e of EMBERS) {
    const y = H - ((t * e.sp + e.ph * H * 1.3) % (H * 1.3));
    const x = e.x + Math.sin(t * 1.3 + e.sw) * 30;
    c.globalAlpha = amt * (0.5 + 0.5 * Math.sin(t * 7 + e.sw));
    c.drawImage(sprite(FIRE[2], 0.25), x - e.sz * 2, y - e.sz * 2, e.sz * 4, e.sz * 4);
  }
  c.restore();
}
function glow(c, x, y, rx, ry, col, a) {
  if (a <= 0.003) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
  c.drawImage(sprite(col), x - rx, y - ry, rx * 2, ry * 2); c.restore();
}

// ---------- environment ----------
function heatAt(t) {
  // how strongly the furnace lights the room
  return clamp(map(t, 0.9, 2.2)) * (1 - 0.95 * sm(map(t, 9.6, 12.0)));
}
function interior(c, t) {
  const h = heatAt(t), flash = Math.exp(-Math.max(0, t - LAND_T) * 3.2) * (t > LAND_T ? 1 : 0);
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = 0.25 + 0.75 * h; c.drawImage(BRICKS, 0, 0); c.restore();
  // warm light falls off from the pit
  const lg = c.createRadialGradient(W / 2, POOL_Y, 50, W / 2, POOL_Y - 200, 1500);
  lg.addColorStop(0, `rgba(0,0,0,0)`); lg.addColorStop(0.55, 'rgba(0,0,0,0.55)'); lg.addColorStop(1, 'rgba(0,0,0,0.95)');
  c.fillStyle = lg; c.fillRect(0, 0, W, H);
  furnace(c, t, h);
  glow(c, W / 2, POOL_Y, 900, 700, FIRE[4], 0.45 * h + 0.5 * flash);
  glow(c, W / 2, POOL_Y + 60, 600, 260, FIRE[2], 0.35 * h);
  // floor and casting pit
  const fg = c.createLinearGradient(0, POOL_Y - 10, 0, H);
  fg.addColorStop(0, '#1d1714'); fg.addColorStop(1, '#070605');
  c.fillStyle = fg; c.fillRect(0, POOL_Y - 10, W, H - POOL_Y + 10);
  c.fillStyle = '#050403'; c.beginPath(); c.ellipse(W / 2, POOL_Y + 70, 500, 80, 0, 0, TAU); c.fill();
  // the pool of poured gold
  if (t > LAND_T) {
    const spread = ease.out(map(t, LAND_T, LAND_T + 0.9)), cool = sm(map(t, 9.4, 12.2));
    const rx = 60 + 440 * spread, ry = 20 + 58 * spread;
    const pg = c.createRadialGradient(LAND_X, POOL_Y + 60, 5, W / 2, POOL_Y + 70, rx);
    pg.addColorStop(0, cool > 0.5 ? '#6b3a10' : '#fff3c0'); pg.addColorStop(0.4, cool > 0.5 ? '#3a200c' : '#ffc23e'); pg.addColorStop(1, cool > 0.5 ? '#140b06' : '#c2410c');
    c.save(); c.globalAlpha = 1 - cool * 0.7;
    c.fillStyle = pg; c.beginPath(); c.ellipse(W / 2 + (LAND_X - W / 2) * (1 - spread), POOL_Y + 70, rx, ry, 0, 0, TAU); c.fill();
    // ripples
    c.strokeStyle = 'rgba(255,250,220,0.5)'; c.lineWidth = 3;
    for (let k = 0; k < 3; k++) {
      const rr = ((t * 140 + k * 120) % 420) + 30;
      if (rr < rx) { c.globalAlpha = (1 - rr / rx) * 0.5 * (1 - cool); c.beginPath(); c.ellipse(LAND_X, POOL_Y + 66, rr, rr * 0.16, 0, 0, TAU); c.stroke(); }
    }
    c.restore();
    glow(c, W / 2, POOL_Y + 60, rx * 1.4, 240, FIRE[3], 0.6 * (1 - cool));
  }
  // the room falls away into darkness before the dive
  const dark = sm(map(t, 11.3, 12.3));
  if (dark > 0) { c.save(); c.globalAlpha = dark; c.fillStyle = '#000'; c.fillRect(-W, -H, W * 3, H * 3); c.restore(); }
}
const ARCH = (() => {
  const p = new Path2D(), x = 540, w = 500, top = 1250;
  p.moveTo(x - w / 2, POOL_Y); p.lineTo(x - w / 2, top + 110); p.ellipse(x, top + 110, w / 2, 110, 0, Math.PI, 0); p.lineTo(x + w / 2, POOL_Y); p.closePath();
  return p;
})();
function furnace(c, t, h) {
  c.save();
  c.strokeStyle = '#0b0807'; c.lineWidth = 40; c.stroke(ARCH);
  c.fillStyle = '#1a0b05'; c.fill(ARCH);
  c.clip(ARCH);
  const fg = c.createRadialGradient(540, POOL_Y - 40, 20, 540, POOL_Y - 80, 420);
  fg.addColorStop(0, `rgba(255,240,190,${h})`); fg.addColorStop(0.35, `rgba(255,150,40,${h * 0.9})`); fg.addColorStop(1, `rgba(120,30,8,${h * 0.6})`);
  c.fillStyle = fg; c.fillRect(260, 1200, 560, 400);
  c.globalCompositeOperation = 'lighter';
  for (const p of FURN) {
    const a = (t + p.ph) % p.life, u = a / p.life, s = p.s * (0.6 + u);
    c.globalAlpha = h * (1 - u) * 0.6;
    c.drawImage(sprite(FIRE[Math.min(7, Math.floor(u * 6))]), p.x + p.drift * a - s / 2, POOL_Y - 20 - p.v * a - s / 2, s, s * 1.3);
  }
  c.restore();
  c.save(); c.strokeStyle = `rgba(255,150,60,${0.35 * h})`; c.lineWidth = 4; c.stroke(ARCH); c.restore();
}
function gate(c, t) {
  if (t > T.open1 + 0.3) return;
  const op = ease.inOut(map(t, T.open0, T.open1)), push = 1 + 0.55 * ease.in(map(t, T.open0 + 0.2, T.open1 + 0.3));
  const f = 1500, dw = 540, SL = 40;
  c.save();
  c.translate(W / 2, H / 2); c.scale(push, push); c.translate(-W / 2, -H / 2);
  // light through the crack before the doors move
  const crack = clamp(map(t, T.crack, T.open0 + 0.1));
  for (const side of [-1, 1]) {
    const phi = op * Math.PI * 0.52;
    let prev = null;
    for (let k = 0; k <= SL; k++) {
      const u = k / SL, xw = -dw + u * dw * Math.cos(phi), z = -u * dw * Math.sin(phi), s = f / (f + z);
      const sx = W / 2 + side * xw * s, hh = H * s;
      if (prev) {
        const [px, ph] = prev, x0 = Math.min(px, sx), w = Math.abs(sx - px) + 0.8;
        const srcX = (k - 1) / SL * dw;
        c.globalAlpha = 1;
        c.drawImage(DOOR, srcX, 0, dw / SL, H, x0, H / 2 - (ph + hh) / 4, w, (ph + hh) / 2);
        // shading as the door turns away from the light
        c.fillStyle = `rgba(0,0,0,${Math.min(0.95, 0.15 + 0.45 * Math.sin(phi) * u + 0.7 * (1 - crack))})`;
        c.fillRect(x0, H / 2 - (ph + hh) / 4, w, (ph + hh) / 2);
      }
      prev = [sx, hh];
    }
    // hot rim light along the inner edge
    const xi = W / 2 + side * (-dw + dw * Math.cos(phi)) * (f / (f - dw * Math.sin(phi)));
    c.save(); c.globalCompositeOperation = 'lighter';
    const hh = H * (f / (f - dw * Math.sin(phi)));
    const rg = c.createLinearGradient(xi - side * 30, 0, xi, 0);
    rg.addColorStop(0, 'rgba(255,140,40,0)'); rg.addColorStop(1, `rgba(255,170,60,${0.04 + 0.7 * crack})`);
    c.fillStyle = rg; c.fillRect(Math.min(xi, xi - side * 30), H / 2 - hh / 2, 30, hh);
    c.restore();
  }
  // the seam glow
  if (crack > 0 && op < 0.15) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const flick = 0.85 + 0.15 * Math.sin(t * 37) * Math.sin(t * 13);
    c.globalAlpha = crack * flick * (1 - op / 0.15);
    c.drawImage(sprite(FIRE[3]), W / 2 - 40, 0, 80, H);
    c.drawImage(sprite(FIRE[1], 0.3), W / 2 - 6, 0, 12, H);
    c.globalAlpha = crack * 0.5 * (1 - op / 0.15);
    c.drawImage(sprite(FIRE[4]), W / 2 - 260, H / 2 - 900, 520, 1800);
    c.restore();
  }
  c.restore();
}

// ---------- crucible ----------
function swingAngle(t) {
  const tau = t - T.swing; if (tau < 0) return -1.2;
  const w = TAU / 1.55, z = 0.5, wd = w * Math.sqrt(1 - z * z);
  return -1.13 * Math.exp(-z * w * tau) * Math.cos(wd * tau);
}
function tipAngle(t) {
  if (t < T.tip0) return 0;
  const a = ease.inOut(map(t, T.tip0, T.tipEnd)) * 1.32;
  const back = ease.inOut(map(t, T.lift0 + 0.2, T.lift1)) * 0.8;
  return a - back + Math.sin(Math.max(0, t - T.tip0) * 9) * 0.01 * (1 - map(t, T.tip0, T.tipEnd));
}
const BODY = (() => {
  const ob = new Path2D();
  ob.moveTo(-162, -100); ob.bezierCurveTo(-178, 40, -150, 170, -122, 222);
  ob.quadraticCurveTo(0, 268, 122, 222); ob.bezierCurveTo(150, 170, 178, 40, 162, -100); ob.closePath();
  const mouth = new Path2D(); mouth.ellipse(0, -100, 146, 28, 0, 0, TAU);
  const spout = new Path2D(); spout.moveTo(-146, -122); spout.quadraticCurveTo(-190, -128, -218, -136); spout.lineTo(-210, -104); spout.quadraticCurveTo(-180, -92, -146, -78); spout.closePath();
  const lip = new Path2D(); lip.moveTo(-150, -112); lip.quadraticCurveTo(-188, -118, -213, -124); lip.lineTo(-209, -108); lip.quadraticCurveTo(-180, -100, -150, -92); lip.closePath();
  return { ob, mouth, spout, lip };
})();
const SPOUT_TIP = [-212, -116];
function crucible(c, t) {
  const lift = ease.in(map(t, T.lift0, T.lift1)) * 1500;
  if (t < T.swing || lift > 1400) return;
  const th = swingAngle(t), al = tipAngle(t);
  const px = PIVOT[0], py = PIVOT[1] - lift;
  const ax = px + Math.sin(th) * CHAIN, ay = py + Math.cos(th) * CHAIN;
  const world = c.getTransform(), inv = world.inverse();
  // chain
  for (let i = 0; i < 26; i++) {
    const u = (i + 0.5) / 26, x = lerp(px, ax, u), y = lerp(py, ay, u);
    c.save(); c.translate(x, y); c.rotate(-th);
    c.strokeStyle = i % 2 ? '#2b2420' : '#4a3e36'; c.lineWidth = i % 2 ? 7 : 9;
    c.beginPath(); if (i % 2) { c.moveTo(0, -16); c.lineTo(0, 16); } else c.ellipse(0, 0, 9, 20, 0, 0, TAU); c.stroke();
    c.restore();
  }
  c.save(); c.translate(ax, ay); c.rotate(-th);
  // bail
  c.lineCap = 'round';
  c.strokeStyle = '#2e2622'; c.lineWidth = 16;
  c.beginPath(); c.moveTo(-176, 150); c.bezierCurveTo(-176, 30, -70, -8, 0, 0); c.bezierCurveTo(70, -8, 176, 30, 176, 150); c.stroke();
  c.strokeStyle = 'rgba(255,170,90,0.22)'; c.lineWidth = 3; c.stroke();
  c.translate(0, 150);
  c.rotate(-al);
  const bodyT = c.getTransform();
  // steel shell with a red-hot belly
  const bg = c.createLinearGradient(-180, 0, 180, 0);
  bg.addColorStop(0, '#100c0a'); bg.addColorStop(0.32, '#3e342d'); bg.addColorStop(0.55, '#2a221d'); bg.addColorStop(1, '#0b0807');
  c.fillStyle = bg; c.fill(BODY.ob);
  c.save(); c.clip(BODY.ob);
  const hg = c.createRadialGradient(0, 250, 10, 0, 190, 230);
  hg.addColorStop(0, 'rgba(255,100,25,0.85)'); hg.addColorStop(0.45, 'rgba(210,50,12,0.4)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = hg; c.fillRect(-220, -140, 440, 420);
  const r = PE.rng(21);
  for (let i = 0; i < 110; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '120,60,25' : '0,0,0'},${0.12 + r() * 0.25})`; c.fillRect(-170 + r() * 340, -100 + r() * 330, 2 + r() * 9, 2 + r() * 5); }
  // bands
  [[-84, 30], [130, 22]].forEach(([y, hgt]) => {
    const g2 = c.createLinearGradient(0, y - hgt / 2, 0, y + hgt / 2);
    g2.addColorStop(0, '#5a4c42'); g2.addColorStop(0.5, '#2c241f'); g2.addColorStop(1, '#0c0908');
    c.fillStyle = g2; c.fillRect(-200, y - hgt / 2, 400, hgt);
  });
  c.restore();
  c.strokeStyle = '#070505'; c.lineWidth = 4; c.stroke(BODY.ob);
  // pins
  for (const s2 of [-1, 1]) { c.fillStyle = '#3c332d'; c.beginPath(); c.arc(s2 * 170, 0, 16, 0, TAU); c.fill(); c.fillStyle = '#6b5d52'; c.beginPath(); c.arc(s2 * 170 - 4, -4, 5, 0, TAU); c.fill(); }
  // rim
  c.lineWidth = 16; c.strokeStyle = '#2e2620'; c.beginPath(); c.ellipse(0, -100, 154, 32, 0, 0, TAU); c.stroke();
  c.lineWidth = 3; c.strokeStyle = 'rgba(255,160,70,0.6)'; c.beginPath(); c.ellipse(0, -100, 146, 27, 0, 0, TAU); c.stroke();
  // what is visible in the mouth: dark lining above the gold, gold below a level that stays flat in the world
  const sp = new DOMPoint(SPOUT_TIP[0], SPOUT_TIP[1]).matrixTransform(bodyT).matrixTransform(inv);
  const top = new DOMPoint(0, -170).matrixTransform(bodyT).matrixTransform(inv).y;
  const pouring = map(t, POUR_T.start, POUR_T.stop);
  let level = lerp(top, sp.y - 2, sm(map(t, POUR_T.start - 0.15, POUR_T.start + 0.1)));
  if (t > POUR_T.stop - 0.3) level = lerp(level, sp.y + 260, ease.in(map(t, POUR_T.stop - 0.3, T.lift0)));
  c.save(); c.clip(BODY.mouth);
  c.fillStyle = '#1a0d06'; c.fill(BODY.mouth);
  c.setTransform(world);
  const mg = c.createLinearGradient(0, level, 0, level + 160);
  mg.addColorStop(0, '#fffbe0'); mg.addColorStop(0.2, '#ffd45a'); mg.addColorStop(0.7, '#ff9a1a'); mg.addColorStop(1, '#d24a0c');
  c.fillStyle = mg; c.fillRect(-400, level, W + 800, 1200);
  const br = PE.rng(31);
  for (let i = 0; i < 12; i++) {
    const p = new DOMPoint(-120 + br() * 240, -100 + (br() - 0.5) * 30).matrixTransform(bodyT).matrixTransform(inv), ph = (t * (0.8 + br()) + br()) % 1;
    if (p.y < level) continue;
    c.globalAlpha = Math.sin(ph * Math.PI) * 0.85; c.fillStyle = '#fffbe8';
    c.beginPath(); c.ellipse(p.x, p.y, 5 + ph * 9, 2 + ph * 3, 0, 0, TAU); c.fill();
  }
  c.restore();
  // spout lip, glowing while it pours
  c.setTransform(bodyT);
  c.fillStyle = '#2e2620'; c.fill(BODY.spout);
  c.strokeStyle = 'rgba(255,190,90,0.45)'; c.lineWidth = 3; c.stroke(BODY.spout);
  // gold running over the lip while it pours
  const flow = clamp(map(t, POUR_T.start - 0.05, POUR_T.start + 0.1)) * (1 - clamp(map(t, POUR_T.stop - 0.1, POUR_T.stop + 0.15)));
  if (flow > 0) {
    const lg2 = c.createLinearGradient(0, -124, 0, -92);
    lg2.addColorStop(0, '#fffbe0'); lg2.addColorStop(0.5, '#ffd45a'); lg2.addColorStop(1, '#ff9a1a');
    c.globalAlpha = flow; c.fillStyle = lg2; c.fill(BODY.lip); c.globalAlpha = 1;
  }
  c.restore();
  c.setTransform(world);
  const mouthC = new DOMPoint(0, -100).matrixTransform(bodyT).matrixTransform(inv);
  glow(c, mouthC.x, mouthC.y, 260, 170, FIRE[3], 0.45 * (1 - clamp(map(t, POUR_T.stop - 0.2, T.lift0))));
  return { spout: sp, pouring };
}

// ---------- the pour ----------
function stream(c, t, sp) {
  if (!sp || t < POUR_T.start || t > POUR_T.stop + FALL + 0.1) return;
  const head = Math.min(t - POUR_T.start, FALL), tail = Math.max(0, t - POUR_T.stop);
  if (tail >= head) return;
  const vx = -120, vy = 140, g = 4200;
  const pts = [];
  for (let k = 0; k <= 40; k++) {
    const tau = lerp(tail, head, k / 40);
    let x = sp.x + vx * tau, y = sp.y + vy * tau + 0.5 * g * tau * tau;
    if (y > POOL_Y + 50) y = POOL_Y + 50;
    x += Math.sin(tau * 40 - t * 26) * 3 * (tau / FALL);
    pts.push([x, y, tau]);
  }
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const path = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
  c.globalCompositeOperation = 'lighter';
  path(); c.strokeStyle = 'rgba(255,120,30,0.35)'; c.lineWidth = 70; c.stroke();
  c.globalCompositeOperation = 'source-over';
  path(); c.strokeStyle = '#ff9d1f'; c.lineWidth = 26; c.stroke();
  path(); c.strokeStyle = '#ffd45a'; c.lineWidth = 16; c.stroke();
  path(); c.strokeStyle = '#fffbe0'; c.lineWidth = 6; c.stroke();
  c.restore();
  pts.forEach(([x, y], i) => { if (i % 8 === 0) glow(c, x, y, 70, 70, FIRE[3], 0.25); });
}

// ---------- letters ----------
const GOLD = LINES.map((L) => {
  const g = PE.ctx.createLinearGradient(0, -L.capH, 0, L.size * 0.12);
  [[0, '#fff4c8'], [0.16, '#f4cf68'], [0.42, '#9b6a12'], [0.52, '#d6a63c'], [0.72, '#fde9a4'], [0.9, '#b8862b'], [1, '#6e4a0e']].forEach(([k, col]) => g.addColorStop(k, col));
  return g;
});
function moltenFill(c, g, f, t) {
  const L = LINES[g.line], top = g.bb[1] - L.base, bot = g.bb[3] - L.base;
  const lv = lerp(bot + 6, top - 6, f);
  c.save(); c.clip(g.p);
  const mg = c.createLinearGradient(0, top, 0, bot);
  mg.addColorStop(0, '#fffbe0'); mg.addColorStop(0.35, '#ffd45a'); mg.addColorStop(0.75, '#ff9a1a'); mg.addColorStop(1, '#d24a0c');
  c.fillStyle = mg;
  c.beginPath(); c.moveTo(g.bb[0] - L.x0 - 10, bot + 10);
  for (let x = g.bb[0] - L.x0 - 10; x <= g.bb[2] - L.x0 + 10; x += 6) c.lineTo(x, lv + Math.sin(x * 0.09 + t * 14) * 5 * (1 - f));
  c.lineTo(g.bb[2] - L.x0 + 10, bot + 10); c.closePath(); c.fill();
  if (f < 1) { c.strokeStyle = 'rgba(255,255,240,0.95)'; c.lineWidth = 4; c.beginPath(); for (let x = g.bb[0] - L.x0 - 10; x <= g.bb[2] - L.x0 + 10; x += 6) { const y = lv + Math.sin(x * 0.09 + t * 14) * 5 * (1 - f); x === g.bb[0] - L.x0 - 10 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
  c.restore();
}
function goldGlyph(c, g, a, ds) {
  if (a <= 0) return;
  const L = LINES[g.line];
  c.save(); c.globalAlpha = a;
  c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = Math.min(60, 22 * ds); c.shadowOffsetY = Math.min(40, 12 * ds);
  c.fillStyle = GOLD[g.line]; c.fill(g.p);
  c.shadowColor = 'rgba(0,0,0,0)';
  c.save(); c.clip(g.p);
  c.lineJoin = 'round';
  c.translate(-1.6, -1.6); c.strokeStyle = 'rgba(255,252,230,0.85)'; c.lineWidth = 4; c.stroke(g.p);
  c.translate(3.4, 3.4); c.strokeStyle = 'rgba(60,38,4,0.75)'; c.lineWidth = 5; c.stroke(g.p);
  c.restore();
  c.strokeStyle = 'rgba(40,24,2,0.9)'; c.lineWidth = 1.4; c.stroke(g.p);
  void L;
  c.restore();
}
function letters(c, t, ds) {
  // jets of gold shoot up from the pool into each letter mould
  c.save(); c.lineCap = 'round';
  for (const g of ALL) {
    const up = map(t, g.f0 - 0.16, g.f0), down = map(t, g.f1, g.f1 + 0.25);
    if (up <= 0 || down >= 1) continue;
    const yTop = lerp(POOL_Y, g.bb[3] - 4, ease.out(up)), yBot = lerp(POOL_Y + 30, g.bb[3], ease.in(down));
    const N = 18, left = [], right = [];
    for (let k = 0; k <= N; k++) {
      const u = k / N, y = lerp(yBot, yTop, u), wv = Math.sin(y * 0.045 + t * 22 + g.i) * 4 * (1 - u * 0.5);
      const hw = lerp(16, 6, u) * (1 + 0.15 * Math.sin(y * 0.11 - t * 30));
      left.push([g.cx + wv - hw, y]); right.push([g.cx + wv + hw, y]);
    }
    const poly = new Path2D(); [...left, ...right.reverse()].forEach(([x, y], i) => (i ? poly.lineTo(x, y) : poly.moveTo(x, y))); poly.closePath();
    const jg = c.createLinearGradient(g.cx - 16, 0, g.cx + 16, 0);
    jg.addColorStop(0, '#ff8a14'); jg.addColorStop(0.45, '#fff6cf'); jg.addColorStop(1, '#ffb02e');
    c.globalCompositeOperation = 'source-over'; c.fillStyle = jg; c.fill(poly);
    glow(c, g.cx, yTop, 60, 50, FIRE[1], 0.6 * (1 - down));
    glow(c, g.cx, (yTop + yBot) / 2, 50, Math.abs(yBot - yTop) / 2 + 30, FIRE[4], 0.3);
  }
  c.restore();
  for (const L of LINES) {
    c.save(); c.translate(L.x0, L.base);
    for (const g of L.glyphs) {
      const f = ease.inOut(map(t, g.f0, g.f1)), cool = sm(map(t, g.c0, g.c1));
      if (f <= 0) {
        // empty mould: a faint glowing outline as the pour arrives
        const ghost = map(t, g.f0 - 0.8, g.f0) * 0.5;
        if (ghost > 0) { c.strokeStyle = `rgba(255,120,40,${ghost * 0.6})`; c.lineWidth = 2; c.stroke(g.p); }
        continue;
      }
      if (f < 1 || cool < 1) {
        const ghost = 1 - f;
        if (ghost > 0) { c.strokeStyle = `rgba(255,140,50,${ghost * 0.5})`; c.lineWidth = 2; c.stroke(g.p); }
      }
      goldGlyph(c, g, cool, ds);
      if (cool < 1) { c.save(); c.globalAlpha = 1 - cool; moltenFill(c, g, f, t); c.restore(); }
      // cooling crust: a deep red flush between molten and gold
      const flush = cool * (1 - cool) * 2.2;
      if (flush > 0.01) { c.save(); c.globalAlpha = flush * 0.55; c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#ff4d12'; c.fill(g.p); c.restore(); }
    }
    c.restore();
  }
  // heat glow on the letters
  for (const g of ALL) {
    const f = map(t, g.f0, g.f1), cool = sm(map(t, g.c0, g.c1));
    const a = f * (1 - cool);
    if (a > 0) glow(c, g.cx, (g.bb[1] + g.bb[3]) / 2, (g.bb[2] - g.bb[0]) * 1.2 + 40, g.heightPx * 0.9, FIRE[3], 0.32 * a);
  }
}
function drips(c, t) {
  for (const d of DRIPS) {
    const a = t - d.t0; if (a < 0) continue;
    const growU = clamp(a / d.grow), fallA = a - d.grow;
    const heat = 1 - sm(map(t, d.t0 + 1.2, d.t0 + 2.4));
    const col = (k) => (heat > 0.4 ? ['#fff3c0', '#ffc23e', '#ff8a14'][k] : ['#f6d77e', '#c9952e', '#7a5210'][k]);
    c.save();
    // neck hanging from the letter
    const neck = fallA < 0 ? d.len * ease.out(growU) : d.len * 0.35 * (1 - clamp(fallA / 0.6) * 0.6);
    const w = d.w;
    const ng = c.createLinearGradient(d.x - w, 0, d.x + w, 0);
    ng.addColorStop(0, col(2)); ng.addColorStop(0.45, col(0)); ng.addColorStop(1, col(1));
    c.fillStyle = ng;
    c.beginPath(); c.moveTo(d.x - w, d.y); c.quadraticCurveTo(d.x - w * 0.3, d.y + neck * 0.6, d.x - w * 0.35, d.y + neck);
    c.lineTo(d.x + w * 0.35, d.y + neck); c.quadraticCurveTo(d.x + w * 0.3, d.y + neck * 0.6, d.x + w, d.y); c.closePath(); c.fill();
    c.beginPath(); c.arc(d.x, d.y + neck, w * 0.5, 0, TAU); c.fill();
    // the bulb, then the falling drop
    if (fallA < 0) {
      const r = w * (0.5 + 0.55 * growU);
      c.beginPath(); c.arc(d.x, d.y + neck + r * 0.6, r, 0, TAU); c.fill();
      glow(c, d.x, d.y + neck, 40, 50, FIRE[3], 0.3 * heat);
    } else {
      const y = d.y + d.len + 0.5 * 3000 * fallA * fallA;
      if (y < POOL_Y + 40) {
        const r = w * 1.05;
        c.beginPath(); c.ellipse(d.x, y, r * 0.8, r * 1.3, 0, 0, TAU); c.fill();
        glow(c, d.x, y, 40, 50, FIRE[3], 0.35);
      }
    }
    c.restore();
  }
}
function smoke(c, t) {
  c.save();
  for (const p of SMOKE_P) {
    const a = t - p.b; if (a < 0 || a > p.life) continue;
    const u = a / p.life, s = p.s * (1 + u * 2);
    c.globalAlpha = Math.sin(u * Math.PI) * 0.16;
    c.drawImage(sprite(SMOKE[u < 0.5 ? 0 : 1]), p.x + p.drift * a - s / 2, p.y - p.v * a - s / 2, s, s);
  }
  c.restore();
}
function gleam(c, t) {
  const u = map(t, T.gleam, T.gleam + 0.85); if (u <= 0 || u >= 1) return;
  for (const L of LINES) {
    c.save(); c.translate(L.x0, L.base); c.clip(L.path);
    c.globalCompositeOperation = 'lighter';
    const x = lerp(-300, L.width + 300, ease.inOut(u)) + (L === LINES[0] ? 0 : -80);
    const gg = c.createLinearGradient(x - 90, 0, x + 90, -60);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,252,230,0.85)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gg; c.fillRect(-50, -L.capH - 40, L.width + 100, L.capH + 120);
    c.restore();
  }
}

// ---------- the whole shot ----------
PE.scene(0, DUR, (lt, t) => {
  const c = PE.ctx, base = c.getTransform();
  // the dive: zoom into the B's upper counter until it fills the screen
  const du = map(t, T.dive0, T.dive1);
  if (du > 0) {
    const z = Math.pow(150, Math.pow(du, 2.1));
    const k = sm(map(du, 0, 0.55));
    const sx = lerp(HOLE.cx, W / 2, k), sy = lerp(HOLE.cy, H / 2, k);
    c.translate(sx, sy); c.scale(z, z); c.translate(-HOLE.cx, -HOLE.cy);
  }
  const m = c.getTransform(), ds = Math.hypot(m.a, m.b) / PE.res;
  const deep = du > 0.25;
  if (!deep) {
    interior(c, t);
    drawEmbers(c, t, heatAt(t) * 0.8);
  } else { c.fillStyle = '#000'; c.fillRect(-W, -H, W * 3, H * 3); }
  if (!deep) {
    drawFlames(c, LICKS, t, 0.8 * (1 - sm(map(t, 9.6, 11))));
    const cr = crucible(c, t);
    stream(c, t, cr && cr.spout);
    drawFlames(c, WALL, t, 1.1);
  }
  if (t > T.cast0 - 1) {
    if (!deep) drawFlames(c, LETTERF, t, 0.7);
    letters(c, t, ds);
    // the counter of the B is a true black hole
    c.save(); c.translate(L0.x0, L0.base);
    c.fillStyle = '#000'; c.globalAlpha = sm(map(t, 11.6, 12.4)); c.fill(HOLE.path);
    c.restore();
    if (!deep) { drips(c, t); smoke(c, t); }
    gleam(c, t);
  }
  if (!deep) drawSparks(c, t);
  c.setTransform(base);
  gate(c, t);
  // flash when the pour hits
  const fl = t > LAND_T ? Math.exp(-(t - LAND_T) * 5) : 0;
  if (fl > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fl * 0.35; c.fillStyle = '#ff9a3a'; c.fillRect(0, 0, W, H); c.restore(); }
  // opening darkness and the final black
  const black = Math.max(1 - map(t, 0.0, 0.35), sm(map(t, T.dive1 - 0.25, T.dive1)));
  if (black > 0) { c.save(); c.globalAlpha = black; c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.restore(); }
});

// ---------- sound cues ----------
PE.sfx = [];
const cue = (t, type, o = {}) => PE.sfx.push({ t: +t.toFixed(3), type, ...o });
PE.music = { kind: 'forge', length: DUR, hits: [2.75, LAND_T, 8.95, T.dive1] };
cue(0.0, 'rumble', { dur: 2.8 });
cue(T.crack, 'crack', { dur: 0.8 });
cue(0.9, 'clank');
cue(T.open0, 'grind', { dur: 1.8 });
cue(1.1, 'roar', { dur: 10.8 });
cue(2.78, 'thud');
cue(T.swing, 'chain', { dur: 2.7 });
[3.2, 3.95, 4.6].forEach((x, i) => cue(x, 'creak', { gain: 0.7 - i * 0.15 }));
cue(T.tip0, 'creak', { gain: 0.9, dur: 0.9 });
cue(POUR_T.start, 'pour', { dur: POUR_T.stop - POUR_T.start + 0.5 });
cue(LAND_T, 'whoomph');
cue(LAND_T + 0.05, 'crackle', { dur: 4.2 });
cue(T.lift0, 'chain', { dur: 1.0, gain: 0.6 });
ALL.forEach((g, i) => { if (i % 2 === 0) cue(g.f0 - 0.16, 'jet', { gain: 0.5, pitch: 0.9 + (i % 5) * 0.05 }); });
cue(T.cool0 + 0.05, 'steam', { dur: 2.8 });
[9.5, 9.85, 10.3, 10.6, 11.1, 11.45].forEach((x, i) => cue(x, 'ping', { pitch: 1 + (i % 3) * 0.18, gain: 0.5 }));
DRIPS.forEach((d) => { const tf = d.t0 + d.grow + Math.sqrt((2 * (POOL_Y - d.y - d.len)) / 3000); cue(tf, 'plop', { gain: 0.5 }); });
cue(T.gleam, 'shimmer');
cue(T.dive0, 'riser', { dur: T.dive1 - T.dive0 });
cue(T.dive1, 'boom');
