/* Paper Engine v3 — torn-paper / stencil collage renderer.
   Every frame is a pure function of time t: PE.render(t, samples). */
(function () {
  const PE = {};
  window.PE = PE;

  // ---------- config ----------
  PE.W = 1080; PE.H = 1920; PE.fps = 30; PE.duration = 10;
  PE.res = 1;               // canvas px per logical px
  PE.jag = 2.2;             // torn-edge jitter amplitude (px)
  PE.jagScale = 1;
  PE.fringe = 3.4;          // white torn fringe width
  PE.step = 5;              // densify step (px)
  PE.boil = true; PE.boilHz = 8; PE.boilVariants = 3;
  PE.smoothBoil = false;    // blend two seeds (for painted mode)
  PE.paint = false;
  PE.shutter = 0.5;         // fraction of a frame the shutter is open
  PE.paperWhite = '#fbf6ea';
  PE.scenes = []; PE.transitions = []; PE.wipes = []; PE.impacts = [];
  PE.t = 0; PE.boilT = 0;

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
  const TAU = Math.PI * 2;
  PE.clamp = clamp; PE.lerp = lerp; PE.smooth = smooth; PE.TAU = TAU;
  PE.map = (x, a, b) => clamp((x - a) / (b - a));
  PE.ease = {
    inOut: (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; },
    out: (u) => 1 - Math.pow(1 - clamp(u), 3),
    in: (u) => Math.pow(clamp(u), 3),
    outQuad: (u) => 1 - (1 - clamp(u)) * (1 - clamp(u)),
    inQuad: (u) => clamp(u) * clamp(u),
    outBack: (u, s = 1.7) => { u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); },
  };
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) / 4294967296) * 1000;
  }
  function vnoise(x) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i), hash(i + 1), u) * 2 - 1;
  }
  function rng(seed) {
    let a = (Math.floor(seed * 9301) ^ 0x9e3779b9) >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  PE.hash = hash; PE.hashStr = hashStr; PE.noise = vnoise; PE.rng = rng;

  // deterministic secondary motion
  PE.wob = (t, freq = 1, amp = 1, phase = 0) => Math.sin((t * freq + phase) * TAU) * amp;
  // damped spring 0 -> 1 with overshoot, starting at t0
  PE.spring = (lt, t0 = 0, o = {}) => {
    const t = lt - t0; if (t <= 0) return 0;
    const f = o.f ?? 2.4, z = o.damp ?? 0.35, w = TAU * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  };
  // squash & stretch after a landing at tl
  PE.squash = (lt, tl, amt = 0.22, dur = 0.4) => {
    const u = (lt - tl) / dur;
    if (u < 0 || u > 1) return { sx: 1, sy: 1 };
    const k = Math.sin(u * Math.PI * 2.5) * (1 - u) * (1 - u) * amt;
    return { sx: 1 + k * 0.8, sy: 1 - k };
  };
  // pop-in scale: 0 before t0, springs to 1
  PE.pop = (lt, t0, o) => Math.max(0, PE.spring(lt, t0, o));
  // window helper: 0..1 in, 1 hold, 1..0 out
  PE.win = (lt, a, b, fin = 0.25, fout = 0.25) => clamp((lt - a) / fin) * clamp((b - lt) / fout);

  // ---------- textures ----------
  let grainPat = null, fiberPat = null, toothPat = null, speckPat = null;
  function makeTextures(ctx) {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    // grain: mostly white with soft darker flecks (for multiply)
    const g = mk(256, 256), gx = g.getContext('2d');
    const id = gx.createImageData(256, 256), r = rng(7);
    for (let i = 0; i < 256 * 256; i++) {
      let v = 236 + r() * 19;
      if (r() < 0.035) v -= 25 + r() * 45;
      id.data[i * 4] = v; id.data[i * 4 + 1] = v - 2; id.data[i * 4 + 2] = v - 6; id.data[i * 4 + 3] = 255;
    }
    gx.putImageData(id, 0, 0);
    // soften with blotches
    for (let i = 0; i < 70; i++) {
      gx.fillStyle = `rgba(120,95,60,${0.015 + r() * 0.03})`;
      gx.beginPath(); gx.arc(r() * 256, r() * 256, 6 + r() * 30, 0, TAU); gx.fill();
    }
    grainPat = ctx.createPattern(g, 'repeat');
    // fibers: light curly strands on transparent
    const f = mk(384, 384), fx = f.getContext('2d');
    for (let i = 0; i < 160; i++) {
      const x = r() * 384, y = r() * 384, a = r() * TAU, L = 8 + r() * 26;
      fx.strokeStyle = r() < 0.6 ? `rgba(255,255,255,${0.25 + r() * 0.35})` : `rgba(60,40,20,${0.08 + r() * 0.12})`;
      fx.lineWidth = 0.6 + r() * 0.7;
      fx.beginPath(); fx.moveTo(x, y);
      fx.quadraticCurveTo(x + Math.cos(a + 0.8) * L * 0.6, y + Math.sin(a + 0.8) * L * 0.6, x + Math.cos(a) * L, y + Math.sin(a) * L);
      fx.stroke();
    }
    fiberPat = ctx.createPattern(f, 'repeat');
    // tooth: whole-frame paper texture
    const t = mk(512, 512), tx = t.getContext('2d');
    const td = tx.createImageData(512, 512);
    for (let i = 0; i < 512 * 512; i++) {
      const v = 228 + r() * 27;
      td.data[i * 4] = v; td.data[i * 4 + 1] = v - 1; td.data[i * 4 + 2] = v - 5; td.data[i * 4 + 3] = 255;
    }
    tx.putImageData(td, 0, 0);
    tx.globalAlpha = 0.5; tx.filter = 'blur(1px)'; tx.drawImage(t, 0, 0); tx.filter = 'none'; tx.globalAlpha = 1;
    toothPat = ctx.createPattern(t, 'repeat');
    // speckles for spray texture / stamps
    const s = mk(256, 256), sx = s.getContext('2d');
    for (let i = 0; i < 900; i++) {
      sx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
      sx.beginPath(); sx.arc(r() * 256, r() * 256, 0.4 + r() * 1.3, 0, TAU); sx.fill();
    }
    speckPat = ctx.createPattern(s, 'repeat');
  }

  // ---------- geometry ----------
  function densify(pts, step) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(L / step));
      for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
    }
    return out;
  }
  function catmull(pts, step, closed = true) {
    const out = [], n = pts.length, last = closed ? n : n - 1;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(2, Math.ceil(L / step));
      for (let j = 0; j < k; j++) {
        const t = j / k, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  PE.catmull = catmull;
  function rectPts(w, h, r) {
    const x = w / 2, y = h / 2;
    if (!r) return [[-x, -y], [x, -y], [x, y], [-x, y]];
    r = Math.min(r, x, y);
    const pts = [], seg = Math.max(3, Math.ceil(r / 5));
    const corners = [[x - r, -y + r, -Math.PI / 2], [x - r, y - r, 0], [-x + r, y - r, Math.PI / 2], [-x + r, -y + r, Math.PI]];
    for (const [cx, cy, a0] of corners)
      for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * (Math.PI / 2); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  function ellPts(rx, ry) {
    const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const n = clamp(Math.ceil(per / PE.step), 20, 900), pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; pts.push([Math.cos(a) * rx, Math.sin(a) * ry]); }
    return pts;
  }
  function tear(pts, seed, amp) {
    const n = pts.length, out = new Array(n);
    if (amp <= 0.01) return pts;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      if (i > 0) s += Math.hypot(p[0] - a[0], p[1] - a[1]);
      let d = vnoise(s * 0.05 + seed) * 0.62 + vnoise(s * 0.21 + seed * 1.7) * 0.3 + (hash(i * 1.31 + seed) - 0.5) * 0.45;
      const rp = vnoise(s * 0.012 + seed * 2.3);
      if (rp > 0.55) d -= (rp - 0.55) * 6.5;
      out[i] = [p[0] + nx * d * amp, p[1] + ny * d * amp];
    }
    return out;
  }
  function tearBoil(pts, seed, amp, o) {
    if (o.boil === false || !PE.boil) return tear(pts, seed, amp);
    const k = PE.boilT * PE.boilHz;
    if (!PE.smoothBoil) return tear(pts, seed + (Math.floor(k) % PE.boilVariants) * 101.37, amp);
    const i0 = Math.floor(k / 3.3), f = smooth(k / 3.3 - i0);
    const A = tear(pts, seed + (i0 % 5) * 101.37, amp), B = tear(pts, seed + ((i0 + 1) % 5) * 101.37, amp);
    return A.map((p, i) => [lerp(p[0], B[i][0], f), lerp(p[1], B[i][1], f)]);
  }
  function toPath(pts) {
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
    return p;
  }
  function bbox(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    return [x0, y0, x1, y1];
  }

  // seeds stable per (kind,color,size) + occurrence order within a scene
  const occ = new Map();
  function seedFor(o, key) {
    if (o.seed != null) return o.seed;
    const n = (occ.get(key) || 0) + 1; occ.set(key, n);
    return hashStr(key) + n * 13.7;
  }
  PE._resetSeeds = () => occ.clear();

  // ---------- the paper shape ----------
  function paper(local, o, key, minDim) {
    const c = PE.ctx;
    const alpha = o.alpha ?? 1;
    if (alpha <= 0.004) return;
    const color = o.color || '#ffffff';
    const seed = seedFor(o, key + '|' + color);
    const z = o.z ?? 1;
    c.save();
    c.translate(o.x || 0, o.y || 0);
    if (o.rot) c.rotate(o.rot);
    if (o.sx != null || o.sy != null) c.scale(o.sx ?? 1, o.sy ?? 1);
    if ((o.sx ?? 1) === 0 || (o.sy ?? 1) === 0) { c.restore(); return; }
    if (alpha < 1) c.globalAlpha *= alpha;
    const m = c.getTransform(), ds = Math.hypot(m.a, m.b);
    const edge = o.edge || 'torn';
    let amp = PE.jag * PE.jagScale * (o.jag ?? 1);
    amp = Math.min(amp, minDim * 0.05 + 0.25);
    if (edge === 'cut') amp *= 0.3;
    const base = tearBoil(local, seed, amp, o);
    const path = toPath(base);
    const fr = edge === 'cut' ? 0 : (o.fringe ?? 1) * PE.fringe * Math.min(1, minDim / 40);
    const sh = (o.shadow ?? 1) * (z > 0 ? 1 : 0);
    const setShadow = () => {
      c.shadowColor = `rgba(28,16,6,${(0.2 + 0.045 * z) * sh})`;
      c.shadowBlur = (3 + 5 * z) * ds;
      c.shadowOffsetX = (1 + 1.6 * z) * ds;
      c.shadowOffsetY = (2 + 3.2 * z) * ds;
    };
    const noShadow = () => { c.shadowColor = 'rgba(0,0,0,0)'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; };
    if (fr > 0) {
      const fp = toPath(tearBoil(local, seed + 57.3, amp * 1.8, o));
      c.fillStyle = o.fringeColor || PE.paperWhite;
      if (sh > 0) setShadow();
      c.fill(fp);
      noShadow();
      c.strokeStyle = o.fringeColor || PE.paperWhite; c.lineWidth = fr; c.lineJoin = 'round';
      c.stroke(fp);
      c.fillStyle = color;
      c.fill(path);
    } else {
      if (sh > 0) setShadow();
      c.fillStyle = color; c.fill(path);
      noShadow();
    }
    const [x0, y0, x1, y1] = bbox(base);
    const tex = o.tex ?? 1;
    if (tex > 0 && grainPat && minDim > 6) {
      c.save();
      c.clip(path);
      const mx = new DOMMatrix([1, 0, 0, 1, (seed * 37) % 256, (seed * 53) % 256]);
      // light gradient across the sheet
      const lg = c.createLinearGradient(x0, y0, x1, y1);
      lg.addColorStop(0, `rgba(255,255,255,${0.13 * tex})`);
      lg.addColorStop(0.55, 'rgba(255,255,255,0)');
      lg.addColorStop(1, `rgba(0,0,0,${0.1 * tex})`);
      c.fillStyle = lg; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.globalCompositeOperation = 'multiply';
      grainPat.setTransform(mx);
      c.globalAlpha = alpha * 0.55 * (o.grain ?? 1) * tex;
      c.fillStyle = grainPat; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.globalCompositeOperation = 'source-over';
      fiberPat.setTransform(mx);
      c.globalAlpha = alpha * 0.55 * tex;
      c.fillStyle = fiberPat; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.globalAlpha = alpha;
      if (o.hatch) {
        c.strokeStyle = o.hatchColor || `rgba(20,10,30,${o.hatch})`;
        c.lineWidth = 1.3;
        const sp = o.hatchGap || 9, r = rng(seed);
        c.beginPath();
        for (let x = x0 - (y1 - y0); x < x1; x += sp) {
          const j = (r() - 0.5) * 3;
          c.moveTo(x + j, y1); c.lineTo(x + (y1 - y0) + j * 2, y0);
        }
        c.stroke();
      }
      // bevel: light upper-left rim, dark lower-right rim (light fixed in screen space)
      const bv = (o.bevel ?? 1) * 2.6;
      if (bv > 0) {
        const rot = o.rot || 0, cr = Math.cos(-rot), sr = Math.sin(-rot);
        const dx = (cr - sr) * bv, dy = (sr + cr) * bv;
        c.lineWidth = bv * 1.6;
        c.save(); c.translate(dx, dy); c.strokeStyle = 'rgba(255,255,255,0.32)'; c.stroke(path); c.restore();
        c.save(); c.translate(-dx, -dy); c.strokeStyle = 'rgba(0,0,0,0.2)'; c.stroke(path); c.restore();
      }
      c.restore();
    }
    if (o.ink) {
      c.strokeStyle = o.ink; c.lineWidth = o.inkW || 3; c.lineJoin = 'round'; c.stroke(path);
    }
    c.restore();
  }
  PE._paper = paper;

  // R: rect centered at x,y. E: ellipse. C: circle. P: polygon. B: smooth blob. cap: capsule. star: burst.
  PE.R = (x, y, w, h, o = {}) => {
    if (w <= 0 || h <= 0) return;
    paper(densify(rectPts(w, h, o.r || 0), PE.step), { ...o, x, y }, `R${Math.round(w)}x${Math.round(h)}`, Math.min(w, h));
  };
  PE.E = (x, y, rx, ry, o = {}) => {
    if (rx <= 0 || ry <= 0) return;
    paper(ellPts(rx, ry), { ...o, x, y }, `E${Math.round(rx)}x${Math.round(ry)}`, 2 * Math.min(rx, ry));
  };
  PE.C = (x, y, r, o = {}) => PE.E(x, y, r, r, o);
  PE.P = (pts, o = {}) => {
    const [x0, y0, x1, y1] = bbox(pts);
    paper(densify(pts, PE.step), o, `P${pts.length}|${Math.round(x1 - x0)}`, Math.min(x1 - x0, y1 - y0));
  };
  PE.B = (pts, o = {}) => {
    const [x0, y0, x1, y1] = bbox(pts);
    paper(catmull(pts, PE.step), o, `B${pts.length}|${Math.round(x1 - x0)}`, Math.min(x1 - x0, y1 - y0));
  };
  PE.cap = (x1, y1, x2, y2, r, o = {}) => {
    const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
    PE.R((x1 + x2) / 2, (y1 + y2) / 2, L + 2 * r, 2 * r, { r, ...o, rot: a + (o.rot || 0), seed: o.seed });
  };
  PE.star = (x, y, r1, r2, n, o = {}) => {
    const pts = [], ph = o.phase || 0;
    for (let i = 0; i < n * 2; i++) {
      const a = ph + (i / (n * 2)) * TAU - Math.PI / 2, r = i % 2 ? r2 : r1;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    paper(densify(pts, PE.step), { ...o, x, y }, `S${n}|${Math.round(r1)}`, r2 * 1.5);
  };
  // full-frame background sheet
  PE.bg = (color, o = {}) => {
    PE.R(PE.W / 2, PE.H / 2, PE.W + 60, PE.H + 60, { color, z: 0, fringe: 0, bevel: 0, seed: 1, boil: false, ...o });
    if (o.wash !== false) {
      const c = PE.ctx, g = c.createRadialGradient(PE.W * 0.45, PE.H * 0.4, 80, PE.W / 2, PE.H / 2, PE.H * 0.75);
      g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
      c.fillStyle = g; c.fillRect(-30, -30, PE.W + 60, PE.H + 60);
    }
  };

  // ---------- fonts & text ----------
  PE.fonts = { stencil: 'PStencil', stencil7: 'PStencil7', head: 'PHead', hand: 'PHand' };
  PE.font = (name, size) => {
    const fam = PE.fonts[name] || name;
    const fallback = name === 'hand' ? 'cursive' : 'Impact, "Arial Black", sans-serif';
    return `${size}px "${fam}", ${fallback}`;
  };
  PE.text = (str, x, y, o = {}) => {
    const c = PE.ctx;
    c.save();
    c.translate(x, y); if (o.rot) c.rotate(o.rot);
    if (o.scale != null) c.scale(o.scale, o.scale);
    c.globalAlpha *= o.alpha ?? 1;
    c.font = PE.font(o.font || 'head', o.size || 48);
    c.textAlign = o.align || 'center'; c.textBaseline = o.baseline || 'middle';
    if (o.ls) c.letterSpacing = o.ls + 'px';
    if (o.stroke) { c.lineWidth = o.strokeW || 8; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.strokeText(str, 0, 0); }
    c.fillStyle = o.color || '#1d1a22';
    c.fillText(str, 0, 0);
    c.restore();
  };

  // spray-painted stencil lettering (cached bitmaps)
  const sprayCache = new Map();
  function sprayBitmap(str, size, color, fontName, seed, drips, mist) {
    const key = [str, size, color, fontName, seed, drips, mist, PE.res].join('|');
    if (sprayCache.has(key)) return sprayCache.get(key);
    const res = PE.res, font = PE.font(fontName, size);
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = font;
    const m = meas.measureText(str);
    const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    const tw = m.width, pad = size * 0.32;
    const w = Math.ceil(tw + pad * 2), h = Math.ceil(asc + desc + pad * 2 + size * 0.35);
    const mk = () => { const cv = document.createElement('canvas'); cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res); const g = cv.getContext('2d', { willReadFrequently: true }); g.scale(res, res); g.font = font; g.textBaseline = 'alphabetic'; return [cv, g]; };
    const bx = pad, by = pad + asc;
    const [cv, g] = mk();
    const [mc, mg] = mk();
    const [sc, sg] = mk();
    const r = rng(seed + hashStr(str));
    // soft mask of the glyphs for overspray
    mg.filter = `blur(${size * 0.08}px)`; mg.fillStyle = '#000';
    mg.fillText(str, bx, by); mg.fillText(str, bx, by);
    // speckles
    sg.fillStyle = color;
    const cnt = (w * h) / 55;
    for (let i = 0; i < cnt; i++) { sg.globalAlpha = 0.35 + r() * 0.65; sg.beginPath(); sg.arc(r() * w, r() * h, 0.5 + r() * r() * 2.4, 0, TAU); sg.fill(); }
    sg.globalAlpha = 1; sg.globalCompositeOperation = 'destination-in';
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.drawImage(mc, 0, 0);
    // haze
    g.fillStyle = color;
    g.filter = `blur(${size * 0.03}px)`; g.globalAlpha = 0.45 * mist; g.fillText(str, bx, by);
    g.filter = 'none'; g.globalAlpha = 0.85 * mist;
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(sc, 0, 0); g.setTransform(res, 0, 0, res, 0, 0);
    g.globalAlpha = 1; g.fillText(str, bx, by);
    // drips from the glyph bottoms
    if (drips > 0) {
      const row = g.getImageData(0, Math.floor((by - 3) * res), cv.width, 1).data;
      const xs = [];
      for (let x = 0; x < cv.width; x += 3) if (row[x * 4 + 3] > 230) xs.push(x / res);
      const nd = Math.round((tw / size) * 1.1 * drips);
      for (let i = 0; i < nd && xs.length; i++) {
        const x = xs[Math.floor(r() * xs.length)], L = size * (0.06 + r() * r() * 0.3), wd = size * (0.012 + r() * 0.016);
        g.beginPath(); g.moveTo(x - wd, by - 4); g.lineTo(x + wd, by - 4); g.lineTo(x + wd * 0.7, by + L); g.lineTo(x - wd * 0.7, by + L); g.closePath(); g.fill();
        g.beginPath(); g.arc(x, by + L, wd * 1.3, 0, TAU); g.fill();
      }
    }
    // spray texture inside letters
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = 0.22; g.fillStyle = speckPat; g.fillRect(0, 0, w, h);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const out = { cv, w, h, pad, asc, desc, tw };
    sprayCache.set(key, out);
    return out;
  }
  PE.measure = (str, fontName, size) => {
    const c = PE.ctx; c.save(); c.font = PE.font(fontName, size); const m = c.measureText(str); c.restore();
    return { w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
  };
  // x,y = center of the cap height. progress reveals left->right with a soft spray edge.
  PE.spray = (str, x, y, o = {}) => {
    const size = o.size || 200, p = o.progress ?? 1;
    if (p <= 0) return;
    const b = sprayBitmap(str, size, o.color || '#ef4130', o.font || 'stencil', o.seed || 1, o.drips ?? 1, o.mist ?? 1);
    const c = PE.ctx;
    c.save();
    c.translate(x, y); if (o.rot) c.rotate(o.rot);
    const sc = o.scale ?? 1; if (sc !== 1) c.scale(sc, sc);
    c.globalAlpha *= o.alpha ?? 1;
    const ox = -b.tw / 2 - b.pad, oy = -b.asc / 2 - b.pad;
    if (p >= 1) c.drawImage(b.cv, ox, oy, b.w, b.h);
    else {
      const f = size * 0.6, edge = p * (b.w + f) - f;
      const res = b.cv.width / b.w;
      if (edge > 0) c.drawImage(b.cv, 0, 0, edge * res, b.cv.height, ox, oy, edge, b.h);
      const N = 8;
      for (let i = 0; i < N; i++) {
        const sx0 = Math.max(0, edge + (i * f) / N), sx1 = Math.min(b.w, edge + ((i + 1) * f) / N);
        if (sx1 <= sx0) continue;
        c.globalAlpha = (o.alpha ?? 1) * (1 - (i + 0.5) / N);
        c.drawImage(b.cv, sx0 * res, 0, (sx1 - sx0) * res, b.cv.height, ox + sx0, oy, sx1 - sx0, b.h);
      }
    }
    c.restore();
  };

  // stencil card with the text cut out (cached per boil variant)
  const cardCache = new Map();
  PE.stencilCard = (lines, x, y, w, h, o = {}) => {
    const size = o.size || 200, lh = o.lineH || size * 1.05, font = o.font || 'stencil';
    const variant = PE.boil ? Math.floor(PE.boilT * PE.boilHz) % PE.boilVariants : 0;
    const key = [lines.join('/'), w, h, size, o.color, variant, PE.res].join('|');
    let entry = cardCache.get(key);
    const pad = 60;
    if (!entry) {
      const cv = document.createElement('canvas');
      cv.width = Math.ceil((w + pad * 2) * PE.res); cv.height = Math.ceil((h + pad * 2) * PE.res);
      const g = cv.getContext('2d'); g.scale(PE.res, PE.res);
      const prev = PE.ctx, prevT = PE.boilT; PE.ctx = g;
      paper(densify(rectPts(w, h, 10), PE.step), { color: o.color || '#c79a5c', x: w / 2 + pad, y: h / 2 + pad, z: 2.2, seed: o.seed || 77, hatch: 0.05 }, 'card', Math.min(w, h));
      PE.ctx = prev; PE.boilT = prevT;
      g.font = PE.font(font, size); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      const m = g.measureText('H'), asc = m.actualBoundingBoxAscent;
      const y0 = pad + h / 2 - ((lines.length - 1) * lh) / 2 + asc / 2;
      g.globalCompositeOperation = 'destination-out';
      lines.forEach((ln, i) => g.fillText(ln, pad + w / 2, y0 + i * lh));
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = 'rgba(40,22,8,0.45)';
      lines.forEach((ln, i) => g.fillText(ln, pad + w / 2 - 4, y0 + i * lh - 5));
      g.globalCompositeOperation = 'source-over';
      entry = { cv, pad };
      cardCache.set(key, entry);
    }
    const c = PE.ctx;
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
    if (o.scale) c.scale(o.scale, o.scale);
    c.globalAlpha *= o.alpha ?? 1;
    c.drawImage(entry.cv, -w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
    c.restore();
  };

  // rich text: *word* = highlighted
  function tokens(text) {
    const out = []; let hl = false;
    for (const part of text.split(/(\*)/)) {
      if (part === '*') { hl = !hl; continue; }
      for (const w of part.split(/(\s+)/)) if (w.length) out.push({ w, hl });
    }
    return out;
  }
  function wrapTokens(toks, maxW, c) {
    const lines = []; let cur = [], cw = 0;
    for (const t of toks) {
      const tw = c.measureText(t.w).width;
      if (/^\s+$/.test(t.w)) { if (cur.length) { cur.push(t); cw += tw; } continue; }
      if (cw + tw > maxW && cur.length) {
        while (cur.length && /^\s+$/.test(cur[cur.length - 1].w)) cur.pop();
        lines.push(cur); cur = []; cw = 0;
      }
      cur.push(t); cw += tw;
    }
    while (cur.length && /^\s+$/.test(cur[cur.length - 1].w)) cur.pop();
    if (cur.length) lines.push(cur);
    return lines;
  }
  // caption on torn paper strips; pops in at t0, out at t1
  PE.caption = (text, lt, t0, t1, o = {}) => {
    if (lt < t0 || lt > t1) return;
    const c = PE.ctx, size = o.size || 62, pad = size * 0.42;
    c.save();
    c.font = PE.font(o.font || 'head', size);
    const lines = wrapTokens(tokens(text), (o.maxW || PE.W * 0.8) - pad * 2, c);
    const lh = size * 1.42, y0 = (o.y ?? 1540) - ((lines.length - 1) * lh) / 2;
    const out = PE.map(lt, t1 - 0.22, t1);
    const seed0 = hashStr(text);
    lines.forEach((ln, i) => {
      const tw = ln.reduce((s, t) => s + c.measureText(t.w).width, 0);
      const ap = PE.spring(lt, t0 + i * 0.07, { f: 2.6, damp: 0.42 });
      const sc = (0.5 + 0.5 * ap) * (1 - out * 0.35);
      const al = clamp(ap * 4) * (1 - out);
      if (al <= 0) return;
      const rot = (i % 2 ? 1 : -1) * 0.016 + (o.rot || 0) + PE.wob(lt, 0.3, 0.004, i);
      const x = o.x ?? PE.W / 2, y = y0 + i * lh + out * 30;
      PE.R(x, y, tw + pad * 2, size * 1.3, { color: o.bg || PE.paperWhite, z: 1.4, rot, sx: sc, sy: sc, seed: seed0 + i, alpha: al, jag: 1.3, bevel: 0.6 });
      c.save();
      c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.globalAlpha *= al;
      c.textBaseline = 'middle'; c.textAlign = 'left';
      let cx = -tw / 2;
      for (const t of ln) {
        c.fillStyle = t.hl ? (o.hl || '#e8392a') : (o.color || '#1d1a22');
        c.fillText(t.w, cx, size * 0.04);
        cx += c.measureText(t.w).width;
      }
      c.restore();
    });
    c.restore();
  };

  // rubber stamp that slams down at t0
  const stampCache = new Map();
  function stampBitmap(text, sub, size, color, seed) {
    const key = [text, sub, size, color, seed, PE.res].join('|');
    if (stampCache.has(key)) return stampCache.get(key);
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = PE.font('stencil', size);
    const tw = meas.measureText(text).width;
    const subSize = size * 0.3;
    meas.font = PE.font('head', subSize);
    const sw = sub ? meas.measureText(sub).width : 0;
    const w = Math.max(tw, sw) + size * 0.7, h = size * 1.08 + (sub ? subSize * 1.5 : 0) + size * 0.2;
    const cv = document.createElement('canvas'); cv.width = Math.ceil((w + 20) * PE.res); cv.height = Math.ceil((h + 20) * PE.res);
    const g = cv.getContext('2d'); g.scale(PE.res, PE.res); g.translate(10, 10);
    g.strokeStyle = color; g.fillStyle = color;
    g.lineWidth = size * 0.07; g.lineJoin = 'round';
    const rr = (x, y, ww, hh, r) => { g.beginPath(); g.roundRect(x, y, ww, hh, r); g.stroke(); };
    rr(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth, size * 0.12);
    g.lineWidth = size * 0.025;
    rr(size * 0.11, size * 0.11, w - size * 0.22, h - size * 0.22, size * 0.07);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = PE.font('stencil', size);
    g.fillText(text, w / 2, size * 0.62 + size * 0.06);
    if (sub) { g.font = PE.font('head', subSize); g.fillText(sub, w / 2, size * 1.2 + subSize * 0.4); }
    // distress
    g.globalCompositeOperation = 'destination-out';
    const r = rng(seed);
    for (let i = 0; i < (w * h) / 40; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.beginPath(); g.arc(r() * w, r() * h, 0.4 + r() * r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 6; i++) { g.globalAlpha = 0.25; g.lineWidth = 2 + r() * 4; g.beginPath(); const yy = r() * h; g.moveTo(0, yy); g.lineTo(w, yy + (r() - 0.5) * 40); g.stroke(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const out = { cv, w: w + 20, h: h + 20 };
    stampCache.set(key, out);
    return out;
  }
  PE.stamp = (text, x, y, lt, t0, o = {}) => {
    if (lt < t0) return;
    const b = stampBitmap(text, o.sub || '', o.size || 150, o.color || '#e8392a', o.seed || 3);
    const u = (lt - t0) / 0.15;
    let sc, al;
    if (u < 1) { sc = lerp(2.5, 1, PE.ease.inQuad(u)); al = clamp(u * 2); }
    else { const k = lt - t0 - 0.15; sc = 1 - 0.07 * Math.exp(-k * 9) * Math.cos(k * 40); al = 1; }
    if (o.t1 != null) al *= 1 - PE.map(lt, o.t1 - 0.2, o.t1);
    if (al <= 0) return;
    const c = PE.ctx;
    c.save(); c.translate(x, y); c.rotate(o.rot ?? -0.12); c.scale(sc * (o.scale || 1), sc * (o.scale || 1));
    c.globalAlpha *= al * (o.alpha ?? 0.94);
    c.drawImage(b.cv, -b.w / 2, -b.h / 2, b.w, b.h);
    c.restore();
  };

  // small paper tag with text
  PE.label = (text, x, y, o = {}) => {
    const c = PE.ctx, size = o.size || 36;
    c.save(); c.font = PE.font(o.font || 'head', size);
    const tw = c.measureText(text).width; c.restore();
    const s = o.scale ?? 1;
    if (s <= 0.01) return;
    PE.R(x, y, tw + size * 0.9, size * 1.55, { color: o.bg || PE.paperWhite, z: o.z ?? 1, rot: o.rot || 0, sx: s, sy: s, seed: o.seed ?? hashStr(text), alpha: o.alpha, r: o.r ?? 4, jag: 1.2 });
    PE.text(text, x, y + size * 0.04, { font: o.font || 'head', size, color: o.color || '#1d1a22', rot: o.rot || 0, scale: s, alpha: o.alpha });
  };

  // paint brush stroke along points (progress 0..1)
  PE.brush = (pts, o = {}) => {
    const p = o.progress ?? 1; if (p <= 0 || pts.length < 2) return;
    const c = PE.ctx, w = o.width || 24, color = o.color || '#1d1a22';
    const path = pts.length > 2 ? catmull(pts, 6, false) : densify(pts, 6).concat([pts[1]]);
    const L = []; let s = 0;
    for (let i = 0; i < path.length; i++) { if (i) s += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); L.push(s); }
    const end = s * p, seed = o.seed || 5;
    const left = [], right = [];
    for (let i = 0; i < path.length; i++) {
      if (L[i] > end) break;
      const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const u = L[i] / (s || 1);
      const taper = Math.min(1, u * 6, (1 - u) * 5 + 0.25) * (1 + vnoise(L[i] * 0.03 + seed) * 0.18);
      const hw = (w / 2) * Math.max(0.15, taper);
      left.push([path[i][0] + nx * hw, path[i][1] + ny * hw]); right.push([path[i][0] - nx * hw, path[i][1] - ny * hw]);
    }
    if (left.length < 2) return;
    const poly = left.concat(right.reverse());
    c.save(); c.globalAlpha *= o.alpha ?? 1;
    c.fillStyle = color; c.fill(toPath(poly));
    // bristle streaks
    c.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      const off = (k / 4 - 0.5) * w * 0.7;
      c.strokeStyle = k % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)';
      c.lineWidth = 1.2 + hash(k + seed) * 1.5;
      c.beginPath();
      for (let i = 0; i < path.length && L[i] <= end; i++) {
        const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        const x = path[i][0] + nx * off, y = path[i][1] + ny * off;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
    c.restore();
  };
  // wobbly ink / pencil line
  PE.line = (pts, o = {}) => {
    const c = PE.ctx, p = o.progress ?? 1; if (p <= 0) return;
    const path = densify(pts, 8); path.pop();
    const pts2 = pts.length === 2 ? densify(pts, 8).slice(0, -1).concat([pts[1]]) : catmull(pts, 8, false);
    let s = 0; const Ls = [0];
    for (let i = 1; i < pts2.length; i++) { s += Math.hypot(pts2[i][0] - pts2[i - 1][0], pts2[i][1] - pts2[i - 1][1]); Ls.push(s); }
    c.save(); c.globalAlpha *= o.alpha ?? 1;
    c.strokeStyle = o.color || '#1d1a22'; c.lineWidth = o.width || 4; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    const seed = o.seed || 9, j = o.wobble ?? 1.2;
    for (let i = 0; i < pts2.length && Ls[i] <= s * p; i++) {
      const x = pts2[i][0] + vnoise(Ls[i] * 0.05 + seed) * j, y = pts2[i][1] + vnoise(Ls[i] * 0.05 + seed + 40) * j;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke(); c.restore();
  };

  // floating paper confetti for ambient motion
  PE.confetti = (lt, o = {}) => {
    const n = o.n || 14, r = rng(o.seed || 11), colors = o.colors || ['#ffc928', '#ef4130', '#12a79d', '#2a4bd7', '#ff6fae'];
    for (let i = 0; i < n; i++) {
      const x0 = r() * PE.W, y0 = r() * PE.H, sz = 10 + r() * 16, sp = 20 + r() * 40, ph = r() * 10;
      const y = ((y0 - lt * sp * (o.dir ?? 1)) % (PE.H + 100) + PE.H + 100) % (PE.H + 100) - 50;
      const x = x0 + PE.wob(lt, 0.15 + r() * 0.2, 30, ph);
      if (o.avoid && o.avoid(x, y)) continue;
      PE.R(x, y, sz, sz * (0.5 + r() * 0.8), { color: colors[i % colors.length], rot: lt * (r() - 0.5) * 3 + ph, z: 0.6, seed: 900 + i, fringe: 0.4, tex: 0.5, alpha: o.alpha });
    }
  };

  // ---------- camera ----------
  PE.cam = { x: 540, y: 960, z: 1, r: 0 };
  PE.camera = (x, y, z = 1, r = 0) => { PE.cam = { x, y, z, r }; };
  PE.layer = (p, fn) => {
    const c = PE.ctx, { x, y, z, r } = PE.cam, W = PE.W, H = PE.H;
    c.save();
    c.translate(W / 2, H / 2);
    const s = Math.pow(z, p); c.scale(s, s); if (r) c.rotate(r * p);
    c.translate(-(W / 2 + (x - W / 2) * p), -(H / 2 + (y - H / 2) * p));
    fn();
    c.restore();
  };

  // ---------- scenes ----------
  PE.scene = (start, end, fn, opts = {}) => { PE.scenes.push({ start, end, fn, ...opts }); PE.duration = Math.max(PE.duration, end); };
  function sceneAt(t) {
    for (const s of PE.scenes) if (t >= s.start && t < s.end) return s;
    return t < PE.scenes[0].start ? PE.scenes[0] : PE.scenes[PE.scenes.length - 1];
  }
  PE._portal = null; PE._portalU = 0;
  // where a scene hosts a portal (phone screen, viewfinder, painting)
  PE.portalSlot = (x, y, w, h, fallback) => {
    const c = PE.ctx;
    if (PE._portal) {
      c.drawImage(PE._portal, x, y, w, h);
      return true;
    }
    if (fallback) fallback();
    return false;
  };
  function drawScene(s, lt, t) {
    PE._resetSeeds();
    PE.cam = { x: PE.W / 2, y: PE.H / 2, z: 1, r: 0 };
    const c = PE.ctx;
    c.save(); s.fn(lt, t); c.restore();
  }
  const bufs = [];
  function buf(i) {
    const w = Math.round(PE.W * PE.res), h = Math.round(PE.H * PE.res);
    if (!bufs[i] || bufs[i].width !== w || bufs[i].height !== h) { bufs[i] = document.createElement('canvas'); bufs[i].width = w; bufs[i].height = h; }
    return bufs[i];
  }
  function renderToBuf(s, lt, t, b) {
    const prev = PE.ctx, g = b.getContext('2d');
    g.setTransform(PE.res, 0, 0, PE.res, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, PE.W, PE.H);
    PE.ctx = g; drawScene(s, lt, t); PE.ctx = prev;
    return b;
  }
  function trWindow(tr) {
    const d = tr.dur || 1;
    if (tr.type === 'portal') return tr.dir === 'out' ? [tr.at, tr.until ?? tr.at + d] : [tr.at - d, tr.at];
    return [tr.at - d / 2, tr.at + d / 2];
  }
  const freezeCache = new Map();
  function blobPath(cx, cy, r, seed, u) {
    const p = new Path2D(), n = 120;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + 0.16 * Math.sin(3 * a + seed) + 0.1 * Math.sin(5 * a + seed * 2.1 + u * 2) + 0.07 * vnoise(a * 4 + seed * 3);
      const x = cx + Math.cos(a) * r * k, y = cy + Math.sin(a) * r * k;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
    return p;
  }
  function renderTransition(tr, t, g) {
    const W = PE.W, H = PE.H, d = tr.dur || 1;
    const from = sceneAt(tr.at - 1e-4), to = sceneAt(tr.at + 1e-4);
    if (tr.type === 'portal' && tr.dir !== 'out') {
      const b = renderToBuf(to, t - to.start, t, buf(0));
      const [rx, ry, rw] = tr.rect, Z = W / rw;
      const u = clamp((t - (tr.at - d)) / d), e = u * u * (1.6 - 0.6 * u);
      const z = Math.pow(Z, e), fx = (Z * rx) / (Z - 1), fy = (Z * ry) / (Z - 1);
      g.save(); g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
      PE._portal = b; PE._portalU = u;
      drawScene(from, t - from.start, t);
      PE._portal = null;
      g.restore();
      return;
    }
    if (tr.type === 'portal' && tr.dir === 'out') {
      let b;
      if (tr.freeze != null) {
        const key = PE.transitions.indexOf(tr) + '|' + PE.res;
        b = freezeCache.get(key);
        if (!b) {
          const fb = document.createElement('canvas'); fb.width = Math.round(W * PE.res); fb.height = Math.round(H * PE.res);
          const bt = PE.boilT; PE.boilT = from.start + tr.freeze;
          renderToBuf(from, tr.freeze, from.start + tr.freeze, fb);
          PE.boilT = bt;
          freezeCache.set(key, fb); b = fb;
        }
      } else b = renderToBuf(from, Math.min(t, tr.at + d) - from.start, t, buf(0));
      const [rx, ry, rw] = tr.rect, Z = W / rw;
      const u = clamp((t - tr.at) / d), e = 1 - Math.pow(1 - u, 2.4);
      const z = Math.pow(Z, 1 - e), fx = (Z * rx) / (Z - 1), fy = (Z * ry) / (Z - 1);
      g.save(); g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
      PE._portal = b; PE._portalU = u;
      drawScene(to, t - to.start, t);
      PE._portal = null;
      g.restore();
      return;
    }
    const u = clamp((t - (tr.at - d / 2)) / d);
    if (tr.type === 'bleed') {
      drawScene(from, t - from.start, t);
      const b = renderToBuf(to, t - to.start, t, buf(0));
      const mk = buf(1), mg = mk.getContext('2d');
      mg.setTransform(PE.res, 0, 0, PE.res, 0, 0); mg.globalCompositeOperation = 'source-over'; mg.clearRect(0, 0, W, H);
      const [cx, cy] = tr.center || [W / 2, H / 2];
      const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.35;
      const r = R * PE.ease.inOut(u), seed = tr.seed || 2;
      const p = blobPath(cx, cy, r, seed, u);
      mg.fillStyle = '#000'; mg.fill(p);
      // satellite drops
      for (let i = 0; i < 6; i++) {
        const a = hash(i + seed) * TAU, dd = r * (1.05 + hash(i * 3 + seed) * 0.3), rr = r * (0.12 + hash(i * 7) * 0.12);
        mg.beginPath(); mg.arc(cx + Math.cos(a) * dd, cy + Math.sin(a) * dd, rr, 0, TAU); mg.fill();
      }
      mg.globalCompositeOperation = 'source-in';
      mg.drawImage(b, 0, 0, W, H);
      mg.globalCompositeOperation = 'source-over';
      g.save();
      g.strokeStyle = tr.rim || 'rgba(30,20,60,0.35)'; g.lineWidth = 22; g.globalAlpha = 0.5 * (1 - u * 0.5);
      g.stroke(p);
      g.restore();
      g.drawImage(mk, 0, 0, W, H);
      g.save(); g.strokeStyle = tr.rim || 'rgba(30,20,60,0.35)'; g.lineWidth = 5; g.globalAlpha = 0.7 * (1 - u); g.stroke(p); g.restore();
      return;
    }
    if (tr.type === 'whip') {
      const A = renderToBuf(from, t - from.start, t, buf(0));
      const B = renderToBuf(to, t - to.start, t, buf(1));
      const e = PE.ease.inOut(u), v = 6 * u * (1 - u);
      const dir = tr.dir === 'right' ? -1 : 1;
      const offA = -dir * e * W, offB = dir * (1 - e) * W;
      const n = 6, spread = v * 140;
      for (const [img, off] of [[A, offA], [B, offB]]) {
        for (let k = n - 1; k >= 0; k--) {
          g.globalAlpha = k === 0 ? 1 : 0.22;
          g.drawImage(img, off + dir * k * spread * 0.5, 0, W, H);
        }
      }
      g.globalAlpha = 1;
      return;
    }
    drawScene(sceneAt(t), t - sceneAt(t).start, t);
  }
  // torn-sheet wipe: two sheets sweep up and cover the frame at wp.at
  function drawWipe(wp, t) {
    const d = wp.dur || 1, W = PE.W, H = PE.H;
    const u0 = clamp((t - (wp.at - d / 2)) / d), u = u0 + (wp.hold ?? 0.06) * Math.sin(TAU * u0);
    const Hs = H * 1.5, gap = H * 0.12, travel = H * 2.85;
    const cols = wp.colors || ['#ffc928', '#2a4bd7'];
    const yA = H * 1.05 - u * travel;
    PE._resetSeeds();
    [[yA, Hs + H * 0.24, 0], [yA + gap, Hs, 1]].forEach(([y, hh, k]) => {
      PE.R(W / 2, y + hh / 2, W * 1.15, hh, { color: cols[k], z: 3.2, seed: 500 + k * 7 + (wp.seed || 0), jag: 3, rot: k ? 0.012 : -0.015 });
      if (k === 1 && wp.word) PE.spray(wp.word, W / 2, y + hh / 2, { size: wp.wordSize || 230, color: wp.wordColor || '#fbf6ea', seed: 3, rot: -0.05 });
    });
  }
  function shake(t) {
    let x = 0, y = 0, r = 0;
    for (const im of PE.impacts) {
      const k = t - im.t; if (k < 0 || k > (im.dur || 0.4)) continue;
      const a = (im.amp || 16) * Math.exp(-k * 9);
      x += vnoise(k * 38 + im.t) * a; y += vnoise(k * 41 + im.t + 9) * a; r += vnoise(k * 30 + im.t + 3) * a * 0.0012;
    }
    return { x, y, r };
  }

  // ---------- render ----------
  function renderAt(t, g) {
    const W = PE.W, H = PE.H;
    g.setTransform(PE.res, 0, 0, PE.res, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#111'; g.fillRect(0, 0, W, H);
    PE.ctx = g; PE.t = t;
    const s = shake(t);
    g.translate(W / 2 + s.x, H / 2 + s.y); g.rotate(s.r); g.translate(-W / 2, -H / 2);
    let tr = null;
    for (const x of PE.transitions) { const [a, b] = trWindow(x); if (t >= a && t < b) { tr = x; break; } }
    if (tr && tr.type === 'portal' && tr.dir === 'out' && t >= tr.at + (tr.dur || 1)) {
      // hold: frozen previous scene keeps living inside the slot
      const to = sceneAt(tr.at + 1e-4);
      const key = PE.transitions.indexOf(tr) + '|' + PE.res;
      if (!freezeCache.get(key)) renderTransition(tr, tr.at, g);
      g.setTransform(PE.res, 0, 0, PE.res, 0, 0);
      g.translate(W / 2 + s.x, H / 2 + s.y); g.rotate(s.r); g.translate(-W / 2, -H / 2);
      PE._portal = freezeCache.get(key) || null;
      drawScene(to, t - to.start, t);
      PE._portal = null;
    } else if (tr) renderTransition(tr, t, g);
    else { const sc = sceneAt(t); drawScene(sc, t - sc.start, t); }
    for (const wp of PE.wipes) { const d = wp.dur || 1; if (t >= wp.at - d / 2 && t < wp.at + d / 2) drawWipe(wp, t); }
  }
  function overlay(g) {
    const W = PE.W, H = PE.H;
    g.setTransform(PE.res, 0, 0, PE.res, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.28;
    g.fillStyle = toothPat; g.fillRect(0, 0, W, H);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const v = g.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H / 2, H * 0.78);
    v.addColorStop(0, 'rgba(20,10,0,0)'); v.addColorStop(1, 'rgba(20,10,0,0.3)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  let sampleCv = null;
  PE.render = (t, samples = 1) => {
    const main = PE.mainCtx;
    PE.boilT = t;
    if (samples <= 1) renderAt(t, main);
    else {
      const w = Math.round(PE.W * PE.res), h = Math.round(PE.H * PE.res);
      if (!sampleCv || sampleCv.width !== w) { sampleCv = document.createElement('canvas'); sampleCv.width = w; sampleCv.height = h; }
      const sg = sampleCv.getContext('2d');
      for (let i = 0; i < samples; i++) {
        const ts = t + ((i + 0.5) / samples - 0.5) * (PE.shutter / PE.fps);
        renderAt(ts, sg);
        main.setTransform(1, 0, 0, 1, 0, 0);
        main.globalCompositeOperation = 'source-over';
        main.globalAlpha = 1 / (i + 1);
        main.drawImage(sampleCv, 0, 0);
      }
      main.globalAlpha = 1;
    }
    PE.ctx = main;
    overlay(main);
  };

  PE.init = (canvas, o = {}) => {
    PE.W = o.width || 1080; PE.H = o.height || 1920; PE.fps = o.fps || 30;
    PE.res = o.res || PE.res;
    PE.canvas = canvas;
    canvas.width = Math.round(PE.W * PE.res); canvas.height = Math.round(PE.H * PE.res);
    PE.mainCtx = canvas.getContext('2d');
    PE.ctx = PE.mainCtx;
    makeTextures(PE.mainCtx);
  };
  PE.setRes = (res) => {
    PE.res = res;
    PE.canvas.width = Math.round(PE.W * res); PE.canvas.height = Math.round(PE.H * res);
    sprayCache.clear(); cardCache.clear(); stampCache.clear(); freezeCache.clear();
  };
})();
