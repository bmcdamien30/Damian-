/* Original paper character "Pip": a kid in a hoodie. Rigged arms, blink, breathing, props. */
(function () {
  const PE = window.PE;
  const D = Math.PI / 180;

  // arm: shoulder (sx,sy), angles in degrees; 0 = hanging down, + swings outward (away from body).
  function armPts(sx, sy, side, a1, a2, L1, L2) {
    const A1 = a1 * D * side, A2 = (a1 + a2) * D * side;
    const ex = sx + Math.sin(A1) * L1, ey = sy + Math.cos(A1) * L1;
    const hx = ex + Math.sin(A2) * L2, hy = ey + Math.cos(A2) * L2;
    return { ex, ey, hx, hy, ang: Math.atan2(hy - ey, hx - ex) };
  }

  PE.buddy = (x, y, o = {}) => {
    const t = o.t ?? PE.t, s = o.s || 1;
    const skin = o.skin || '#c98a5e', top = o.top || '#12a79d', pants = o.pants || '#1e2a4a';
    const hair = o.hair || '#2a1a14', shoe = o.shoe || '#fbf6ea', sole = o.sole || '#ef4130';
    const c = PE.ctx;
    const breath = PE.wob(t, 0.45, 1, 0.2);
    const bob = (o.bounce || 0) + breath * 3;
    const out = {};
    c.save();
    c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
    if (o.rot) c.rotate(o.rot);
    if (o.sq) c.scale(o.sq.sx, o.sq.sy);
    const seed = o.seed || 40;
    // legs + shoes
    const legSpread = o.legs ?? 34;
    PE.cap(-legSpread, -205, -legSpread - 4, -40, 34, { color: pants, z: 1, seed: seed + 1 });
    PE.cap(legSpread, -205, legSpread + 4, -40, 34, { color: pants, z: 1, seed: seed + 2 });
    PE.B([[-legSpread - 62, -8], [-legSpread - 54, -52], [-legSpread + 16, -54], [-legSpread + 30, -10]], { color: shoe, z: 1.2, seed: seed + 3 });
    PE.B([[legSpread - 30, -10], [legSpread - 16, -54], [legSpread + 54, -52], [legSpread + 62, -8]], { color: shoe, z: 1.2, seed: seed + 4 });
    PE.R(-legSpread - 16, -6, 92, 12, { color: sole, z: 0.4, seed: seed + 5, r: 6 });
    PE.R(legSpread + 16, -6, 92, 12, { color: sole, z: 0.4, seed: seed + 6, r: 6 });
    // torso (hoodie)
    const ty = -200 + bob * 0.4;
    c.save(); c.translate(0, ty); c.scale(1 + breath * 0.006, 1 + breath * 0.014); c.translate(0, -ty);
    PE.B([[-118, -190], [-62, -420], [62, -420], [118, -190], [0, -178]], { color: top, z: 1.6, seed: seed + 7 });
    PE.R(0, -250, 150, 60, { color: o.pocket || 'rgba(0,0,0,0.18)', z: 0.3, seed: seed + 8, r: 18, fringe: 0, tex: 0.4 });
    PE.line([[-26, -405], [-30, -340]], { color: '#fbf6ea', width: 5, seed: 3 });
    PE.line([[26, -405], [30, -340]], { color: '#fbf6ea', width: 5, seed: 4 });
    c.restore();
    // arms
    const shY = -392 + bob;
    const L1 = 118, L2 = 112;
    const [la1, la2] = o.armL || [12, 10], [ra1, ra2] = o.armR || [12, 10];
    const L = armPts(-96, shY, -1, la1, la2, L1, L2), R = armPts(96, shY, 1, ra1, ra2, L1, L2);
    const drawArm = (side, sx, a, prop) => {
      PE.cap(sx, shY, a.ex, a.ey, 30, { color: top, z: 1.8, seed: seed + 10 + side });
      PE.cap(a.ex, a.ey, a.hx, a.hy, 27, { color: top, z: 1.8, seed: seed + 12 + side });
      if (prop) drawProp(prop, a, side, o);
      PE.C(a.hx, a.hy, 25, { color: skin, z: 1.9, seed: seed + 14 + side });
    };
    const drawHead = () => {
      const hy = -520 + bob * 1.4, tilt = (o.tilt || 0) * D + PE.wob(t, 0.3, 0.02, 1);
      c.save(); c.translate(0, hy); c.rotate(tilt);
      PE.C(-102, 6, 22, { color: skin, z: 1.4, seed: seed + 20 });
      PE.C(102, 6, 22, { color: skin, z: 1.4, seed: seed + 21 });
      PE.E(0, 0, 104, 100, { color: skin, z: 2, seed: seed + 22 });
      // hair cap + wobbling tufts
      PE.B([[-108, -10], [-96, -76], [-30, -112], [40, -110], [100, -72], [110, -6], [70, -54], [10, -64], [-50, -50]], { color: hair, z: 2.1, seed: seed + 23 });
      for (let i = 0; i < 3; i++) {
        const w = PE.wob(t, 0.9 + i * 0.2, 6, i * 0.3);
        const bx = -30 + i * 32;
        PE.P([[bx - 18, -100], [bx + 4 + w, -150 - i * 6], [bx + 20, -98]], { color: hair, z: 2.1, seed: seed + 24 + i, fringe: 0.5 });
      }
      // face
      const [lx, ly] = o.look || [0, 0];
      const bl = t % 3.4, blink = bl > 3.25 ? 0.12 : 1;
      for (const ex of [-38, 38]) {
        c.save(); c.translate(ex + lx * 8, 6 + ly * 6); c.scale(1, blink);
        c.fillStyle = '#1d1a22'; c.beginPath(); c.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(4, -5, 4, 0, Math.PI * 2); c.fill();
        c.restore();
      }
      c.fillStyle = 'rgba(255,110,140,0.35)';
      c.beginPath(); c.ellipse(-62, 38, 16, 10, 0, 0, Math.PI * 2); c.ellipse(62, 38, 16, 10, 0, 0, Math.PI * 2); c.fill();
      const mouth = o.mouth || 'smile';
      const talk = o.talk ? Math.abs(Math.sin(t * 13)) * 0.8 + 0.2 : 0;
      c.fillStyle = '#4a1a1a'; c.strokeStyle = '#1d1a22'; c.lineWidth = 6; c.lineCap = 'round';
      if (o.talk) { c.beginPath(); c.ellipse(lx * 6, 50, 18, 6 + talk * 14, 0, 0, Math.PI * 2); c.fill(); }
      else if (mouth === 'o') { c.beginPath(); c.ellipse(lx * 6, 52, 13, 16, 0, 0, Math.PI * 2); c.fill(); }
      else if (mouth === 'grin') {
        c.beginPath(); c.moveTo(-34, 40); c.quadraticCurveTo(0, 92, 34, 40); c.closePath(); c.fill();
        c.fillStyle = '#fff'; c.fillRect(-24, 41, 48, 9);
      } else if (mouth === 'flat') { c.beginPath(); c.moveTo(-20, 52); c.lineTo(20, 50); c.stroke(); }
      else { c.beginPath(); c.moveTo(-26, 42); c.quadraticCurveTo(0, 66, 26, 42); c.stroke(); }
      if (o.brows) {
        c.lineWidth = 6;
        c.beginPath(); c.moveTo(-54, -30 - o.brows); c.lineTo(-24, -34 - o.brows * 1.4); c.stroke();
        c.beginPath(); c.moveTo(54, -30 - o.brows); c.lineTo(24, -34 - o.brows * 1.4); c.stroke();
      }
      c.restore();
    };
    if (o.armsFront) { drawHead(); drawArm(-1, -96, L, o.propL); drawArm(1, 96, R, o.propR); }
    else { drawArm(-1, -96, L, o.propL); drawArm(1, 96, R, o.propR); drawHead(); }
    out.handL = [x + L.hx * s * (o.flip ? -1 : 1), y + L.hy * s];
    out.handR = [x + R.hx * s * (o.flip ? -1 : 1), y + R.hy * s];
    c.restore();
    return out;
  };

  // inverse kinematics: arm angles so the hand of a buddy at (bx,by) scale s lands on (tx,ty)
  PE.reach = (bx, by, s, side, tx, ty, elbowUp = false) => {
    const sx = bx + side * 96 * s, sy = by - 392 * s;
    const dx = (tx - sx) / s, dy = (ty - sy) / s, L1 = 118, L2 = 112;
    const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1);
    const base = Math.atan2(dx * side, dy) / D;
    const beta = Math.acos(PE.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)) / D;
    const theta = Math.acos(PE.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1)) / D;
    const bend = 180 - theta;
    return elbowUp ? [base + beta, -bend] : [base - beta, bend];
  };

  function drawProp(kind, a, side, o) {
    const c = PE.ctx;
    c.save(); c.translate(a.hx, a.hy);
    if (kind === 'phone') {
      c.rotate((o.phoneRot || 0) * D);
      PE.R(0, -50, 78, 140, { color: '#1d1a22', z: 2.2, r: 14, seed: 301 });
      PE.R(0, -52, 62, 112, { color: o.screen || '#8ee3c8', z: 0, r: 6, seed: 302, fringe: 0, bevel: 0 });
    } else if (kind === 'mag') {
      c.rotate(a.ang - Math.PI / 2);
      PE.R(0, 40, 22, 100, { color: '#7a4a2a', z: 2, r: 8, seed: 311 });
      PE.C(0, 130, 62, { color: '#3a3340', z: 2.2, seed: 312 });
      PE.C(0, 130, 48, { color: 'rgba(200,240,255,0.55)', z: 0, seed: 313, fringe: 0, bevel: 0.5 });
    } else if (kind === 'can') {
      c.rotate(-0.2 * side);
      PE.R(0, -40, 66, 130, { color: o.canColor || '#ef4130', z: 2.2, r: 10, seed: 321 });
      PE.R(0, -112, 46, 26, { color: '#fbf6ea', z: 2.2, r: 6, seed: 322 });
      PE.R(0, -40, 66, 30, { color: '#fbf6ea', z: 0, seed: 323, fringe: 0 });
    } else if (kind === 'mic') {
      PE.R(0, -30, 26, 90, { color: '#3a3340', z: 2, r: 10, seed: 331 });
      PE.C(0, -92, 34, { color: '#9aa0b0', z: 2.2, seed: 332, hatch: 0.25 });
    }
    c.restore();
  }

  // a big phone prop; returns its screen rect. screen is drawn via PE.portalSlot when a portal is active.
  PE.phone = (x, y, w, h, o = {}) => {
    const bez = w * 0.07;
    PE.R(x + w / 2, y + h / 2, w + bez * 2, h + bez * 3.2, { color: o.body || '#1d1a22', z: o.z ?? 2.6, r: w * 0.14, seed: o.seed || 350, rot: 0 });
    PE.portalSlot(x, y, w, h, () => {
      PE.R(x + w / 2, y + h / 2, w, h, { color: o.screen || '#e8fff6', z: 0, r: w * 0.05, seed: (o.seed || 350) + 1, fringe: 0, bevel: 0.4, boil: false });
      if (o.content) o.content(x, y, w, h);
    });
    // glass glare
    const c = PE.ctx;
    c.save(); c.globalAlpha = 0.16 * (1 - PE._portalU * (PE._portal ? 1 : 0));
    c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(x + w * 0.55, y); c.lineTo(x + w * 0.9, y); c.lineTo(x + w * 0.35, y + h); c.lineTo(x, y + h); c.lineTo(x, y + h * 0.75); c.closePath(); c.fill();
    c.restore();
    PE.R(x + w / 2, y - bez * 0.9, w * 0.25, bez * 0.5, { color: '#3a3340', z: 0, r: bez * 0.25, seed: (o.seed || 350) + 2, fringe: 0, bevel: 0 });
  };
})();
