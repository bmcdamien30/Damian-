#!/usr/bin/env python3
"""Synthesize a soundtrack (music bed + sound effects) from a cue list.

usage: audio.py cues.json out.wav
The cue list comes from `node record.js page.html --sfx cues.json` and holds
PE.music (bpm, chords, beatIn, finalHit, length) and PE.sfx ([{t, type, dur?, gain?, pitch?}]).
Everything is generated from oscillators and filtered noise; no samples are used.
"""
import json, sys, wave
import numpy as np

SR = 48000
R = np.random.default_rng(7)


# ---------- dsp helpers ----------
def T(d):
    return np.arange(int(d * SR)) / SR


def noise(n):
    return R.standard_normal(n)


def band(x, lo=None, hi=None):
    """Soft FFT band-pass (4th-order-ish skirts)."""
    n = len(x)
    if n == 0:
        return x
    N = 1 << int(np.ceil(np.log2(n + 1)))
    X = np.fft.rfft(x, N)
    f = np.fft.rfftfreq(N, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, N)[:n]


def fade(x, a=0.004, r=0.02):
    n = len(x)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        x[:na] *= np.linspace(0, 1, na)
    if nr:
        x[-nr:] *= np.linspace(1, 0, nr)
    return x


def sweep_sine(f0, f1, d, k):
    t = T(d)
    f = f1 + (f0 - f1) * np.exp(-t * k)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def bell(f0, d, amp=1.0):
    t = T(d)
    y = np.zeros_like(t)
    for ratio, a, dec in [(1, 1, 2.2), (2.0, 0.4, 3.2), (2.76, 0.25, 4.5), (5.4, 0.1, 7)]:
        y += a * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t * dec)
    return fade(y * amp, 0.002, 0.05)


# ---------- music ----------
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def hz(name):
    p, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[p] + (o - 4) * 12 - 9) / 12)


CHORDS = {
    'Am9': ('A2', ['A3', 'C4', 'E4', 'G4', 'B4']),
    'Fmaj7': ('F2', ['F3', 'A3', 'C4', 'E4']),
    'Dm9': ('D2', ['D3', 'F3', 'A3', 'C4', 'E4']),
    'E7': ('E2', ['E3', 'G#3', 'B3', 'D4']),
    'Aadd9': ('A1', ['A3', 'C4', 'E4', 'B4', 'A4']),
}


def kick():
    t = T(0.45)
    y = sweep_sine(150, 46, 0.45, 26) * np.exp(-t * 6.5)
    y += band(noise(len(t)), 2000, 9000) * np.exp(-t * 260) * 0.25
    return np.tanh(y * 1.6) * 0.95


def snare():
    t = T(0.32)
    y = 0.5 * np.sin(2 * np.pi * 185 * t) * np.exp(-t * 22) + 0.2 * np.sin(2 * np.pi * 330 * t) * np.exp(-t * 30)
    y += band(noise(len(t)), 1500, 9000) * np.exp(-t * 15) * 0.9
    return fade(np.tanh(y * 1.3) * 0.7)


def hat(open_=False):
    d = 0.28 if open_ else 0.06
    t = T(d)
    return fade(band(noise(len(t)), 7000, 15000) * np.exp(-t * (13 if open_ else 75)) * 0.35)


def bass(f, d):
    t = T(d)
    y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    y *= np.minimum(1, t / 0.006) * (0.75 + 0.25 * np.exp(-t * 6))
    return fade(np.tanh(y * 1.4) * 0.55, 0.006, 0.06)


def keys(notes, d, amp=0.16):
    t = T(d)
    y = np.zeros_like(t)
    for i, n in enumerate(notes):
        f = hz(n) * (1 + (i % 2 * 2 - 1) * 0.0015)
        y += np.sin(2 * np.pi * f * t) * np.exp(-t * 1.1) + 0.22 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 2.6) + 0.07 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 4.5)
    y *= 1 + 0.12 * np.sin(2 * np.pi * 4.4 * t)
    return fade(y * amp, 0.004, 0.12)


def crash(d=2.6):
    t = T(d)
    return fade(band(noise(len(t)), 4500, 16000) * np.exp(-t * 1.6) * 0.32, 0.001, 0.3)


def riser(d):
    t = T(d)
    u = t / d
    lo = band(noise(len(t)), 400, 2000)
    hi = band(noise(len(t)), 2000, 9000)
    return (lo * (1 - u) + hi * u) * u ** 2 * 0.22


def music(cfg, length):
    L, Rr = np.zeros(int(length * SR) + SR), np.zeros(int(length * SR) + SR)

    def add(sig, t, pan=0.0, g=1.0):
        i = int(t * SR)
        if i < 0 or i >= len(L):
            return
        s = sig[: len(L) - i] * g
        L[i:i + len(s)] += s * (1 - pan) ** 0.5 / 1.2
        Rr[i:i + len(s)] += s * (1 + pan) ** 0.5 / 1.2

    beat = 60 / cfg['bpm']
    bar, st = beat * 4, beat / 4
    beat_in, final = cfg['beatIn'], cfg['finalHit']
    nbars = int(round(final / bar))
    K_, S_ = kick(), snare()
    H, HO = [hat() for _ in range(4)], hat(True)
    for b in range(nbars):
        t0 = b * bar
        name = cfg['chords'][b % len(cfg['chords'])]
        root, notes = CHORDS[name]
        add(keys(notes, bar * 0.7), t0, -0.15)
        add(keys(notes[1:], bar * 0.35, 0.09), t0 + 10 * st, 0.15)
        if t0 < beat_in - 1e-6:
            continue
        for s in (0, 7, 10):
            add(K_, t0 + s * st, 0, 0.9 if s == 0 else 0.7)
        for s in (4, 12):
            add(S_, t0 + s * st, 0.05)
        for k, s in enumerate(range(0, 16, 2)):
            sw = 0.035 if (s // 2) % 2 else 0
            if s == 14 and b % 2:
                add(HO, t0 + s * st + sw, 0.3, 0.8)
            else:
                add(H[k % 4], t0 + s * st + sw, 0.3, 0.75 if s % 4 == 0 else 0.5)
        f = hz(root)
        for s, d, mul in ((0, 0.5, 1), (7, 0.2, 1), (10, 0.35, 2), (14, 0.15, 1.5)):
            add(bass(f * mul, d), t0 + s * st, 0)
        if b == nbars - 1:  # fill + riser into the final hit
            for s in (12, 13, 14, 15):
                add(S_, t0 + s * st, 0.05, 0.55 + 0.1 * (s - 12))
            add(riser(bar * 0.5), final - bar * 0.5, 0)
    # final hit
    root, notes = CHORDS['Aadd9']
    add(K_, final, 0, 1.0)
    add(crash(), final, 0.1)
    add(keys(notes, length - final + 0.5, 0.2), final, 0)
    add(bass(hz(root), 2.4), final, 0, 1.1)
    # vinyl crackle + hiss
    n = len(L)
    crack = np.zeros(n)
    idx = R.integers(0, n, int(length * 22))
    crack[idx] = R.uniform(-1, 1, len(idx)) * R.uniform(0.2, 1, len(idx)) ** 3
    crack = band(crack, 1000, 9000) * 0.25 + band(noise(n), 1500, 7000) * 0.004
    L += crack
    Rr += np.roll(crack, 37)
    # lo-fi tone + glue
    L, Rr = band(L, 30, 9000), band(Rr, 30, 9000)
    return np.tanh(L * 1.1) / 1.1, np.tanh(Rr * 1.1) / 1.1


# ---------- sound effects ----------
def sfx_spray(d, **_):
    t = T(d)
    y = band(noise(len(t)), 1800, 14000)
    y += band(noise(len(t)), 5000, 16000) * 0.6
    flutter = 1 + 0.15 * np.sin(2 * np.pi * 7 * t + R.uniform(0, 6))
    burst = 1 + 0.6 * np.exp(-t * 25)
    return fade(y * flutter * burst * 0.2, 0.02, 0.07)


def sfx_rattle(d, **_):
    y = np.zeros(int(d * SR) + SR // 10)
    t = 0.0
    while t < d:
        n = int(0.05 * SR)
        tt = T(0.05)
        c = sum(np.sin(2 * np.pi * R.uniform(2600, 4800) * tt) for _ in range(3)) * np.exp(-tt * 95) * 0.25
        c += band(noise(n), 3000, 12000) * np.exp(-tt * 200) * 0.3
        i = int(t * SR)
        y[i:i + n] += c
        t += 0.085 + R.uniform(-0.015, 0.015)
    return y * 0.8


def sfx_slap(**_):
    t = T(0.35)
    y = band(noise(len(t)), 400, 5000) * np.exp(-t * 45) * 0.7
    y += sweep_sine(140, 55, 0.35, 20) * np.exp(-t * 16) * 0.6
    return fade(np.tanh(y * 1.4) * 0.8)


def sfx_stamp(**_):
    t = T(0.6)
    y = sweep_sine(110, 42, 0.6, 14) * np.exp(-t * 10) * 1.0
    y += np.sin(2 * np.pi * 240 * t) * np.exp(-t * 34) * 0.35
    y += band(noise(len(t)), 200, 3500) * np.exp(-t * 38) * 0.6
    return fade(np.tanh(y * 1.8) * 0.9)


def sfx_thud(pitch=1.0, **_):
    t = T(0.3)
    y = band(noise(len(t)), 150 * pitch, 2500) * np.exp(-t * 30) * 0.6
    y += np.sin(2 * np.pi * 110 * pitch * t) * np.exp(-t * 20) * 0.5
    return fade(y * 0.7)


def sfx_pop(pitch=1.0, **_):
    t = T(0.12)
    y = sweep_sine(900 * pitch, 430 * pitch, 0.12, 40) * np.exp(-t * 36)
    y[:80] += band(noise(80), 2000, 8000) * 0.4
    return fade(y * 0.32, 0.001, 0.02)


def sfx_click(**_):
    t = T(0.04)
    y = np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 180) + band(noise(len(t)), 4000, 12000) * np.exp(-t * 300) * 0.5
    return y * 0.35


def sfx_whoosh(d=0.4, **_):
    t = T(d)
    u = t / d
    n = len(t)
    lo, mid, hi = band(noise(n), 250, 900), band(noise(n), 900, 2600), band(noise(n), 2600, 7000)
    w_lo = np.clip(1 - u * 2, 0, 1)
    w_hi = np.clip(u * 2 - 1, 0, 1)
    y = lo * w_lo + mid * (1 - w_lo - w_hi) + hi * w_hi
    return y * np.sin(np.pi * u) ** 2 * 0.35


def sfx_rip(**_):
    d = 0.55
    n = int(d * SR)
    t = T(d)
    grains = np.zeros(n)
    tt = 0.0
    while tt < d * 0.9:
        i = int(tt * SR)
        g = int(R.uniform(0.002, 0.007) * SR)
        grains[i:i + g] += R.uniform(0.3, 1) * np.hanning(g)[: len(grains[i:i + g])]
        tt += R.uniform(0.002, 0.012) * (1.4 - tt / d)
    y = band(noise(n), 700, 7500) * grains
    y += band(noise(n), 300, 1500) * np.exp(-t * 8) * 0.15
    env = np.minimum(1, t / 0.02) * np.exp(-np.maximum(0, t - 0.35) * 14)
    return fade(y * env * 0.9)


def sfx_marker(d=0.5, **_):
    t = T(d)
    strokes = np.abs(np.sin(2 * np.pi * (6.5 + R.uniform(-1, 1)) * t + R.uniform(0, 3))) ** 0.7
    y = band(noise(len(t)), 1200, 5200) * strokes * 0.32
    for _ in range(int(d * 2) + 1):
        s0 = R.uniform(0, max(0.01, d - 0.08))
        tt = T(0.07)
        sq = np.sin(2 * np.pi * (2500 + 150 * np.sin(2 * np.pi * 30 * tt)) * tt) * np.sin(np.pi * tt / 0.07) * 0.06
        i = int(s0 * SR)
        y[i:i + len(sq)] += sq[: len(y[i:i + len(sq)])]
    return fade(y * 0.55, 0.01, 0.04)


def sfx_pencil(d=1.0, **_):
    n = int(d * SR)
    y = np.zeros(n)
    k = 0
    tt = 0.0
    while tt < d - 0.03:
        g = int(0.03 * SR)
        e = np.sin(np.linspace(0, np.pi, g)) ** 0.5
        i = int(tt * SR)
        seg = y[i:i + g]
        seg += (band(noise(g), 2500, 9000) * e * (0.8 if k % 5 == 4 else 0.55))[: len(seg)]
        tt += 0.044
        k += 1
    return y * 0.32


def sfx_printer(d=1.5, **_):
    n = int(d * SR)
    t = T(d)
    y = np.zeros(n)
    for i in range(0, n, int(SR / 75)):
        g = 120
        seg = y[i:i + g]
        seg += (band(noise(g), 1500, 5500) * np.hanning(g))[: len(seg)]
    lines = (np.sin(2 * np.pi * 3.6 * t) > -0.6).astype(float)
    y = y * lines * 0.5 + np.sin(2 * np.pi * 120 * t) * 0.03
    return fade(y, 0.01, 0.05)


def sfx_ding(**_):
    return bell(1568, 1.8, 0.3) + np.concatenate([np.zeros(int(0.07 * SR)), bell(2093, 1.73, 0.18)])[: int(1.8 * SR)]


def sfx_shimmer(**_):
    out = np.zeros(int(2.2 * SR))
    for i, f in enumerate([880, 987.77, 1046.5, 1318.5, 1760]):
        b = bell(f, 1.6, 0.14)
        j = int(i * 0.07 * SR)
        out[j:j + len(b)] += b[: len(out) - j]
    return out


SFX = {
    'spray': sfx_spray, 'rattle': sfx_rattle, 'slap': sfx_slap, 'stamp': sfx_stamp, 'thud': sfx_thud,
    'pop': sfx_pop, 'click': sfx_click, 'whoosh': sfx_whoosh, 'rip': sfx_rip, 'marker': sfx_marker,
    'pencil': sfx_pencil, 'printer': sfx_printer, 'ding': sfx_ding, 'shimmer': sfx_shimmer,
}


def reverb(x, wet=0.12, d=0.9):
    t = T(d)
    ir = noise(len(t)) * np.exp(-t * 5.5)
    ir = band(ir, 200, 7000)
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    N = 1 << int(np.ceil(np.log2(n)))
    y = np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[: len(x)]
    return x + y * wet


def main():
    cues = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    length = cues['duration']
    L, Rr = music(cues['music'], length)
    fx_L, fx_R = np.zeros_like(L), np.zeros_like(Rr)
    duck = np.ones_like(L)
    for c in cues['sfx']:
        kind = c['type']
        if kind not in SFX:
            print('unknown sfx', kind)
            continue
        kw = {}
        if 'dur' in c:
            kw['d'] = c['dur']
        if 'pitch' in c:
            kw['pitch'] = c['pitch']
        sig = SFX[kind](**kw) * c.get('gain', 1.0)
        i = int(c['t'] * SR)
        if i >= len(fx_L):
            continue
        s = sig[: len(fx_L) - i]
        pan = R.uniform(-0.25, 0.25)
        fx_L[i:i + len(s)] += s * (1 - pan)
        fx_R[i:i + len(s)] += s * (1 + pan)
        if kind in ('stamp', 'slap', 'rip'):  # tuck the music under the big hits
            dn = int(0.35 * SR)
            seg = duck[i:i + dn]
            duck[i:i + dn] = np.minimum(seg, 1 - 0.35 * np.exp(-np.arange(len(seg)) / SR * 6))
    mix_L = L * duck * 0.55 + fx_L
    mix_R = Rr * duck * 0.55 + fx_R
    mix_L, mix_R = reverb(mix_L, 0.1), reverb(mix_R, 0.1)
    n = int(length * SR)
    mix = np.stack([mix_L[:n], mix_R[:n]], 1)
    tail = int(0.5 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
    mix /= np.max(np.abs(mix)) / 0.89
    pcm = (mix * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote', out, f'{length:.1f}s')


if __name__ == '__main__':
    main()
