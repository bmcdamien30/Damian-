#!/usr/bin/env node
/* Headless recorder.
   node record.js page.html out.mp4 [--samples 3] [--fps 30] [--from-frame A --to-frame B] [--res 1]
   node record.js page.html --stills 1.2,3.5,8 --outdir dir [--samples 1] [--res 0.5]
   node record.js page.html --sfx events.json      (dump PE.sfx / PE.music cue list for the soundtrack)
*/
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }

const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const page_ = path.resolve(pos[0]);
const out = pos[1];
const samples = +flag('samples', 3), fps = +flag('fps', 30), res = +flag('res', 1);
const stills = flag('stills', null), outdir = flag('outdir', 'stills');

(async () => {
  const browser = await pw.chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.addInitScript((r) => { window.__RECORD = true; window.__RES = r; }, res);
  await page.goto('file://' + page_);
  await page.waitForFunction(() => window.__READY === true, null, { timeout: 60000 });
  const duration = await page.evaluate(() => PE.duration);
  const grab = (t, s) => page.evaluate(([t, s]) => { PE.render(t, s); return PE.canvas.toDataURL('image/jpeg', 0.93).slice(23); }, [t, s]);

  const sfxOut = flag('sfx', null);
  if (sfxOut) {
    const data = await page.evaluate(() => ({ duration: PE.duration, music: PE.music || null, sfx: PE.sfx || [] }));
    fs.writeFileSync(sfxOut, JSON.stringify(data, null, 1));
    console.log('wrote', sfxOut, data.sfx.length, 'events');
    await browser.close();
    return;
  }

  if (stills) {
    fs.mkdirSync(outdir, { recursive: true });
    const ts = stills.split(',').map(Number);
    for (const t of ts) {
      const b = await grab(t, samples);
      const f = path.join(outdir, `still_${t.toFixed(2).padStart(6, '0')}.jpg`);
      fs.writeFileSync(f, Buffer.from(b, 'base64'));
      console.log('still', f);
    }
    await browser.close();
    return;
  }

  const total = Math.round(duration * fps);
  const a = +flag('from-frame', 0), b = Math.min(total, +flag('to-frame', total));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', flag('crf', '18'), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    const buf = Buffer.from(await grab(f / fps, samples), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - a) % 30 === 0) {
      const el = (Date.now() - t0) / 1000, per = el / (f - a + 1);
      console.log(`frame ${f}/${b} ${per.toFixed(2)}s/frame eta ${((b - f) * per / 60).toFixed(1)}min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();
