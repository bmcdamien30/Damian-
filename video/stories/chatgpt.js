// @headline Everything <span>ChatGPT</span> Does
// @sources Facts checked Oct 16, 2026 against <a href="https://help.openai.com/en/articles/6825453-chatgpt-release-notes" target="_blank" rel="noopener">OpenAI's ChatGPT release notes</a>, <a href="https://openai.com/index/devday-2026-recap/" target="_blank" rel="noopener">OpenAI's DevDay 2026 recap</a> (1.2B weekly users), <a href="https://openai.com/index/gpt-6-for-everyone/" target="_blank" rel="noopener">GPT-6 and Intelligent UI</a>, <a href="https://openai.com/index/introducing-dots/" target="_blank" rel="noopener">Introducing dots</a>, <a href="https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt" target="_blank" rel="noopener">study mode</a>, <a href="https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites" target="_blank" rel="noopener">Sites</a>, <a href="https://openai.com/index/personal-finance-chatgpt/" target="_blank" rel="noopener">Finances</a>, <a href="https://help.openai.com/en/articles/8313428-chatgpt-accuracy-and-limitations" target="_blank" rel="noopener">accuracy and limitations</a>, and <a href="https://techcrunch.com/2026/09/29/openais-latest-features-take-direct-aim-at-the-app-store-model/" target="_blank" rel="noopener">TechCrunch (Sept 29, 2026)</a>. Original characters; no logos.

PE.init(canvas, { width: 1080, height: 1920, fps: 30 });
PE.jag = 2.2; PE.fringe = 3.4;

const W = 1080, H = 1920;
const K = {
  paper: '#fbf6ea', ink: '#1d1a22', red: '#ef4130', redL: '#ff6a55', yellow: '#ffc928', teal: '#12a79d',
  cobalt: '#2a4bd7', pink: '#ff6fae', mint: '#bff0dc', mintD: '#8ee3c8', orange: '#ff8a1f', purple: '#7a4fe0',
  navy: '#1e2a4a', lime: '#b7e04a', kraft: '#c99a5b', sky: '#7cc6ff', cream: '#f3e6c8', charcoal: '#27242f',
  green: '#3fae5a', grey: '#9aa0b0', slate: '#2b3655', chalk: '#234d3a',
};
const SKINS = ['#f1c7a3', '#d9a377', '#b97a4f', '#8a5636', '#5e3a22'];
const { map, clamp, lerp, ease, spring, wob, pop } = PE;
const D = Math.PI / 180;

// ---------- timeline ----------
const S = [0, 5.2, 11.2, 17.0, 22.4, 27.8, 33.2, 38.6, 44.0, 49.4, 55.4, 61.8, 66.8, 73.0];
const PHONE2 = [590, 1000, 300, 300 * 16 / 9];
const PHONE7 = [560, 800, 330, 330 * 16 / 9];
const PHONE13 = [600, 860, 360, 640];

PE.wipes = [
  { at: S[1], dur: 0.9, colors: [K.red, K.cobalt], seed: 1 },
  { at: S[4], dur: 0.9, colors: [K.lime, K.navy], seed: 2 },
  { at: S[8], dur: 0.9, colors: [K.cobalt, K.sky], seed: 3 },
  { at: S[11], dur: 1.4, hold: 0.14, colors: [K.yellow, K.charcoal], seed: 4, word: 'HOLD UP', wordColor: K.yellow, wordSize: 250 },
];
PE.transitions = [
  { at: S[2], type: 'portal', dir: 'in', dur: 1.0, rect: PHONE2 },
  { at: S[3], type: 'whip', dur: 0.6, dir: 'left' },
  { at: S[5], type: 'bleed', dur: 1.2, center: [540, 1000], rim: 'rgba(120,20,70,0.55)', seed: 3 },
  { at: S[6], type: 'whip', dur: 0.6, dir: 'left' },
  { at: S[7], type: 'portal', dir: 'in', dur: 2.2, rect: PHONE7 },
  { at: S[9], type: 'bleed', dur: 1.2, center: [540, 760], rim: 'rgba(40,10,90,0.5)', seed: 7 },
  { at: S[10], type: 'whip', dur: 0.6, dir: 'right' },
  { at: S[12], type: 'portal', dir: 'out', dur: 1.4, rect: PHONE13, freeze: 5.0, until: S[13] + 1 },
];
PE.impacts = [
  { t: S[1] + 2.75, amp: 12 }, { t: S[4] + 2.9, amp: 16 }, { t: S[7] + 3.95, amp: 12 },
  { t: S[9] + 3.4, amp: 12 }, { t: S[11] + 2.4, amp: 22 },
];

// ---------- helpers ----------
function sprayWord(word, lt, t0, x, y, o = {}) {
  const dur = o.dur || 0.5, p = map(lt, t0, t0 + dur);
  if (p <= 0) return;
  const size = o.size || 260;
  PE.spray(word, x, y, { size, color: o.color || K.red, progress: p, seed: o.seed || 2, rot: o.rot ?? -0.03, alpha: o.alpha, drips: o.drips });
  if (p < 1) {
    const m = PE.measure(word, 'stencil', size), ex = x - m.w / 2 + p * m.w;
    const c = PE.ctx;
    c.save();
    for (let i = 0; i < 6; i++) {
      const a = PE.hash(i + Math.floor(lt * 30)) * PE.TAU, r = 30 + PE.hash(i * 3.1) * 70;
      c.globalAlpha = 0.18; c.fillStyle = o.color || K.red;
      c.beginPath(); c.arc(ex + Math.cos(a) * 30, y + Math.sin(a) * size * 0.3, r, 0, PE.TAU); c.fill();
    }
    c.restore();
  }
}
function sprayCan(x, y, rot, color) {
  const c = PE.ctx;
  c.save(); c.translate(x, y); c.rotate(rot);
  PE.R(0, 0, 92, 190, { color, z: 3, r: 16, seed: 801 });
  PE.R(0, 10, 92, 54, { color: K.paper, z: 0, seed: 802, fringe: 0 });
  PE.star(0, 10, 20, 9, 5, { color, z: 0, seed: 803, fringe: 0 });
  PE.R(0, -112, 70, 36, { color: K.paper, z: 3, r: 8, seed: 804 });
  PE.R(-30, -128, 22, 16, { color: K.ink, z: 3, r: 4, seed: 805 });
  c.restore();
}
function bubble(text, side, y, lt, t0, o = {}) {
  const s = pop(lt, t0, { f: 2.6, damp: 0.42 });
  if (s <= 0.01) return;
  const c = PE.ctx, size = o.size || 42, maxW = o.maxW || 660, pad = 32;
  c.save(); c.font = PE.font('head', size);
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW - 2 * pad && cur) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur);
  const tw = Math.max(...lines.map((l) => c.measureText(l).width)); c.restore();
  const lh = size * 1.3, w = tw + 2 * pad, h = lines.length * lh + pad * 1.2;
  const x = side === 'right' ? W - 70 - w / 2 : 70 + w / 2;
  const col = o.color || K.paper, tcol = o.text || K.ink;
  const tx = side === 'right' ? x + w / 2 - 50 : x - w / 2 + 50, dir = side === 'right' ? 1 : -1;
  c.save(); c.translate(tx, y + h / 2); c.scale(s, s); c.translate(-tx, -(y + h / 2));
  PE.P([[tx - 26, y + h / 2 - 16], [tx + 26, y + h / 2 - 16], [tx + dir * 46, y + h / 2 + 34]], { color: col, z: 1.3, seed: PE.hashStr(text) + 1 });
  PE.R(x, y, w, h, { color: col, z: 1.6, r: 34, seed: PE.hashStr(text) });
  lines.forEach((l, i) => PE.text(l, x - w / 2 + pad, y - h / 2 + pad * 0.6 + lh * (i + 0.5), { font: 'head', size, color: tcol, align: 'left' }));
  c.restore();
  return h;
}
function typing(side, y, lt, t0, t1) {
  if (lt < t0 || lt > t1) return;
  const s = pop(lt, t0) * (1 - map(lt, t1 - 0.12, t1));
  const x = side === 'right' ? W - 190 : 190;
  PE.R(x, y, 200, 90, { color: K.paper, z: 1.4, r: 40, seed: 77, sx: s, sy: s });
  for (let i = 0; i < 3; i++) {
    const b = Math.max(0, Math.sin((lt - t0) * 9 - i * 0.9)) * 12;
    PE.C(x - 44 + i * 44, y - b, 13 * s, { color: K.grey, z: 0.4, seed: 78 + i, fringe: 0 });
  }
}
function tag(text, x, y, lt, t0, o = {}) {
  const s = pop(lt, t0, { f: 2.4, damp: 0.4 });
  if (s <= 0.01) return;
  PE.label(text, x, y, { size: o.size || 40, bg: o.bg || K.paper, color: o.color || K.ink, rot: o.rot || 0, scale: s, z: o.z ?? 1.4 });
}
function sticky(lines, x, y, color, lt, t0, rot) {
  const s = pop(lt, t0); if (s <= 0.01) return;
  const c = PE.ctx;
  c.save(); c.translate(x, y); c.rotate(rot + wob(lt, 0.25, 0.012, x)); c.scale(s, s);
  PE.R(0, 0, 250, 200, { color, z: 1.8, seed: PE.hashStr(lines[0]) });
  PE.C(0, -82, 15, { color: K.red, z: 2.5, seed: 61 });
  lines.forEach((l, i) => PE.text(l, 0, -18 + i * 50, { font: 'hand', size: 40, color: K.ink }));
  c.restore();
}
function check(x, y, s, p, color) {
  PE.brush([[x - 30 * s, y], [x - 8 * s, y + 24 * s], [x + 36 * s, y - 32 * s]], { width: 16 * s, color: color || K.green, progress: p, seed: x });
}
function confetti(lt, seed, colors) { PE.confetti(lt, { n: 12, seed, colors }); }
function crowdPerson(x, y, sk, shirt, s, seed) {
  PE.E(x, y + 50 * s, 46 * s, 50 * s, { color: shirt, z: 1, seed });
  PE.C(x, y - 18 * s, 32 * s, { color: sk, z: 1.2, seed: seed + 1 });
}

// ======================= S1 TITLE =======================
PE.scene(S[0], S[1], (lt) => {
  PE.bg(K.yellow);
  PE.P([[-60, 470], [1140, 400], [1140, 640], [-60, 720]], { color: K.pink, z: 0.8, seed: 11, jag: 2.5 });
  PE.C(900, 1300, 190, { color: K.cobalt, z: 1, seed: 12 });
  PE.P([[-40, 1500], [260, 1720], [-40, 1960]], { color: K.red, z: 1, seed: 13 });
  PE.star(170, 1180, 60, 26, 5, { color: K.paper, z: 1, seed: 14, rot: lt * 0.4 });
  PE.star(960, 980, 44, 18, 5, { color: K.paper, z: 1, seed: 15, rot: -lt * 0.5 });
  confetti(lt, 3, [K.red, K.cobalt, K.paper, K.teal]);
  // sprayed letters (under the stencil card)
  const cy = 560, l1 = cy - 145, l2 = cy + 145;
  const p1 = map(lt, 0.85, 1.5), p2 = map(lt, 1.65, 2.3);
  PE.spray('CHAT', 540, l1, { size: 300, color: K.red, progress: p1, seed: 21 });
  PE.spray('GPT', 540, l2, { size: 300, color: K.cobalt, progress: p2, seed: 22 });
  // stencil card slides in, then lifts away
  const cin = spring(lt, 0.05, { f: 1.5, damp: 0.5 });
  const lift = ease.in(map(lt, 2.45, 3.15));
  if (lift < 1) {
    PE.stencilCard(['CHAT', 'GPT'], 540 + lift * 260, lerp(-500, cy, cin) - lift * 1500, 900, 660,
      { size: 300, lineH: 290, color: K.kraft, rot: -0.02 + lift * 0.55, seed: 31 });
  }
  // spray can follows the reveal edge
  const w1 = PE.measure('CHAT', 'stencil', 300).w, w2 = PE.measure('GPT', 'stencil', 300).w;
  let ex, ey, active = false;
  if (lt < 0.85) { ex = lerp(1300, 540 - w1 / 2, ease.out(map(lt, 0.4, 0.85))); ey = l1; }
  else if (lt < 1.5) { ex = 540 - w1 / 2 + p1 * w1; ey = l1; active = true; }
  else if (lt < 1.65) { const u = ease.inOut(map(lt, 1.5, 1.65)); ex = lerp(540 + w1 / 2, 540 - w2 / 2, u); ey = lerp(l1, l2, u); }
  else if (lt < 2.3) { ex = 540 - w2 / 2 + p2 * w2; ey = l2; active = true; }
  else { const u = ease.in(map(lt, 2.3, 2.75)); ex = lerp(540 + w2 / 2, 1400, u); ey = lerp(l2, 200, u); }
  if (lt > 0.4 && lt < 2.8) {
    const cx = ex + 120, cyy = ey - 200;
    if (active) {
      const c = PE.ctx; c.save();
      for (let i = 0; i < 7; i++) {
        const u = i / 6; c.globalAlpha = 0.16;
        c.fillStyle = ey === l1 ? K.red : K.cobalt;
        c.beginPath(); c.arc(lerp(cx - 75, ex, u) + PE.noise(lt * 20 + i) * 10, lerp(cyy - 100, ey, u), 14 + u * 60, 0, PE.TAU); c.fill();
      }
      c.restore();
    }
    sprayCan(cx, cyy, -0.5 + wob(lt, 3, 0.04), ey === l1 ? K.red : K.cobalt);
  }
  // buddy
  const by = 1900 + (1 - spring(lt, 0.15, { f: 1.8, damp: 0.45 })) * 600;
  const wave = lt > 3.0 ? [150 + wob(lt, 1.6, 22), 40 + wob(lt, 1.6, 15, 0.25)] : [14, 12];
  PE.buddy(540, by - 20, { s: 0.95, look: lt < 2.6 ? [0.2, -1] : [0, -0.4], mouth: lt < 2.9 ? 'o' : 'grin', armL: wave, armR: [24, 70], propR: 'phone', phoneRot: -20, top: K.teal });
  PE.caption('What does *ChatGPT* actually do?', lt, 0.35, 2.55, { y: 1060 });
  PE.caption("Let's go over *everything*.", lt, 2.7, 5.15, { y: 1060 });
});

// ======================= S2 WHAT IS IT =======================
PE.scene(S[1], S[2], (lt) => {
  PE.bg(K.cobalt);
  PE.C(-60, 760, 260, { color: '#3a5ce6', z: 0.5, seed: 41 });
  PE.C(1120, 380, 220, { color: '#3a5ce6', z: 0.5, seed: 42 });
  confetti(lt, 5, [K.yellow, K.pink, K.paper]);
  tag('LAUNCHED NOV 30, 2022', 540, 225, lt, 0.3, { bg: K.yellow, rot: -0.035, size: 46 });
  sprayWord('1.2 BILLION', lt, 2.35, 540, 430, { size: 210, color: K.yellow, seed: 4, dur: 0.45 });
  tag('PEOPLE USE IT EVERY WEEK', 540, 600, lt, 2.9, { bg: K.paper, rot: 0.02, size: 40 });
  if (lt > 3.1) PE.text('per OpenAI, Sept 2026', 540, 668, { size: 26, color: K.paper, alpha: map(lt, 3.1, 3.4) * 0.85 });
  // crowd waves in
  const rows = [[1690, 0.78], [1790, 0.88], [1890, 1.0]];
  rows.forEach(([ry, s], r) => {
    for (let i = 0; i < 13; i++) {
      const x = 40 + i * 84 + (r % 2) * 42;
      const t0 = 0.6 + (x / W) * 1.3 + r * 0.22;
      const p = pop(lt, t0, { f: 2.2, damp: 0.4 });
      if (p <= 0.01) continue;
      const k = PE.hash(i * 7 + r * 31);
      crowdPerson(x, ry + (1 - p) * 160 + wob(lt, 0.8 + k * 0.6, 4, k), SKINS[Math.floor(k * 5)], [K.yellow, K.pink, K.red, K.teal, K.paper, K.orange][Math.floor(PE.hash(i + r * 13) * 6)], s, 1000 + r * 40 + i * 2);
    }
  });
  // buddy holds up the phone we dive into
  const [px, py, pw, ph] = PHONE2;
  PE.phone(px, py, pw, ph, {
    screen: K.mint, content: (x, y, w, h) => {
      const k = w / W;
      PE.R(x + w / 2, y + 70 * k, w, 140 * k, { color: K.paper, z: 0, seed: 51, fringe: 0, bevel: 0 });
      PE.R(x + w / 2, y + 1360 * k, 940 * k, 120 * k, { color: K.paper, z: 0.3, r: 60 * k, seed: 52, fringe: 0 });
      PE.C(x + 940 * k, y + 1360 * k, 42 * k, { color: K.ink, z: 0, seed: 53, fringe: 0 });
    },
  });
  const bx = 330, byy = 1880;
  const arm = PE.reach(bx, byy, 1, 1, 612, 1556);
  PE.buddy(bx, byy, { s: 1, armR: arm, armL: [10, 14], look: [0.8, -0.2], mouth: lt > 2.5 ? 'grin' : 'smile', top: K.teal, armsFront: false });
  PE.caption('An *AI chatbot* made by OpenAI.', lt, 0.5, 2.8, { y: 830 });
  PE.caption('You type or talk. *It answers.*', lt, 3.15, 5.0, { y: 830 });
});

// ======================= S3 ASK =======================
PE.scene(S[2], S[3], (lt) => {
  PE.bg(K.mint);
  PE.R(540, 70, 1100, 140, { color: K.paper, z: 1, seed: 61, fringe: 0.5 });
  PE.text('New chat', 540, 82, { size: 34, color: K.ink, alpha: 0.75 });
  confetti(lt, 7, [K.cobalt, K.pink, K.yellow]);
  sprayWord('ASK', lt, 0.25, 540, 330, { size: 290, color: K.cobalt, seed: 5 });
  bubble('Why is the sky blue?', 'right', 560, lt, 0.55, { color: K.cobalt, text: K.paper });
  typing('left', 740, lt, 1.0, 1.65);
  bubble('Sunlight scatters off the air, and blue light scatters the most!', 'left', 740, lt, 1.65);
  bubble("Now explain it like I'm 5", 'right', 960, lt, 2.9, { color: K.cobalt, text: K.paper });
  typing('left', 1150, lt, 3.3, 3.9);
  bubble('Air bounces blue light all over the sky, so blue is what you see.', 'left', 1150, lt, 3.9);
  // sparkles near answers
  for (const [x, y, t0] of [[900, 690, 1.8], [960, 1110, 4.05]]) {
    const s = pop(lt, t0); if (s > 0.01) PE.star(x, y, 44 * s, 18 * s, 4, { color: K.yellow, z: 1.2, rot: lt * 0.6, seed: 66 + x });
  }
  // input bar
  PE.R(540, 1360, 940, 120, { color: K.paper, z: 1.6, r: 60, seed: 67 });
  PE.text('Ask anything', 160, 1362, { size: 38, color: K.grey, align: 'left' });
  PE.C(940, 1360, 42, { color: K.ink, z: 1, seed: 68 });
  PE.P([[920, 1372], [940, 1342], [960, 1372]], { color: K.paper, z: 0, seed: 69, fringe: 0 });
  PE.caption('*Ask* it anything.', lt, 0.4, 2.85, { y: 1580 });
  PE.caption('It explains, answers and *brainstorms*.', lt, 3.05, 5.75, { y: 1580 });
});

// ======================= S4 WRITE =======================
PE.scene(S[3], S[4], (lt) => {
  PE.bg(K.red);
  PE.C(980, 260, 200, { color: '#f45a48', z: 0.4, seed: 81 });
  PE.C(80, 1500, 240, { color: '#f45a48', z: 0.4, seed: 82 });
  confetti(lt, 9, [K.yellow, K.paper, K.navy]);
  sprayWord('WRITE', lt, 0.2, 540, 300, { size: 280, color: K.yellow, seed: 6 });
  const names = ['ESSAY', 'EMAIL', 'POEM', 'STORY'], angs = [-27, -9, 9, 27];
  const piv = [540, 1460], R = 540, c = PE.ctx;
  let pen = null;
  names.forEach((nm, i) => {
    const t0 = -0.35 + i * 0.12, p = spring(lt, t0, { f: 1.8, damp: 0.45 });
    if (p <= 0.001) return;
    const a = angs[i] * D * p + wob(lt, 0.2, 0.01, i);
    const cx = piv[0] + Math.sin(a) * R, cy = lerp(2400, piv[1] - Math.cos(a) * R, p);
    c.save(); c.translate(cx, cy); c.rotate(a);
    PE.R(0, 0, 340, 460, { color: K.paper, z: 2, seed: 90 + i, r: 6 });
    PE.text(nm, -148, -180, { size: 36, color: [K.cobalt, K.teal, K.purple, K.red][i], align: 'left' });
    for (let j = 0; j < 6; j++) {
      const pl = map(lt, 0.5 + i * 0.12 + j * 0.28, 0.75 + i * 0.12 + j * 0.28);
      const short = nm === 'POEM' ? 60 + PE.hash(j) * 60 : 0;
      const x0 = -130 + short, x1 = 130 - short * (nm === 'POEM' ? 1 : 0) - (j === 5 ? 90 : 0);
      const y = -110 + j * 52;
      PE.line([[x0, y], [x1, y]], { width: 5, color: K.ink, progress: pl, seed: i * 10 + j, alpha: 0.8 });
      if (i === 3 && pl > 0 && pl < 1) pen = [x0 + (x1 - x0) * pl, y, a, cx, cy];
    }
    c.restore();
  });
  if (pen) {
    const [lx, ly, a, cx, cy] = pen, wx = cx + lx * Math.cos(a) - ly * Math.sin(a), wy = cy + lx * Math.sin(a) + ly * Math.cos(a);
    c.save(); c.translate(wx, wy); c.rotate(-0.75 + wob(lt, 4, 0.05));
    PE.P([[0, 0], [30, -14], [30, 14]], { color: K.cream, z: 2.5, seed: 101 });
    PE.P([[0, 0], [10, -5], [10, 5]], { color: K.ink, z: 0, seed: 102, fringe: 0 });
    PE.R(130, 0, 200, 30, { color: K.yellow, z: 2.5, seed: 103 });
    PE.R(240, 0, 34, 30, { color: K.pink, z: 2.5, seed: 104, r: 6 });
    c.restore();
  }
  // translate tags
  tag('HOLA!', 330, 1330, lt, 3.0, { bg: K.yellow, rot: -0.06, size: 50 });
  if (lt > 3.2) PE.brush([[440, 1330], [540, 1310], [620, 1330]], { width: 14, color: K.paper, progress: map(lt, 3.2, 3.5), seed: 3 });
  if (lt > 3.4) PE.P([[600, 1305], [650, 1330], [600, 1355]], { color: K.paper, z: 1, seed: 105, alpha: map(lt, 3.4, 3.5) });
  tag('HELLO!', 770, 1330, lt, 3.5, { bg: K.paper, rot: 0.05, size: 50 });
  PE.caption('It *writes* emails, essays, poems & stories.', lt, 0.4, 2.85, { y: 1580 });
  PE.caption('It *edits*, *summarizes* and *translates* too.', lt, 3.0, 5.4, { y: 1580 });
});

// ======================= S5 CODE =======================
PE.scene(S[4], S[5], (lt) => {
  PE.bg(K.navy);
  PE.star(130, 1350, 70, 30, 6, { color: '#2c3a63', z: 0.4, seed: 111, rot: lt * 0.2 });
  PE.star(960, 1450, 90, 40, 6, { color: '#2c3a63', z: 0.4, seed: 112, rot: -lt * 0.2 });
  confetti(lt, 11, [K.lime, K.pink, K.sky]);
  sprayWord('CODE', lt, 0.2, 540, 300, { size: 280, color: K.lime, seed: 7 });
  PE.R(540, 860, 880, 640, { color: K.slate, z: 2.4, r: 24, seed: 113 });
  PE.R(540, 575, 880, 70, { color: '#3a4770', z: 0, r: 0, seed: 114, fringe: 0 });
  [K.red, K.yellow, K.green].forEach((col, i) => PE.C(140 + i * 46, 575, 14, { color: col, z: 0.4, seed: 115 + i }));
  const indent = [0, 1, 2, 2, 1, 2, 3, 1, 0], syn = [K.pink, K.sky, K.yellow, K.paper, K.lime];
  for (let i = 0; i < 7; i++) {
    const p = ease.out(map(lt, 0.35 + i * 0.16, 0.6 + i * 0.16));
    if (p <= 0) continue;
    let x = 150 + indent[i] * 50;
    const y = 650 + i * 56;
    for (let k = 0; k < 3; k++) {
      const w = (60 + PE.hash(i * 9 + k) * 150) * p;
      if (x + w > 920) break;
      PE.R(x + w / 2, y, w, 26, { color: syn[(i + k * 2) % 5], z: 0.3, r: 13, seed: 120 + i * 3 + k, fringe: 0.3 });
      x += w + 18;
    }
  }
  // the bug crawls in, then gets stamped
  const squash = lt > 2.9;
  const bx = lerp(-80, 600, ease.inOut(map(lt, 0.8, 2.7))) + (squash ? 0 : wob(lt, 6, 3));
  const byy = 1088 + (squash ? 0 : wob(lt, 3, 4));
  if (lt > 0.8) {
    const c = PE.ctx; c.save(); c.translate(bx, byy); c.scale(1, squash ? 0.35 : 1);
    for (let k = -1; k <= 1; k++) for (const sd of [-1, 1]) {
      const leg = squash ? 0 : wob(lt, 8, 8, k * 0.3 + sd);
      PE.line([[k * 26, 0], [k * 34 + leg, sd * 56]], { width: 6, color: K.ink, seed: k + sd * 5 });
    }
    PE.E(0, 0, 58, 42, { color: K.redL, z: 1.6, seed: 131 });
    PE.line([[0, -40], [0, 40]], { width: 4, color: K.ink, seed: 132 });
    PE.C(62, 0, 24, { color: K.ink, z: 1.6, seed: 133 });
    PE.line([[78, -12], [104, -36]], { width: 4, color: K.ink, seed: 134 });
    PE.line([[78, 12], [104, 36]], { width: 4, color: K.ink, seed: 135 });
    c.restore();
  }
  PE.stamp('FIXED', 600, 1080, lt, 2.9, { color: K.redL, size: 140, rot: -0.1 });
  tag('CODEX', 760, 1265, lt, 3.2, { bg: K.lime, rot: 0.05, size: 54 });
  if (lt > 3.4) PE.text('coding agent', 760, 1335, { size: 28, color: K.paper, alpha: map(lt, 3.4, 3.7) });
  PE.caption('It writes *code* and hunts down bugs.', lt, 0.4, 2.8, { y: 1580 });
  PE.caption('Its coding agent is called *Codex*.', lt, 3.0, 5.4, { y: 1580 });
});

// ======================= S6 CREATE =======================
PE.scene(S[5], S[6], (lt) => {
  PE.bg(K.pink);
  PE.C(140, 260, 160, { color: '#ff86bb', z: 0.4, seed: 141 });
  PE.C(980, 1560, 200, { color: '#ff86bb', z: 0.4, seed: 142 });
  confetti(lt, 13, [K.yellow, K.navy, K.paper]);
  sprayWord('CREATE', lt, 0.2, 540, 300, { size: 250, color: K.navy, seed: 8 });
  // prompt bar types in
  const prompt = 'a cat astronaut on the moon';
  const n = Math.floor(map(lt, 0.35, 1.4) * prompt.length);
  PE.R(540, 560, 880, 100, { color: K.paper, z: 1.6, r: 50, seed: 143 });
  const shown = prompt.slice(0, n);
  PE.text(shown + ((lt * 2) % 1 < 0.5 && lt < 1.6 ? '|' : ''), 140, 562, { size: 38, color: K.ink, align: 'left' });
  // the picture assembles in a frame
  const fy = 1030, c = PE.ctx;
  PE.R(540, fy, 780, 620, { color: K.kraft, z: 2.4, seed: 144, r: 6 });
  PE.R(540, fy, 690, 530, { color: K.navy, z: 0, seed: 145, fringe: 0, bevel: 0.5 });
  c.save();
  c.beginPath(); c.rect(195, fy - 265, 690, 530); c.clip();
  const stars = [[260, 820], [420, 790], [700, 850], [820, 950], [330, 960], [600, 900], [790, 1080]];
  stars.forEach(([x, y], i) => { const s = pop(lt, 1.45 + i * 0.06); if (s > 0.01) PE.star(x, y, 18 * s, 8 * s, 5, { color: K.yellow, z: 0.5, seed: 150 + i, rot: lt * 0.3 + i }); });
  const my = lerp(1600, 1300, spring(lt, 1.6, { f: 1.6, damp: 0.55 }));
  PE.C(540, my, 250, { color: '#c9ccd6', z: 1.2, seed: 160 });
  PE.C(420, my - 150, 36, { color: '#aab0bd', z: 0.3, seed: 161 });
  PE.C(660, my - 110, 26, { color: '#aab0bd', z: 0.3, seed: 162 });
  PE.C(560, my - 200, 18, { color: '#aab0bd', z: 0.3, seed: 163 });
  const es = pop(lt, 2.0);
  if (es > 0.01) { PE.C(760, 830, 48 * es, { color: K.cobalt, z: 1, seed: 164 }); PE.B([[740, 815], [770, 805], [785, 830], [760, 850]].map(([x, y]) => [760 + (x - 760) * es, 830 + (y - 830) * es]), { color: K.green, z: 0.3, seed: 165, fringe: 0.4 }); }
  const fs = pop(lt, 2.7);
  if (fs > 0.01) { PE.R(690, 1065 - 60 * fs, 8, 120 * fs, { color: K.paper, z: 1, seed: 166 }); PE.P([[694, 1010], [694 + 70 * fs, 1028], [694, 1046]], { color: K.red, z: 1, seed: 167 }); }
  c.restore();
  // cat astronaut
  const cs = pop(lt, 2.3, { f: 2, damp: 0.4 });
  if (cs > 0.01) {
    c.save(); c.translate(450, 1000 + wob(lt, 0.4, 14)); c.rotate(wob(lt, 0.3, 0.08)); c.scale(cs, cs);
    PE.R(-70, 70, 50, 110, { color: '#d9dde6', z: 1.5, r: 14, seed: 170 });
    PE.B([[-70, 20], [70, 20], [80, 150], [-80, 150]], { color: K.paper, z: 2, seed: 171 });
    PE.cap(-60, 60, -120, 120, 26, { color: K.paper, z: 2, seed: 172 });
    PE.cap(60, 60, 120, 10, 26, { color: K.paper, z: 2, seed: 173 });
    PE.C(0, -40, 96, { color: '#d9dde6', z: 2.2, seed: 174 });
    PE.C(0, -40, 78, { color: K.orange, z: 0.4, seed: 175 });
    PE.P([[-62, -80], [-40, -136], [-16, -96]], { color: K.orange, z: 0.4, seed: 176 });
    PE.P([[62, -80], [40, -136], [16, -96]], { color: K.orange, z: 0.4, seed: 177 });
    c.fillStyle = K.ink;
    c.beginPath(); c.ellipse(-26, -44, 9, 13, 0, 0, PE.TAU); c.ellipse(26, -44, 9, 13, 0, 0, PE.TAU); c.fill();
    c.fillStyle = K.pink; c.beginPath(); c.moveTo(-8, -20); c.lineTo(8, -20); c.lineTo(0, -10); c.fill();
    for (const sd of [-1, 1]) for (const dy of [-14, -4]) PE.line([[sd * 20, dy - 6], [sd * 70, dy - 12 + (dy + 9) * 0.6]], { width: 3, color: K.ink, seed: sd * 3 + dy });
    c.globalAlpha = 0.22; c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(-36, -80, 26, 14, -0.6, 0, PE.TAU); c.fill(); c.globalAlpha = 1;
    // edit: add a red scarf
    const sc = pop(lt, 3.75);
    if (sc > 0.01) { PE.R(0, 30, 170 * sc, 34, { color: K.red, z: 2.4, r: 12, seed: 178 }); PE.R(54, 70, 34, 80 * sc, { color: K.red, z: 2.4, r: 10, seed: 179, rot: 0.2 }); }
    c.restore();
  }
  tag('+ add a red scarf', 540, 1420, lt, 3.25, { bg: K.yellow, rot: -0.03, size: 40 });
  const sp = pop(lt, 3.85); if (sp > 0.01 && lt < 4.6) PE.star(560, 1020, 60 * sp, 20 * sp, 4, { color: K.yellow, z: 1.5, seed: 180, rot: lt });
  PE.caption('It *makes pictures* from your words.', lt, 0.4, 2.95, { y: 1600 });
  PE.caption('It can *edit* your images too.', lt, 3.15, 5.35, { y: 1600 });
});

// ======================= S7 TALK & SEE =======================
PE.scene(S[6], S[7], (lt) => {
  PE.bg(K.teal);
  PE.C(960, 1700, 260, { color: '#1bb5aa', z: 0.4, seed: 191 });
  PE.C(80, 740, 180, { color: '#1bb5aa', z: 0.4, seed: 192 });
  confetti(lt, 15, [K.yellow, K.paper, K.pink]);
  const seeOn = lt > 2.95;
  sprayWord('TALK', lt, 0.2, 540, 290, { size: 270, color: K.yellow, seed: 9, alpha: 1 - map(lt, 2.75, 2.95) });
  if (seeOn) sprayWord('SEE', lt, 2.95, 540, 290, { size: 270, color: K.paper, seed: 10 });
  const [px, py, pw, ph] = PHONE7;
  // sound waves from mouth to phone
  const talking = lt > 0.3 && lt < 2.6;
  if (talking) {
    for (let i = 0; i < 3; i++) {
      const u = ((lt * 1.2 + i / 3) % 1);
      const x = lerp(410, 540, u), a = (1 - u) * 0.95;
      PE.brush([[x, 1310], [x + 34, 1385], [x, 1460]], { width: 13, color: K.paper, alpha: a, seed: i });
    }
  }
  PE.phone(px, py, pw, ph, {
    screen: K.navy, content: (x, y, w, h) => {
      const cx = x + w / 2, cy = y + h / 2;
      for (let i = 3; i >= 1; i--) {
        const k = 1 + 0.08 * Math.sin(lt * 6 - i) * (lt > 1.2 ? 1 : 0.3);
        PE.C(cx, cy, 40 * i * k, { color: [K.sky, K.cobalt, '#4f7bff'][i - 1], z: 0.5, seed: 200 + i, fringe: 0.4 });
      }
      PE.text('Voice', cx, y + h - 70, { size: 32, color: K.paper, alpha: 0.8 });
    },
  });
  // camera viewfinder overlay on the screen once it sees the world
  if (lt > 3.2) {
    const c = PE.ctx, a = 1 - PE._portalU * (PE._portal ? 1 : 0);
    c.save(); c.globalAlpha = a;
    c.strokeStyle = K.paper; c.lineWidth = 6; c.lineCap = 'round';
    const m = 26, L = 46;
    for (const [cx, cy, sx, sy] of [[px + m, py + m, 1, 1], [px + pw - m, py + m, -1, 1], [px + m, py + ph - m, 1, -1], [px + pw - m, py + ph - m, -1, -1]]) {
      c.beginPath(); c.moveTo(cx, cy + sy * L); c.lineTo(cx, cy); c.lineTo(cx + sx * L, cy); c.stroke();
    }
    c.fillStyle = K.red; c.beginPath(); c.arc(px + pw - 60, py + 60, 10, 0, PE.TAU); c.fill();
    const fl = 1 - map(lt, 3.2, 3.45);
    if (fl > 0) { c.globalAlpha = fl; c.fillStyle = '#fff'; c.fillRect(px, py, pw, ph); }
    c.restore();
  }
  const bx = 320, byy = 1880, s = 1.05;
  const arm = PE.reach(bx, byy, s, 1, 585, 1415);
  PE.buddy(bx, byy, { s, armR: arm, armL: [12, 16], look: [1, -0.4], talk: talking, mouth: lt > 3 ? 'o' : 'smile', top: K.orange });
  PE.caption('*Talk* out loud. It talks back.', lt, 0.35, 2.85, { y: 590 });
  PE.caption('Point your *camera*. It sees what you see.', lt, 3.05, 5.4, { y: 590 });
});

// ======================= S8 SEARCH =======================
PE.scene(S[7], S[8], (lt) => {
  PE.bg(K.cream);
  confetti(lt, 17, [K.cobalt, K.red, K.green]);
  sprayWord('SEARCH', lt, 0.3, 540, 270, { size: 250, color: K.cobalt, seed: 11 });
  const shrink = spring(lt, 2.75, { f: 1.6, damp: 0.5 });
  const gx = lerp(540, 300, shrink), gy = lerp(960, 820, shrink), gr = lerp(300, 180, shrink);
  const c = PE.ctx;
  // orbit ring
  PE.E(gx, gy, gr * 1.45, gr * 0.32, { color: K.yellow, z: 0.6, seed: 210, rot: -0.25, alpha: 0.9 });
  PE.C(gx, gy, gr, { color: K.cobalt, z: 2.2, seed: 211 });
  c.save(); c.beginPath(); c.arc(gx, gy, gr - 6, 0, PE.TAU); c.clip();
  const land = [[-0.5, -0.4, 0.35], [0.2, -0.2, 0.42], [-0.1, 0.45, 0.3], [0.7, 0.4, 0.25], [1.2, -0.3, 0.4]];
  land.forEach(([lx, ly, lr], i) => {
    let xx = ((lx + lt * 0.12 + 1.6) % 2.2) - 1.1;
    const cx = gx + xx * gr, cy = gy + ly * gr, r = lr * gr;
    PE.B([[cx - r, cy], [cx - r * 0.3, cy - r * 0.8], [cx + r * 0.6, cy - r * 0.5], [cx + r, cy + r * 0.2], [cx + r * 0.2, cy + r * 0.7], [cx - r * 0.6, cy + r * 0.5]], { color: K.green, z: 0.4, seed: 220 + i, fringe: 0.5 });
  });
  c.globalAlpha = 0.18; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(gx - gr * 0.35, gy - gr * 0.4, gr * 0.35, gr * 0.2, -0.6, 0, PE.TAU); c.fill();
  c.restore();
  // magnifier sweeps
  if (lt < 2.7) {
    const a = lt * 1.6, mx = gx + Math.cos(a) * gr * 0.55 + 60, my = gy + Math.sin(a) * gr * 0.45 - 40;
    const al = 1 - map(lt, 2.4, 2.7), ms = pop(lt, 0.2);
    c.save(); c.globalAlpha *= al; c.translate(mx, my); c.rotate(-0.6); c.scale(ms, ms);
    PE.R(0, 190, 40, 170, { color: '#7a4a2a', z: 3, r: 14, seed: 230 });
    PE.C(0, 0, 120, { color: K.ink, z: 3, seed: 231 });
    PE.C(0, 0, 96, { color: 'rgba(210,240,255,0.45)', z: 0, seed: 232, fringe: 0, bevel: 0.6 });
    c.restore();
  }
  // result cards fly out, then stack into a report
  const homes = [[220, 1330, -0.08], [540, 1400, 0.02], [860, 1330, 0.07]];
  const stackP = spring(lt, 2.85, { f: 1.6, damp: 0.5 });
  homes.forEach(([hx, hy, hr], i) => {
    const p = spring(lt, 0.9 + i * 0.25, { f: 2, damp: 0.45 });
    if (p <= 0.01) return;
    const x = lerp(lerp(540, hx, p), 720, stackP), y = lerp(lerp(960, hy, p), 1090 - i * 10, stackP), r = lerp(hr, 0.03 * (i - 1), stackP);
    const w = lerp(300, 380, stackP), h = lerp(130, 480, stackP);
    PE.R(x, y, w, h, { color: K.paper, z: 2, seed: 240 + i, rot: r, r: 8 });
    if (stackP < 0.5) {
      c.save(); c.translate(x, y); c.rotate(r); c.globalAlpha *= 1 - stackP * 2;
      PE.R(-30, -32, 200, 22, { color: [K.cobalt, K.red, K.purple][i], z: 0, seed: 250 + i, fringe: 0, r: 6 });
      PE.R(-10, 6, 240, 12, { color: '#c8c2b4', z: 0, seed: 253 + i, fringe: 0 });
      PE.R(-40, 32, 180, 12, { color: K.green, z: 0, seed: 256 + i, fringe: 0 });
      c.restore();
    }
  });
  // more pages drop onto the stack
  for (let k = 0; k < 4; k++) {
    const p = spring(lt, 3.05 + k * 0.13, { f: 2.4, damp: 0.55 });
    if (p <= 0.01) continue;
    const sc = lerp(0.2, 1, Math.min(1, p));
    PE.R(lerp(gx, 720 + (k % 2 ? 6 : -6), p), lerp(gy, 1060 - k * 12, p), 380, 480, { color: K.paper, z: 2 + k * 0.2, seed: 260 + k, rot: lerp(-0.6, k % 2 ? 0.025 : -0.02, Math.min(1, p)), r: 8, sx: sc, sy: sc });
  }
  if (lt > 3.6) {
    c.save(); c.translate(720, 1040); c.rotate(-0.02); c.globalAlpha *= map(lt, 3.6, 3.8);
    PE.text('REPORT', 0, -170, { size: 50, color: K.ink });
    for (let j = 0; j < 6; j++) PE.line([[-140, -100 + j * 50], [130 - (j === 5 ? 100 : 0), -100 + j * 50]], { width: 5, color: K.ink, alpha: 0.7, progress: map(lt, 3.7 + j * 0.1, 3.9 + j * 0.1), seed: j });
    c.restore();
  }
  ['[1]', '[2]', '[3]'].forEach((t, i) => tag(t, [960, 990, 940][i], [860, 1050, 1240][i], lt, 4.05 + i * 0.15, { bg: [K.yellow, K.pink, K.sky][i], rot: (i - 1) * 0.08, size: 40 }));
  PE.caption('It *searches the web* for fresh answers.', lt, 0.35, 2.75, { y: 1590 });
  PE.caption('*Deep research* writes full, cited reports.', lt, 2.95, 5.35, { y: 1590 });
});

// ======================= S9 LEARN =======================
PE.scene(S[8], S[9], (lt) => {
  PE.bg(K.sky);
  PE.C(960, 220, 170, { color: '#93d1ff', z: 0.4, seed: 271 });
  confetti(lt, 19, [K.yellow, K.paper, K.navy]);
  sprayWord('LEARN', lt, 0.2, 540, 270, { size: 260, color: K.navy, seed: 12 });
  PE.R(540, 760, 880, 540, { color: K.kraft, z: 2.2, seed: 272, r: 8 });
  PE.R(540, 760, 820, 480, { color: K.chalk, z: 0, seed: 273, fringe: 0, bevel: 0.5, hatch: 0.05 });
  tag('STUDY MODE', 290, 515, lt, 0.35, { bg: K.yellow, rot: -0.06, size: 40 });
  const steps = ['2x + 3 = 11', '2x = 8', 'x = 4'];
  const c = PE.ctx;
  steps.forEach((s, i) => {
    const t0 = 0.55 + i * 0.7, p = map(lt, t0, t0 + 0.5);
    if (p <= 0) return;
    const y = 650 + i * 110;
    PE.C(230, y, 30, { color: K.yellow, z: 0.8, seed: 280 + i });
    PE.text(String(i + 1), 230, y + 2, { size: 32, color: K.ink });
    const m = PE.measure(s, 'hand', 74);
    c.save(); c.beginPath(); c.rect(290, y - 60, m.w * p + 4, 120); c.clip();
    PE.text(s, 290, y, { font: 'hand', size: 74, color: K.paper, align: 'left' });
    c.restore();
  });
  if (lt > 2.3) check(580, 870, 1.5, map(lt, 2.3, 2.6), K.lime);
  // memory board
  tag('MEMORY', 470, 1110, lt, 2.9, { bg: K.pink, rot: -0.03, size: 44 });
  const ts = pop(lt, 3.05);
  if (ts > 0.01) {
    c.save(); c.translate(690, 1110); c.scale(ts, ts);
    PE.R(0, 0, 120, 60, { color: K.lime, z: 1.2, r: 30, seed: 290 });
    PE.C(30, 0, 24, { color: K.paper, z: 1.6, seed: 291 });
    PE.text('ON', -22, 2, { size: 24, color: K.ink });
    c.restore();
  }
  sticky(['loves', 'soccer'], 230, 1290, K.yellow, lt, 3.2, -0.06);
  sticky(['learning', 'Spanish'], 540, 1300, K.mintD, lt, 3.4, 0.03);
  sticky(['likes short', 'answers'], 850, 1285, K.paper, lt, 3.6, 0.07);
  PE.caption('*Study mode* teaches step by step.', lt, 0.35, 2.75, { y: 1590 });
  PE.caption('*Memory* remembers you. You can turn it off.', lt, 2.95, 5.35, { y: 1590 });
});

// ======================= S10 AGENT =======================
PE.scene(S[9], S[10], (lt) => {
  PE.bg(K.purple);
  confetti(lt, 21, [K.yellow, K.pink, K.mintD]);
  sprayWord('AGENT', lt, 0.2, 540, 250, { size: 250, color: K.yellow, seed: 13 });
  const c = PE.ctx, cx = 540, cy = 770;
  // dots orbit behind/in front of the cloud
  const dots = [K.yellow, K.pink, K.mintD, K.sky, K.orange];
  const drawDots = (front) => dots.forEach((col, i) => {
    const s = pop(lt, 3.0 + i * 0.1); if (s <= 0.01) return;
    const a = lt * 1.1 + (i / dots.length) * PE.TAU, isFront = Math.sin(a) > 0;
    if (isFront !== front) return;
    const x = cx + Math.cos(a) * 460, y = cy + Math.sin(a) * 300;
    c.save(); c.globalAlpha = 0.3; c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0, (50 + wob(lt, 2, 6, i)) * s), 0, PE.TAU); c.fill(); c.restore();
    PE.C(x, y, 28 * s, { color: col, z: 2, seed: 300 + i });
  });
  drawDots(false);
  const cloud = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * PE.TAU, bump = i % 2 ? 1 : 0.86;
    cloud.push([cx + Math.cos(a) * 420 * bump, cy + Math.sin(a) * 260 * bump * (Math.sin(a) > 0 ? 0.85 : 1.1)]);
  }
  PE.B(cloud, { color: K.paper, z: 2.4, seed: 310 });
  PE.R(cx, cy + 10, 540, 340, { color: K.ink, z: 1.8, r: 18, seed: 311 });
  PE.R(cx, cy, 500, 290, { color: K.sky, z: 0, seed: 312, fringe: 0, bevel: 0.4 });
  PE.R(cx, cy + 205, 100, 40, { color: K.ink, z: 1, seed: 313 });
  PE.R(cx, cy - 120, 500, 50, { color: K.purple, z: 0, seed: 314, fringe: 0 });
  const fields = [cy - 50, cy + 10, cy + 70];
  fields.forEach((fy, i) => {
    PE.R(cx - 30, fy, 380, 40, { color: K.paper, z: 0.3, seed: 315 + i, r: 6, fringe: 0 });
    PE.line([[cx - 200, fy], [cx - 200 + 220 - i * 40, fy]], { width: 6, color: K.ink, progress: map(lt, 0.7 + i * 0.6, 1.0 + i * 0.6), seed: i, alpha: 0.75 });
  });
  const pressed = lt > 2.5 && lt < 2.65;
  PE.R(cx + 190, cy + 120, 120, 44, { color: K.yellow, z: pressed ? 0.2 : 0.8, seed: 318, r: 8, sx: pressed ? 0.92 : 1, sy: pressed ? 0.92 : 1 });
  PE.text('BOOK', cx + 190, cy + 122, { size: 24, color: K.ink });
  // cursor path
  const path = [[cx + 260, cy + 150], [cx - 100, fields[0]], [cx - 60, fields[1]], [cx - 140, fields[2]], [cx + 190, cy + 120]];
  const seg = clamp((lt - 0.4) / 0.6, 0, path.length - 1.001), si = Math.floor(seg), su = ease.inOut(seg - si);
  const kx = lerp(path[si][0], path[si + 1][0], su), ky = lerp(path[si][1], path[si + 1][1], su);
  if (lt > 2.5 && lt < 3.0) { c.save(); c.strokeStyle = K.paper; c.lineWidth = 4; c.globalAlpha = 1 - map(lt, 2.5, 3.0); c.beginPath(); c.arc(kx, ky, 20 + (lt - 2.5) * 140, 0, PE.TAU); c.stroke(); c.restore(); }
  PE.P([[kx, ky], [kx, ky + 50], [kx + 13, ky + 38], [kx + 24, ky + 60], [kx + 33, ky + 55], [kx + 22, ky + 34], [kx + 40, ky + 34]], { color: K.paper, z: 2, seed: 320, ink: K.ink, inkW: 3, fringe: 0 });
  drawDots(true);
  PE.stamp('24/7', 860, 480, lt, 3.4, { color: K.yellow, size: 120, rot: 0.12 });
  // checklist
  PE.R(540, 1225, 780, 260, { color: K.paper, z: 2, seed: 330, r: 8, rot: -0.01 });
  const items = ['Find a table for 4', 'Fill in the details', 'Ask you before booking'];
  items.forEach((it, i) => {
    const y = 1145 + i * 80;
    PE.R(220, y, 44, 44, { color: K.paper, z: 0, seed: 331 + i, ink: K.ink, inkW: 4, fringe: 0 });
    PE.text(it, 270, y + 2, { size: 36, color: K.ink, align: 'left' });
    check(222, y - 4, 1, map(lt, 1.1 + i * 0.7, 1.35 + i * 0.7), K.green);
  });
  tag('dots: rolling out to Pro & Business Premium', 540, 1415, lt, 3.7, { bg: K.yellow, size: 26, rot: 0.01 });
  PE.caption('*Agent mode* does tasks on its own cloud computer.', lt, 0.35, 2.85, { y: 1610 });
  PE.caption('New *dots* are agents that can work 24/7.', lt, 3.05, 5.75, { y: 1610 });
});

// ======================= S11 BUILD =======================
PE.scene(S[10], S[11], (lt) => {
  PE.bg(K.lime);
  PE.C(100, 300, 150, { color: '#c6ea6a', z: 0.4, seed: 341 });
  confetti(lt, 23, [K.navy, K.pink, K.paper]);
  sprayWord('BUILD', lt, 0.0, 540, 250, { size: 260, color: K.navy, seed: 14 });
  const c = PE.ctx;
  const cs = spring(lt, -0.45, { f: 1.8, damp: 0.5 });
  c.save(); c.translate(540, 770); c.scale(cs, cs); c.translate(-540, -770);
  PE.R(540, 770, 820, 560, { color: K.paper, z: 2.4, seed: 342, r: 28 });
  PE.text('Split the bill', 540, 560, { size: 40, color: K.ink });
  PE.R(540, 655, 700, 110, { color: K.navy, z: 0.4, seed: 343, r: 16, fringe: 0 });
  const disp = lt < 0.9 ? '' : lt < 1.35 ? '$84' : lt < 1.8 ? '$84 ÷ 3' : '$84 ÷ 3 = $28';
  PE.text(disp, 540, 660, { size: 58, color: K.lime });
  const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '='];
  const press = { '8': 0.95, '4': 1.15, '÷': 1.4, '3': 1.6, '=': 1.85 };
  keys.forEach((k, i) => {
    const col = i % 4, row = Math.floor(i / 4), x = 305 + col * 157, y = 790 + row * 82;
    const s = pop(lt, -0.3 + i * 0.03);
    if (s <= 0.01) return;
    const pt = press[k], down = pt != null && lt > pt && lt < pt + 0.14;
    const op = col === 3;
    PE.R(x, y, 136, 66, { color: down ? K.yellow : op ? K.pink : '#ece6d6', z: down ? 0.2 : 1, seed: 350 + i, r: 12, sx: s * (down ? 0.9 : 1), sy: s * (down ? 0.9 : 1) });
    PE.text(k, x, y + 2, { size: 34, color: K.ink, scale: s });
  });
  c.restore();
  tag('GPT-6  INTELLIGENT UI', 540, 480, lt, 0.35, { bg: K.yellow, size: 34, rot: -0.02 });
  // badges
  const badges = [['WEBSITES', K.cobalt], ['TRY-ON', K.pink], ['BUDGETS', K.yellow]];
  badges.forEach(([nm, col], i) => {
    const s = pop(lt, 3.1 + i * 0.22); if (s <= 0.01) return;
    const x = 210 + i * 330, y = 1235 + wob(lt, 0.5, 6, i);
    c.save(); c.translate(x, y); c.scale(s, s);
    PE.C(0, 0, 115, { color: col, z: 2, seed: 360 + i });
    if (i === 0) {
      PE.R(0, 0, 130, 96, { color: K.paper, z: 1, seed: 363, r: 8 });
      PE.R(0, -36, 130, 24, { color: K.purple, z: 0, seed: 364, fringe: 0 });
      PE.R(-20, 4, 70, 14, { color: K.grey, z: 0, seed: 365, fringe: 0 });
      PE.R(10, 28, 90, 14, { color: K.lime, z: 0, seed: 366, fringe: 0 });
    } else if (i === 1) {
      PE.P([[-60, -40], [-24, -58], [24, -58], [60, -40], [48, -6], [30, -14], [30, 56], [-30, 56], [-30, -14], [-48, -6]], { color: K.red, z: 1.2, seed: 367 });
    } else {
      [[-40, 20, 40], [0, 0, 80], [40, -20, 120]].forEach(([bx, , bh], j) => PE.R(bx, 50 - bh / 2, 30, bh, { color: K.navy, z: 1, seed: 368 + j }));
      PE.C(48, -60, 22, { color: K.orange, z: 1.2, seed: 371 });
    }
    c.restore();
    PE.text(nm, x, 1395, { size: 32, color: K.navy, alpha: clamp(s) });
  });
  PE.caption('*GPT-6* builds mini apps right in the chat.', lt, 0.4, 2.95, { y: 1610 });
  PE.caption('Plus *websites*, *try-ons* and *budgets*.', lt, 3.15, 6.3, { y: 1610 });
});

// ======================= S12 CHECK IT =======================
PE.scene(S[11], S[12], (lt) => {
  PE.bg(K.charcoal);
  confetti(lt, 25, [K.yellow, K.pink, K.redL]);
  const c = PE.ctx;
  const ns = spring(lt, 0.15, { f: 1.8, damp: 0.5 });
  c.save(); c.translate(540, 720); c.rotate(-0.025 + wob(lt, 0.2, 0.006)); c.scale(ns, ns);
  PE.R(0, 0, 880, 420, { color: K.paper, z: 2.5, seed: 380, r: 6 });
  PE.R(-380, -200, 150, 46, { color: 'rgba(201,154,91,0.75)', z: 0.5, seed: 381, rot: -0.5, fringe: 0.3 });
  PE.R(380, -200, 150, 46, { color: 'rgba(201,154,91,0.75)', z: 0.5, seed: 382, rot: 0.5, fringe: 0.3 });
  PE.text('“', -360, -110, { font: 'stencil', size: 200, color: K.red });
  PE.text('ChatGPT can make mistakes.', 20, -60, { size: 52, color: K.ink });
  PE.text('Check important info.', 20, 20, { size: 52, color: K.ink });
  PE.text("— ChatGPT's own on-screen warning", 0, 120, { size: 28, color: '#6b6577' });
  c.restore();
  // magnifier hovers over the note
  const mx = 830 + wob(lt, 0.35, 30), my = 455 + wob(lt, 0.27, 18, 0.3), ms = pop(lt, 0.6);
  if (ms > 0.01) {
    c.save(); c.translate(mx, my); c.rotate(-2.5); c.scale(ms, ms);
    PE.R(0, 170, 36, 150, { color: '#7a4a2a', z: 3, r: 12, seed: 383 });
    PE.C(0, 0, 105, { color: '#3a3340', z: 3, seed: 384 });
    PE.C(0, 0, 84, { color: 'rgba(210,240,255,0.35)', z: 0, seed: 385, fringe: 0, bevel: 0.6 });
    c.restore();
  }
  const qs = pop(lt, 1.0), xs = pop(lt, 1.2);
  if (qs > 0.01) PE.spray('?', 170, 1150 + wob(lt, 0.5, 14), { size: 260 * qs, color: K.yellow, seed: 15, rot: -0.15 + wob(lt, 0.4, 0.06) });
  if (xs > 0.01) PE.spray('!', 920, 1140 + wob(lt, 0.45, 14, 0.5), { size: 260 * xs, color: K.pink, seed: 16, rot: 0.12 + wob(lt, 0.4, 0.06, 0.3) });
  PE.stamp('CHECK IT', 540, 1150, lt, 2.4, { color: K.redL, size: 170, rot: -0.1 });
  PE.caption("But it's *not perfect*.", lt, 0.35, 2.3, { y: 1580 });
  PE.caption('It can sound sure and still be *wrong*.', lt, 2.5, 4.9, { y: 1580 });
});

// ======================= S13 END =======================
PE.scene(S[12], S[13], (lt) => {
  PE.bg(K.yellow);
  PE.P([[-60, 120], [1140, 60], [1140, 560], [-60, 620]], { color: K.paper, z: 0.6, seed: 401, jag: 2.5 });
  PE.C(1010, 1500, 130, { color: K.pink, z: 0.8, seed: 402 });
  confetti(lt, 27, [K.red, K.cobalt, K.teal]);
  sprayWord("YOU'RE", lt, 1.35, 540, 225, { size: 220, color: K.ink, seed: 17, dur: 0.4 });
  sprayWord('THE BOSS', lt, 1.8, 540, 440, { size: 220, color: K.red, seed: 18, dur: 0.45 });
  const [px, py, pw, ph] = PHONE13;
  PE.phone(px, py, pw, ph, { screen: K.charcoal });
  const bx = 300, byy = 1880, s = 1.05;
  const arm = PE.reach(bx, byy, s, 1, 610, 1548);
  const wave = lt > 2.3 ? [150 + wob(lt, 1.5, 22), 40 + wob(lt, 1.5, 15, 0.25)] : [12, 14];
  PE.buddy(bx, byy, { s, armR: arm, armL: wave, look: [0.4, -0.5], mouth: 'grin', top: K.teal });
  PE.caption('A super useful tool. *Check what matters.*', lt, 2.45, 6.2, { y: 690, size: 52 });
  // sources card
  const ss = pop(lt, 2.9);
  if (ss > 0.01) {
    const c = PE.ctx; c.save(); c.translate(820, 1745); c.rotate(0.02); c.scale(ss, ss);
    PE.R(0, 0, 450, 250, { color: K.paper, z: 1.6, seed: 410, r: 6 });
    const lines = ['SOURCES (checked Oct 2026)', 'OpenAI ChatGPT release notes', 'OpenAI Help Center', 'OpenAI DevDay 2026 recap', 'TechCrunch, Sept 29, 2026'];
    lines.forEach((l, i) => PE.text(l, -200, -88 + i * 44, { size: i ? 21 : 22, color: i ? '#4a4452' : K.red, align: 'left' }));
    c.restore();
  }
});
