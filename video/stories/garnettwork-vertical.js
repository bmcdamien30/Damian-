// @headline GarnettWork: How <span>Market Memory</span> Is Made
// @sources Vertical 9:16 cut of the 16:9 presentation, same timing and soundtrack. Content follows the GarnettWork site in this repository (index.html): the evidence pipeline listing → identity → market evidence → decision → receipt → outcome → Market Memory, the PASS / FAIL / REFUSE truth vocabulary, and "every outcome feeds back into Market Memory, sharpening future evidence." The PS5 numbers are the site's illustrative development fixture, labeled EXAMPLE on screen. Soundtrack synthesized from code.
// @aspect 9 / 16
// @maxw 460px
// @asset lion assets/garnettwork-lion.webp
// @audio out/garnettwork.m4a

PE.init(canvas, { width: 1080, height: 1920, fps: 30 });
PE.jag = 2.2; PE.fringe = 3.4;
const W = 1080, H = 1920;
const LION = await PE.loadImage(ASSETS.lion);

const K = {
  wall: '#17161b', wall2: '#221f27', gold: '#d4af37', goldL: '#f1d67a', goldD: '#9c7a1c',
  paper: '#fbf6ea', note: '#fbf9f1', ink: '#1d1a22', pass: '#2a9d55', fail: '#e0452f', refuse: '#e89a1a',
  kraft: '#c99a5b', kraftD: '#a77c43', tape: '#e8dcb6', grey: '#9aa0b0', slate: '#2b2a31', blue: '#2a4bd7',
};
const { map, clamp, lerp, ease, spring, wob, pop } = PE;
const TAU = Math.PI * 2;

// timeline: identical to the 16:9 cut (96 BPM, one bar = 2.5 s) so the soundtrack lines up
const S = [0, 5, 10, 15, 20, 25, 30, 33];
PE.music = { bpm: 96, beatIn: 2.5, finalHit: 30.0, length: 33.0, chords: ['Am9', 'Fmaj7', 'Dm9', 'E7'] };
PE.sfx = [];
const cue = (s, lt, type, o = {}) => PE.sfx.push({ t: +(s + lt).toFixed(3), type, ...o });

PE.wipes = [{ at: S[1], dur: 0.9, colors: [K.gold, K.note], seed: 2 }];
PE.transitions = [
  { at: S[2], type: 'rip', dur: 0.75, dir: 'left' },
  { at: S[3], type: 'rip', dur: 0.75, dir: 'right' },
  { at: S[4], type: 'rip', dur: 0.75, dir: 'left' },
  { at: S[5], type: 'rip', dur: 0.75, dir: 'right' },
  { at: S[6], type: 'bleed', dur: 1.0, center: [540, 900], rim: 'rgba(212,175,55,0.8)', seed: 4 },
];
PE.impacts = [{ t: S[1] + 3.9, amp: 8 }, { t: S[3] + 2.3, amp: 16 }, { t: S[4] + 3.7, amp: 8 }, { t: S[6] + 0.2, amp: 10 }];

// ---------- set pieces ----------
function wall(lt) {
  PE.bg(K.wall);
  PE.splat(150, 1700, 80, { color: K.gold, alpha: 0.2, seed: 1, n: 60 });
  PE.splat(950, 120, 60, { color: K.paper, alpha: 0.12, seed: 2, n: 50 });
  PE.splat(980, 1820, 40, { color: K.gold, alpha: 0.18, seed: 3 });
  PE.sprayLine([[60, 1840], [200, 1800], [330, 1850]], { width: 14, color: K.gold, alpha: 0.2, seed: 4, drips: 3 });
  PE.confetti(lt, { n: 12, seed: 31, colors: [K.gold, K.paper, K.goldL], alpha: 0.55 });
}
const NODES = ['LISTING', 'IDENTITY', 'EVIDENCE', 'DECISION', 'RECEIPT', 'OUTCOME', 'MEMORY'];
function strip(lt, active, done) {
  PE.R(540, 212, 1010, 150, { color: K.tape, z: 1.2, seed: 41, jag: 1.6, rot: -0.006 });
  NODES.forEach((n, i) => {
    const row = i < 4 ? 0 : 1, k = row ? i - 4 : i, per = row ? 3 : 4;
    const slot = 960 / 4, x0 = 60 + (4 - per) * slot / 2;
    const cx = x0 + slot * (k + 0.5), y = row ? 250 : 178;
    const on = active.includes(i), was = i < done;
    if (on) {
      const m = PE.measure(n, 'head', 26), a = active.indexOf(i);
      PE.sprayLine([[cx - m.w / 2 - 14, y + 2], [cx + m.w / 2 + 14, y - 1]], { width: 38, color: K.gold, progress: map(lt, 0.15 + a * 0.5, 0.45 + a * 0.5), seed: 50 + i });
    }
    PE.text(n, cx, y + 2, { size: 26, color: K.ink, alpha: on || was ? 1 : 0.38 });
    if (was && !on) PE.line([[cx - 40, y + 22], [cx + 40, y + 20]], { width: 4, color: K.goldD, seed: 60 + i });
    if (k < per - 1) {
      const ax = x0 + slot * (k + 1);
      PE.line([[ax - 8, y - 10], [ax + 4, y], [ax - 8, y + 10]], { width: 4, color: K.ink, seed: 70 + i, wobble: 0.5 });
    }
  });
  // the pipeline wraps to the second row
  PE.line([[1000, 182], [1022, 214], [1000, 246]], { width: 4, color: K.ink, seed: 79, wobble: 0.5, alpha: 0.6 });
}
function page(o = {}) {
  PE.R(540, 950, 1010, 1250, {
    color: K.note, z: 2.6, rot: o.rot ?? -0.006, seed: o.seed || 7, jag: 1.4,
    lined: { gap: 46, top: 112, margin: 110, holes: 4, holeX: 40, holeR: 15, holeColor: K.wall },
  });
  tape(170, 336, -0.34, 77, 170); tape(910, 336, 0.3, 78, 170);
}
function tape(x, y, rot, seed, w = 190) {
  PE.R(x, y, w, 52, { color: K.tape, z: 0.8, rot, seed, fringe: 0, jag: 2.2, alpha: 0.92 });
}
function sprayWord(word, lt, t0, x, y, o = {}) {
  const dur = o.dur || 0.45, p = map(lt, t0, t0 + dur);
  if (p <= 0) return;
  const size = o.size || 110;
  PE.spray(word, x, y, { size, color: o.color || K.ink, progress: p, seed: o.seed || 2, rot: o.rot ?? -0.02, drips: o.drips ?? 1 });
  if (p < 1) {
    const m = PE.measure(word, 'stencil', size), ex = x - m.w / 2 + p * m.w, c = PE.ctx;
    c.save(); c.fillStyle = o.color || K.ink;
    for (let i = 0; i < 6; i++) {
      const a = PE.hash(i + Math.floor(lt * 30)) * TAU;
      c.globalAlpha = 0.15; c.beginPath(); c.arc(ex + Math.cos(a) * 26, y + Math.sin(a) * size * 0.3, size * (0.15 + PE.hash(i * 3.1) * 0.3), 0, TAU); c.fill();
    }
    c.restore();
  }
}
function hand(text, x, y, lt, t0, o = {}) {
  const p = map(lt, t0, t0 + (o.dur || 0.5)); if (p <= 0) return;
  const size = o.size || 42, c = PE.ctx, m = PE.measure(text, 'hand', size);
  const x0 = o.align === 'center' ? x - m.w / 2 : x;
  c.save(); c.translate(x0, y); c.rotate(o.rot || 0);
  c.beginPath(); c.rect(-10, -size, (m.w + 20) * p, size * 2); c.clip();
  PE.text(text, 0, 0, { font: 'hand', size, color: o.color || K.ink, align: 'left' });
  c.restore();
}
function sprayArrow(pts, lt, t0, o = {}) {
  const p = map(lt, t0, t0 + (o.dur || 0.45)); if (p <= 0) return;
  const col = o.color || K.gold, w = o.width || 16;
  PE.sprayLine(pts, { width: w, color: col, progress: p, seed: o.seed || 9 });
  if (p >= 1) {
    const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const hp = map(lt, t0 + (o.dur || 0.45), t0 + (o.dur || 0.45) + 0.12);
    for (const s of [-1, 1]) {
      const q = [b[0] - Math.cos(ang + s * 0.55) * 46, b[1] - Math.sin(ang + s * 0.55) * 46];
      PE.sprayLine([b, q], { width: w, color: col, progress: hp, seed: (o.seed || 9) + s });
    }
  }
}
function can(x, y, rot, color, seed) {
  const c = PE.ctx; c.save(); c.translate(x, y); c.rotate(rot);
  PE.R(0, 0, 92, 190, { color, z: 2.6, r: 16, seed });
  PE.R(0, 10, 92, 50, { color: K.paper, z: 0, seed: seed + 1, fringe: 0 });
  PE.text('PAINT', 0, 12, { size: 18, color: K.ink });
  PE.R(0, -112, 70, 36, { color: color === K.paper ? K.grey : K.paper, z: 2.6, r: 8, seed: seed + 2 });
  PE.R(-28, -128, 22, 16, { color: K.ink, z: 2.6, r: 4, seed: seed + 3 });
  c.restore();
}
function priceTag(x, y, text, rot, s, color, seed, hole = K.wall) {
  if (s <= 0.01) return;
  const c = PE.ctx; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  PE.P([[-70, -32], [60, -32], [60, 32], [-70, 32], [-96, 0]], { color: color || K.paper, z: 1.6, seed });
  PE.C(-70, 0, 7, { color: hole, z: 0, seed: seed + 1, fringe: 0, bevel: 0 });
  PE.text(text, 0, 2, { size: 30, color: K.ink });
  c.restore();
}
function cardboxObj(x, y, w, h, s, seed) {
  if (s <= 0.01) return;
  const c = PE.ctx; c.save(); c.translate(x, y); c.scale(s, s);
  PE.R(0, 0, w, h, { color: K.kraft, z: 2, seed, r: 6 });
  PE.R(0, -h / 2 + 14, w, 28, { color: K.kraftD, z: 0, seed: seed + 1, fringe: 0 });
  PE.R(0, -h / 2 + 14, 60, 30, { color: K.tape, z: 0.3, seed: seed + 2, fringe: 0 });
  PE.R(0, 18, w * 0.7, h * 0.36, { color: K.paper, z: 0.6, seed: seed + 3, r: 4 });
  PE.text('PS5 DISC', 0, 8, { size: w * 0.085, color: K.ink });
  PE.text('825GB', 0, 8 + w * 0.09, { size: w * 0.07, color: K.ink });
  c.restore();
}
function magnifier(x, y, rot, s) {
  if (s <= 0.01) return;
  const c = PE.ctx; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  PE.R(0, 160, 34, 140, { color: '#7a4a2a', z: 3, r: 12, seed: 201 });
  PE.C(0, 0, 96, { color: K.slate, z: 3, seed: 202 });
  PE.C(0, 0, 78, { color: 'rgba(210,240,255,0.32)', z: 0, seed: 203, fringe: 0, bevel: 0.6 });
  c.restore();
}
function stampObj(x, y, label, color, s, seed) {
  if (s <= 0.01) return;
  const c = PE.ctx; c.save(); c.translate(x, y); c.scale(s, s);
  PE.C(0, -104, 34, { color: '#7a4a2a', z: 2.6, seed });
  PE.R(0, -56, 30, 70, { color: '#8a5a32', z: 2.4, seed: seed + 1, r: 8 });
  PE.R(0, 0, 190, 48, { color: '#5b3a22', z: 2.4, seed: seed + 2, r: 6 });
  PE.R(0, 34, 176, 24, { color, z: 1, seed: seed + 3, r: 4 });
  PE.text(label, 0, 2, { size: 30, color: K.paper });
  c.restore();
}
function pencil(x, y, rot, seed) {
  const c = PE.ctx; c.save(); c.translate(x, y); c.rotate(rot);
  PE.P([[0, 0], [34, -16], [34, 16]], { color: '#f3d9a8', z: 2, seed });
  PE.P([[0, 0], [11, -5], [11, 5]], { color: K.ink, z: 0, seed: seed + 1, fringe: 0 });
  PE.R(144, 0, 220, 32, { color: K.gold, z: 2, seed: seed + 2 });
  PE.R(266, 0, 30, 32, { color: '#f08aa8', z: 2, seed: seed + 3, r: 6 });
  c.restore();
}
function cap(t, a, b, o = {}) {
  PE.caption(t, o.lt, a, b, { y: o.y ?? 1490, size: 46, bg: K.ink, color: K.paper, hl: K.gold, maxW: 960 });
}
// a stencil word sprayed across two lines, one after the other
function spray2(l1, l2, lt, t0, t1, x, y1, y2, o) {
  const mid = (t0 + t1) / 2;
  sprayWord(l1, lt, t0, x, y1, { ...o, dur: mid - t0 });
  sprayWord(l2, lt, mid, x, y2, { ...o, dur: t1 - mid, seed: (o.seed || 2) + 1 });
}

// ======================= 1. TITLE =======================
PE.scene(S[0], S[1], (lt) => {
  wall(lt);
  priceTag(850, 210, '$260?', 0.25 + wob(lt, 0.3, 0.03), 1.3, K.paper, 301);
  PE.C(784, 180, 10, { color: K.fail, z: 1.5, seed: 302 });
  priceTag(900, 1640, '$295', -0.18 + wob(lt, 0.25, 0.03, 1), 1.05, K.goldL, 303);
  priceTag(200, 250, '$255', 0.2 + wob(lt, 0.28, 0.03, 2), 1.05, K.paper, 305);
  PE.C(128, 238, 10, { color: K.gold, z: 1.5, seed: 306 });
  pencil(640, 1760, -0.18, 304);
  const ls = pop(lt, 0.25, { f: 2.2, damp: 0.42 });
  if (ls > 0.01) PE.image(LION, 540, 500, 440, 400, { sticker: true, rot: -0.04, scale: lerp(1.6, 1, Math.min(1, ls)), alpha: clamp(ls * 3) });
  // GARNETT / WORK sprayed by a can that follows the reveal edge, line by line
  const size = 250, l1 = 900, l2 = 1110;
  const w1 = PE.measure('GARNETT', 'stencil', size).w, w2 = PE.measure('WORK', 'stencil', size).w;
  const p1 = map(lt, 0.95, 1.6), p2 = map(lt, 1.65, 2.15);
  PE.spray('GARNETT', 540, l1, { size, color: K.gold, progress: p1, seed: 11 });
  PE.spray('WORK', 540, l2, { size, color: K.gold, progress: p2, seed: 13 });
  if (lt > 0.5 && lt < 2.6) {
    let ex, ey, active = false;
    if (lt < 0.95) { ex = lerp(1300, 540 - w1 / 2, ease.out(map(lt, 0.5, 0.95))); ey = l1; }
    else if (lt < 1.6) { ex = 540 - w1 / 2 + p1 * w1; ey = l1; active = true; }
    else if (lt < 1.65) { const u = ease.inOut(map(lt, 1.6, 1.65)); ex = lerp(540 + w1 / 2, 540 - w2 / 2, u); ey = lerp(l1, l2, u); }
    else if (lt < 2.15) { ex = 540 - w2 / 2 + p2 * w2; ey = l2; active = true; }
    else { const u = ease.in(map(lt, 2.15, 2.6)); ex = lerp(540 + w2 / 2, 1400, u); ey = lerp(l2, 700, u); }
    const cx = ex + 120, cy = ey - 220;
    if (active) {
      const c = PE.ctx; c.save(); c.fillStyle = K.gold;
      for (let i = 0; i < 7; i++) { const u = i / 6; c.globalAlpha = 0.16; c.beginPath(); c.arc(lerp(cx - 75, ex, u) + PE.noise(lt * 20 + i) * 10, lerp(cy - 100, ey, u), 14 + u * 60, 0, TAU); c.fill(); }
      c.restore();
    }
    can(cx, cy, -0.5 + wob(lt, 3, 0.05), K.gold, 310);
  }
  const ns = pop(lt, 2.3, { f: 2.4, damp: 0.45 });
  if (ns > 0.01) {
    const c = PE.ctx; c.save(); c.translate(540, 1290); c.rotate(-0.015); c.scale(ns, ns);
    PE.R(0, 0, 900, 100, { color: K.note, z: 1.8, seed: 320, lined: { gap: 46, top: 27 } });
    c.restore();
    hand('Truth before money moves.', 540, 1306, lt, 2.4, { size: 54, align: 'center', dur: 0.6, rot: -0.015 });
  }
  spray2('HOW MARKET MEMORY', 'IS MADE', lt, 3.05, 3.65, 540, 1440, 1535, { size: 84, color: K.paper, seed: 12 });
  can(130, 1820, -0.08, K.ink, 330); can(240, 1840, 0.06, K.paper, 334); can(350, 1825, -0.04, K.gold, 338);
});
cue(S[0], 0.0, 'rattle', { dur: 0.5 });
cue(S[0], 0.25, 'slap');
cue(S[0], 0.95, 'spray', { dur: 1.2 });
cue(S[0], 2.3, 'pop');
cue(S[0], 2.4, 'marker', { dur: 0.6 });
cue(S[0], 3.05, 'spray', { dur: 0.6, gain: 0.8 });
cue(S[0], 4.55, 'whoosh', { dur: 0.6 });

// ======================= 2. LISTING + IDENTITY =======================
PE.scene(S[1], S[2], (lt) => {
  if (!PE._noWall) { wall(lt); strip(lt, lt < 2.2 ? [0] : [0, 1], 0); }
  page({ seed: 101 });
  sprayWord('1. LISTING', lt, 0.2, 320, 455, { size: 80, seed: 21 });
  sprayWord('2. IDENTITY', lt, 2.2, 780, 455, { size: 80, seed: 22 });
  const ps = spring(lt, 0.35, { f: 2, damp: 0.5 });
  const c = PE.ctx;
  c.save(); c.translate(300, 800); c.rotate(-0.04); c.scale(ps, ps); c.translate(-300, -800);
  PE.phone(150, 545, 300, 520, {
    screen: '#ffffff', z: 2.6, content: (x, y, w) => {
      PE.text('LISTING', x + w / 2, y + 30, { size: 18, color: K.grey });
      PE.R(x + w / 2, y + 160, w - 30, 190, { color: '#eef0f3', z: 0, seed: 111, fringe: 0, bevel: 0 });
      cardboxObj(x + w / 2, y + 165, 170, 130, 1, 112);
      PE.text('PS5 Disc Edition', x + 18, y + 290, { size: 24, color: K.ink, align: 'left' });
      PE.text('825GB', x + 18, y + 322, { size: 24, color: K.ink, align: 'left' });
      PE.text('$260', x + 18, y + 385, { size: 54, color: K.ink, align: 'left' });
      const pressed = lt > 1.25 && lt < 1.4;
      PE.R(x + w / 2, y + 465, w - 40, 56, { color: K.gold, z: pressed ? 0.1 : 0.8, r: 10, seed: 113, sx: pressed ? 0.95 : 1, sy: pressed ? 0.95 : 1 });
      PE.text('Check This Listing', x + w / 2, y + 467, { size: 21, color: K.ink });
    },
  });
  c.restore();
  if (lt > 1.25 && lt < 1.7) { c.save(); c.strokeStyle = K.gold; c.lineWidth = 5; c.globalAlpha = 1 - map(lt, 1.25, 1.7); c.beginPath(); c.arc(300, 1010, 20 + (lt - 1.25) * 160, 0, TAU); c.stroke(); c.restore(); }
  PE.label('EXAMPLE', 420, 560, { size: 22, bg: K.ink, color: K.paper, rot: 0.12, scale: pop(lt, 0.7), z: 1.4 });
  hand('paste it in', 160, 1160, lt, 0.8, { size: 42, rot: -0.04 });
  sprayArrow([[470, 900], [560, 830], [600, 740]], lt, 1.5, { seed: 23 });
  // identity check
  const bs = pop(lt, 2.4, { f: 2.2, damp: 0.45 });
  cardboxObj(790, 650, 270, 200, bs, 120);
  magnifier(790 + wob(lt, 0.6, 45) + 20, 620 + wob(lt, 0.5, 26, 0.2), -0.5, pop(lt, 2.6) * 0.9);
  const checks = ['right model?', 'right revision?', 'right bundle?'];
  checks.forEach((tx, i) => {
    const t0 = 2.8 + i * 0.32, y = 860 + i * 92;
    hand(tx, 560, y, lt, t0, { size: 40, dur: 0.3 });
    if (lt > t0 + 0.3) PE.sprayLine([[930, y - 6], [950, y + 14], [986, y - 30]], { width: 12, color: K.pass, progress: map(lt, t0 + 0.3, t0 + 0.42), seed: 130 + i });
  });
  PE.stamp('IDENTITY VERIFIED', 560, 1290, lt, 3.9, { color: K.pass, size: 84, rot: -0.06 });
  cap('Paste a secondhand *listing*.', 0.4, 2.3, { lt });
  cap('Is it really *what the seller claims*?', 2.5, 4.85, { lt });
});
cue(S[1], 0.2, 'spray', { dur: 0.45, gain: 0.7 });
cue(S[1], 0.4, 'pop');
cue(S[1], 0.8, 'marker', { dur: 0.5 });
cue(S[1], 1.27, 'click');
cue(S[1], 1.5, 'spray', { dur: 0.45, gain: 0.6 });
cue(S[1], 2.2, 'spray', { dur: 0.45, gain: 0.7 });
cue(S[1], 2.4, 'pop');
cue(S[1], 2.6, 'whoosh', { dur: 0.3, gain: 0.5 });
[2.8, 3.12, 3.44].forEach((t) => { cue(S[1], t, 'marker', { dur: 0.3, gain: 0.8 }); cue(S[1], t + 0.3, 'spray', { dur: 0.12, gain: 0.5 }); });
cue(S[1], 3.9, 'stamp');

// ======================= 3. MARKET EVIDENCE =======================
const COMPS = [262, 271, 289, 258, 295, 276, 284, 266, 291, 255, 279, 268, 287, 273, 260, 282, 270, 293];
PE.scene(S[2], S[3], (lt) => {
  if (!PE._noWall) { wall(lt); strip(lt, [2], 2); }
  page({ seed: 102, rot: 0.004 });
  sprayWord('3. MARKET EVIDENCE', lt, 0.2, 560, 455, { size: 80, seed: 31 });
  hand('comparable listings', 170, 570, lt, 0.4, { size: 38, color: K.blue });
  COMPS.forEach((v, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const s = pop(lt, 0.5 + i * 0.07, { f: 2.6, damp: 0.45 });
    priceTag(250 + col * 145, 650 + row * 82, '$' + v, (PE.hash(i) - 0.5) * 0.3 + wob(lt, 0.4, 0.015, i), s * 0.78, i % 4 === 0 ? K.goldL : K.paper, 400 + i * 3, K.note);
  });
  // tally to 41
  const n = Math.floor(clamp(map(lt, 0.6, 2.4)) * 41);
  for (let k = 0; k < n; k++) {
    const g = Math.floor(k / 5), j = k % 5, gx = 700 + (g % 2) * 150, gy = 660 + Math.floor(g / 2) * 96;
    if (j < 4) PE.line([[gx + j * 20, gy - 36], [gx + j * 20 + 3, gy + 36]], { width: 6, color: K.ink, seed: k, wobble: 1.5 });
    else PE.line([[gx - 12, gy + 24], [gx + 86, gy - 24]], { width: 6, color: K.fail, seed: k, wobble: 1.5 });
  }
  sprayWord('41 COMPS', lt, 2.5, 820, 1150, { size: 84, color: K.goldD, seed: 32 });
  const y = 1300, x0 = 190, x1 = 960, X = (v) => lerp(x0, x1, (v - 240) / 70);
  PE.line([[x0, y], [x1, y]], { width: 5, color: K.ink, progress: map(lt, 2.9, 3.2), seed: 501 });
  [240, 250, 260, 270, 280, 290, 300, 310].forEach((v, i) => {
    if (lt < 3.0 + i * 0.03) return;
    PE.line([[X(v), y - 14], [X(v), y + 14]], { width: 4, color: K.ink, seed: 510 + i });
    PE.text('$' + v, X(v), y + 42, { font: 'hand', size: 26, color: K.ink });
  });
  PE.sprayLine([[X(255), y], [X(295), y]], { width: 30, color: K.gold, progress: map(lt, 3.3, 3.75), seed: 520, drips: 4 });
  hand('fair range $255 to $295', X(255) - 20, y - 50, lt, 3.8, { size: 36, color: K.ink });
  PE.label('EXAMPLE', 260, 1150, { size: 22, bg: K.ink, color: K.paper, rot: -0.1, scale: pop(lt, 3.9), z: 1.4 });
  cap('Then it checks *comparable listings*.', 0.4, 2.4, { lt });
  cap('A counted sample, *not a rough guess*.', 2.6, 4.85, { lt });
});
cue(S[2], 0.0, 'rip');
cue(S[2], 0.2, 'spray', { dur: 0.45, gain: 0.7 });
cue(S[2], 0.4, 'marker', { dur: 0.45, gain: 0.7 });
COMPS.forEach((v, i) => { if (i % 2 === 0) cue(S[2], 0.5 + i * 0.07, 'pop', { gain: 0.45, pitch: 0.9 + (i % 5) * 0.06 }); });
cue(S[2], 0.6, 'pencil', { dur: 1.8 });
cue(S[2], 2.5, 'spray', { dur: 0.45, gain: 0.7 });
cue(S[2], 3.3, 'spray', { dur: 0.45, gain: 0.8 });
cue(S[2], 3.8, 'marker', { dur: 0.5, gain: 0.8 });

// ======================= 4. DECISION =======================
PE.scene(S[3], S[4], (lt) => {
  if (!PE._noWall) { wall(lt); strip(lt, [3], 3); }
  page({ seed: 103 });
  sprayWord('4. DECISION', lt, 0.2, 420, 455, { size: 80, seed: 41 });
  const rows = [['PASS', K.pass, '= evidence supports the price'], ['FAIL', K.fail, '= evidence contradicts it'], ['REFUSE', K.refuse, '= not enough evidence']];
  rows.forEach(([w, col, d], i) => {
    const t0 = 0.45 + i * 0.4, y = 820 + i * 100;
    hand(w, 170, y, lt, t0, { size: 46, color: col, dur: 0.18 });
    hand(d, 170 + PE.measure(w, 'hand', 46).w + 18, y, lt, t0 + 0.15, { size: 32, dur: 0.3 });
  });
  hand('it will not guess.', 180, 1110, lt, 1.7, { size: 40, color: K.refuse, rot: -0.03 });
  const slots = [[300, 640], [540, 640], [780, 640]];
  const lift = map(lt, 1.6, 2.15), back = map(lt, 2.55, 3.0);
  const target = [790, 1130];
  rows.slice(1).forEach(([w, col], k) => stampObj(slots[k + 1][0], slots[k + 1][1], w, col, pop(lt, 0.4 + k * 0.1) * 0.95, 605 + k * 5));
  PE.stamp('PASS', target[0], target[1] + 40, lt, 2.3, { color: K.pass, size: 120, rot: -0.08 });
  {
    let [x, yy] = slots[0], s = pop(lt, 0.3) * 0.95;
    if (lt > 1.6 && lt < 2.3) { x = lerp(x, target[0], ease.inOut(lift)); yy = lerp(yy, target[1] - 150, ease.inOut(lift)) + (lt > 2.15 ? ease.in(map(lt, 2.15, 2.3)) * 120 : 0); s *= 1.12; }
    else if (lt >= 2.3 && lt < 3.0) { x = lerp(target[0], slots[0][0], ease.inOut(back)); yy = lerp(target[1] - 30, slots[0][1], ease.inOut(back)); }
    stampObj(x, yy, 'PASS', K.pass, s, 600);
  }
  sprayWord('MAX SAFE BUY $280', lt, 2.95, 540, 1310, { size: 76, color: K.goldD, seed: 42, dur: 0.5 });
  hand('asking $260, under the max', 540, 1390, lt, 3.5, { size: 34, color: K.ink, align: 'center' });
  cap('Three results. *No hedging.*', 0.4, 2.4, { lt });
  cap('No evidence, *no confident answer*.', 2.6, 4.85, { lt, y: 1500 });
});
cue(S[3], 0.0, 'rip');
cue(S[3], 0.2, 'spray', { dur: 0.45, gain: 0.7 });
[0.45, 0.85, 1.25].forEach((t) => cue(S[3], t, 'marker', { dur: 0.45, gain: 0.8 }));
cue(S[3], 1.7, 'marker', { dur: 0.5, gain: 0.7 });
cue(S[3], 1.6, 'whoosh', { dur: 0.5, gain: 0.5 });
cue(S[3], 2.3, 'stamp', { gain: 1.2 });
cue(S[3], 2.95, 'spray', { dur: 0.5, gain: 0.8 });
cue(S[3], 3.45, 'ding');
cue(S[3], 3.5, 'marker', { dur: 0.5, gain: 0.6 });

// ======================= 5. RECEIPT + OUTCOME =======================
const RECEIPT = ['GARNETTWORK RECEIPT', 'item: PS5 Disc 825GB', 'verified comps: 41', 'fair range: $255-$295', 'max safe buy: $280', 'verdict: PASS', '(example)'];
PE.scene(S[4], S[5], (lt) => {
  if (!PE._noWall) { wall(lt); strip(lt, lt < 2.5 ? [4] : [4, 5], 4); }
  page({ seed: 104, rot: 0.003 });
  sprayWord('5. RECEIPT', lt, 0.2, 320, 455, { size: 80, seed: 51 });
  sprayWord('6. OUTCOME', lt, 2.5, 780, 455, { size: 80, seed: 52 });
  const c = PE.ctx, rx = 330, ry0 = 600, hgt = 540 * ease.outQuad(map(lt, 0.5, 2.2)), rw = 340;
  if (hgt > 4) {
    const pts = [[rx - rw / 2, ry0], [rx + rw / 2, ry0], [rx + rw / 2, ry0 + hgt]];
    for (let i = 0; i <= 12; i++) pts.push([rx + rw / 2 - (i * rw) / 12, ry0 + hgt + (i % 2 ? 12 : 0)]);
    PE.P(pts, { color: '#ffffff', z: 1.8, seed: 701, fringe: 0.6 });
    c.save(); c.beginPath(); c.rect(rx - rw / 2, ry0, rw, hgt); c.clip();
    RECEIPT.forEach((l, i) => PE.text(l, rx - rw / 2 + 20, ry0 + 50 + i * 66, { size: i ? 21 : 20, color: i === 5 ? K.pass : K.ink, align: 'left' }));
    PE.line([[rx - rw / 2 + 16, ry0 + 82], [rx + rw / 2 - 16, ry0 + 82]], { width: 3, color: K.ink, seed: 702, wobble: 0.3 });
    c.restore();
  }
  PE.R(rx, 572, 380, 80, { color: K.slate, z: 3, r: 14, seed: 703 });
  PE.R(rx, 598, 330, 12, { color: K.ink, z: 0, seed: 704, fringe: 0 });
  PE.C(rx + 150, 562, 9, { color: lt > 0.5 && lt < 2.2 && (lt * 6) % 1 < 0.5 ? K.pass : '#555', z: 0, seed: 705, fringe: 0 });
  hand('the evidence behind', 160, 1235, lt, 1.4, { size: 36, color: K.blue, rot: -0.03 });
  hand('the decision', 180, 1285, lt, 1.75, { size: 36, color: K.blue, rot: -0.03 });
  sprayArrow([[510, 1120], [600, 1150], [640, 1080]], lt, 2.3, { seed: 53 });
  const cs = pop(lt, 2.6, { f: 2.2, damp: 0.45 });
  if (cs > 0.01) {
    c.save(); c.translate(790, 800); c.rotate(0.03 + wob(lt, 0.3, 0.01)); c.scale(cs, cs);
    PE.R(0, 0, 380, 500, { color: '#8a5a32', z: 2.4, r: 18, seed: 710 });
    PE.R(0, 20, 336, 436, { color: K.note, z: 0.8, seed: 711, lined: { gap: 46, top: 90 } });
    PE.R(0, -234, 150, 52, { color: '#c0c4cc', z: 2.6, r: 10, seed: 712 });
    PE.text('OUTCOME', 0, -150, { size: 38, color: K.ink });
    c.restore();
    hand('what actually', 640, 740, lt, 3.0, { size: 36 });
    hand('happened after', 640, 820, lt, 3.25, { size: 36 });
    hand('the decision', 640, 900, lt, 3.5, { size: 36 });
  }
  PE.stamp('RECORDED', 800, 985, lt, 3.75, { color: K.goldD, size: 74, rot: -0.1 });
  cap('Every decision gets a *receipt*: the evidence behind it.', 0.4, 2.4, { lt, y: 1505 });
  cap('Then the *outcome* is recorded.', 2.6, 4.85, { lt });
});
cue(S[4], 0.0, 'rip');
cue(S[4], 0.2, 'spray', { dur: 0.45, gain: 0.7 });
cue(S[4], 0.5, 'printer', { dur: 1.7 });
cue(S[4], 1.4, 'marker', { dur: 0.7, gain: 0.6 });
cue(S[4], 2.3, 'spray', { dur: 0.5, gain: 0.6 });
cue(S[4], 2.5, 'spray', { dur: 0.45, gain: 0.7 });
cue(S[4], 2.6, 'slap', { gain: 0.6 });
cue(S[4], 3.0, 'marker', { dur: 0.8, gain: 0.8 });
cue(S[4], 3.75, 'stamp', { gain: 0.8 });

// ======================= 6. MARKET MEMORY =======================
const ITEMS = [[-1, 0.35], [1, 0.6], [-1, 0.85], [1, 1.1], [-1, 1.35], [1, 1.6], [-1, 1.85], [1, 2.1]];
PE.scene(S[5], S[6], (lt) => {
  if (!PE._noWall) { wall(lt); strip(lt, [6], 6); }
  page({ seed: 105 });
  sprayWord('7. MARKET MEMORY', lt, 0.2, 560, 455, { size: 84, seed: 61 });
  PE.sprayLine([[250, 515], [870, 510]], { width: 18, color: K.gold, progress: map(lt, 0.65, 0.95), seed: 62 });
  const c = PE.ctx, bx = 540;
  PE.R(bx, 828, 540, 66, { color: K.kraftD, z: 1.6, rot: -0.06, seed: 801 });
  PE.R(bx, 935, 500, 160, { color: '#8f6a38', z: 1, seed: 802 });
  ITEMS.forEach(([side, t0], i) => {
    const u = map(lt, t0, t0 + 0.55); if (u <= 0 || u >= 1) return;
    const sx = side < 0 ? 150 : 930, sy = 640 + (i % 3) * 70, ex = bx + (i % 4 - 1.5) * 70, ey = 990;
    const x = lerp(sx, ex, ease.out(u)), y = lerp(sy, ey, u) - Math.sin(u * Math.PI) * 220;
    c.save(); c.translate(x, y); c.rotate(side * (1 - u) * 1.2 + u * 0.1);
    if (i % 2) { PE.R(0, 0, 90, 130, { color: '#ffffff', z: 2.2, seed: 810 + i }); for (let j = 0; j < 4; j++) PE.R(0, -36 + j * 22, 60, 6, { color: K.grey, z: 0, seed: 830 + j, fringe: 0 }); }
    else priceTag(0, 0, ['PASS', 'FAIL', 'REFUSE', 'PASS'][(i / 2) | 0], 0, 0.8, [K.pass, K.fail, K.refuse, K.pass][(i / 2) | 0], 850 + i * 3, K.note);
    c.restore();
  });
  PE.R(bx, 1060, 540, 280, { color: K.kraft, z: 2.4, seed: 803 });
  PE.R(bx, 1065, 430, 116, { color: K.paper, z: 0.8, seed: 804, r: 6 });
  PE.text('MARKET MEMORY', bx, 1072, { font: 'stencil', size: 70, color: K.ink });
  const count = Math.min(8, ITEMS.filter(([, t0]) => lt > t0 + 0.55).length);
  if (count) PE.text('+' + count, bx + 215, 965, { font: 'hand', size: 42, color: K.goldD, rot: 0.1 });
  hand('decisions +', 160, 600, lt, 0.4, { size: 40, color: K.blue });
  hand('outcomes', 180, 650, lt, 0.6, { size: 40, color: K.blue });
  sprayArrow([[250, 690], [250, 790], [300, 880]], lt, 0.9, { seed: 63, color: K.blue, width: 14 });
  sprayArrow([[790, 880], [850, 780], [850, 700]], lt, 2.5, { seed: 64, width: 18 });
  hand('sharper', 700, 600, lt, 2.95, { size: 44, color: K.goldD });
  hand('future evidence', 620, 652, lt, 3.15, { size: 44, color: K.goldD });
  if (lt > 3.4) {
    const p = map(lt, 3.4, 4.0);
    PE.sprayLine([[930, 720], [990, 950], [900, 1250], [540, 1290], [180, 1250], [110, 1000], [150, 760]], { width: 10, color: K.goldD, progress: p, seed: 65, alpha: 0.85 });
    if (p >= 1) hand('...and the loop runs again', 540, 1350, lt, 4.0, { size: 34, color: K.ink, align: 'center' });
  }
  cap('Every outcome feeds *Market Memory*.', 0.4, 2.4, { lt });
  cap('Sharpening the evidence for *the next decision*.', 2.6, 4.85, { lt, y: 1500 });
});
cue(S[5], 0.0, 'rip');
cue(S[5], 0.2, 'spray', { dur: 0.45, gain: 0.7 });
cue(S[5], 0.65, 'spray', { dur: 0.3, gain: 0.5 });
cue(S[5], 0.4, 'marker', { dur: 0.4, gain: 0.6 });
cue(S[5], 0.9, 'spray', { dur: 0.45, gain: 0.5 });
ITEMS.forEach(([, t0], i) => { cue(S[5], t0, 'whoosh', { dur: 0.35, gain: 0.45 }); cue(S[5], t0 + 0.55, 'thud', { gain: 0.55, pitch: 1 + (i % 3) * 0.08 }); });
cue(S[5], 2.5, 'spray', { dur: 0.5, gain: 0.7 });
cue(S[5], 2.95, 'marker', { dur: 0.6, gain: 0.7 });
cue(S[5], 3.4, 'spray', { dur: 0.6, gain: 0.5 });
cue(S[5], 4.0, 'marker', { dur: 0.6, gain: 0.5 });

// ======================= END CARD =======================
PE.scene(S[6], S[7], (lt) => {
  wall(lt);
  PE.splat(540, 520, 280, { color: K.gold, alpha: 0.12, seed: 90, n: 90 });
  const ls = pop(lt, 0.05, { f: 2.2, damp: 0.42 });
  if (ls > 0.01) PE.image(LION, 540, 500, 500, 454, { sticker: true, rot: 0.03, scale: lerp(1.5, 1, Math.min(1, ls)), alpha: clamp(ls * 3) });
  spray2('GARNETT', 'WORK', lt, 0.35, 0.95, 540, 920, 1125, { size: 240, color: K.gold, seed: 91 });
  spray2('TRUTH BEFORE', 'MONEY MOVES', lt, 1.05, 1.6, 540, 1290, 1385, { size: 84, color: K.paper, seed: 93 });
  const ns = pop(lt, 1.7);
  if (ns > 0.01) {
    const c = PE.ctx; c.save(); c.translate(540, 1505); c.rotate(0.012); c.scale(ns, ns);
    PE.R(0, 0, 600, 92, { color: K.note, z: 1.8, seed: 95, lined: { gap: 46, top: 23 } });
    c.restore();
    hand('Less AI. More Trust.', 540, 1522, lt, 1.8, { size: 50, align: 'center', dur: 0.5, rot: 0.012 });
  }
});
cue(S[6], 0.05, 'slap', { gain: 1.1 });
cue(S[6], 0.1, 'shimmer');
cue(S[6], 0.35, 'spray', { dur: 0.6 });
cue(S[6], 1.05, 'spray', { dur: 0.55, gain: 0.7 });
cue(S[6], 1.7, 'pop');
cue(S[6], 1.8, 'marker', { dur: 0.5, gain: 0.8 });
