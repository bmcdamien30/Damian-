#!/usr/bin/env python3
"""Soundtrack for the foundry sequence: a dark drone, heavy hits, and foundry sound effects.

usage: forge_audio.py cues.json out.wav
Reads the cue list dumped by `node record.js page.html --sfx cues.json`. Every sound is
synthesized from oscillators and filtered noise (helpers shared with audio.py).
"""
import json, os, sys, wave
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, T, band, fade, noise, sweep_sine, bell, reverb, sfx_shimmer  # noqa: E402

R = np.random.default_rng(11)


def env(n, a, r):
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def grains(n, rate, lo=0.002, hi=0.008):
    g = np.zeros(n)
    t = 0.0
    while t < n / SR:
        i = int(t * SR)
        k = int(R.uniform(lo, hi) * SR)
        seg = g[i:i + k]
        seg += R.uniform(0.2, 1) * np.hanning(k)[: len(seg)]
        t += R.exponential(1 / rate)
    return g


# ---------- effects ----------
def rumble(d=2.8, **_):
    t = T(d)
    y = 0.5 * np.sin(2 * np.pi * 34 * t) + 0.3 * np.sin(2 * np.pi * 41 * t + 1)
    y += band(noise(len(t)), 20, 140) * 2.0
    return y * env(len(t), 0.8, 0.6) * 0.5


def crack(d=0.8, **_):
    t = T(d)
    n = len(t)
    hiss = band(noise(n), 3000, 12000) * np.linspace(0.2, 1, n)
    cr = band(noise(n), 1500, 7000) * grains(n, 60)
    return (hiss * 0.25 + cr * 0.9) * env(n, 0.05, 0.2) * 0.6


def clank(**_):
    t = T(1.2)
    y = sum(a * np.sin(2 * np.pi * 310 * r * t) * np.exp(-t * dcy) for r, a, dcy in [(1, 1, 6), (2.76, 0.6, 9), (5.4, 0.35, 14), (8.9, 0.2, 20)])
    y += band(noise(len(t)), 1000, 8000) * np.exp(-t * 60) * 0.8
    y += sweep_sine(120, 50, 1.2, 20) * np.exp(-t * 12) * 0.8
    return fade(np.tanh(y * 0.9) * 0.6)


def grind(d=1.8, **_):
    t = T(d)
    n = len(t)
    fr = np.abs(np.sin(2 * np.pi * np.cumsum(25 + 15 * noise(n) * 0.02) / SR)) ** 2
    low = band(noise(n), 60, 700) * (0.6 + 0.4 * fr)
    f = 72 + 10 * np.sin(2 * np.pi * 0.8 * t) + 6 * band(noise(n), 1, 20) * 20
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 * (0.7 + 0.3 * fr)
    scrape = band(noise(n), 1500, 4500) * 0.12 * fr
    return (low * 1.6 + tone + scrape) * env(n, 0.2, 0.3) * 0.55


def roar(d=10.8, **_):
    t = T(d)
    n = len(t)
    y = band(noise(n), 40, 900) * (1 + 0.25 * np.sin(2 * np.pi * 0.35 * t))
    y += band(noise(n), 900, 4000) * grains(n, 18) * 0.5
    shape = np.minimum(1, t / 1.2) * np.clip(1 - (t - (d - 3)) / 3, 0, 1)
    return y * shape * 0.55


def thud(**_):
    t = T(1.4)
    y = sweep_sine(80, 34, 1.4, 6) * np.exp(-t * 3.5)
    y += band(noise(len(t)), 80, 1500) * np.exp(-t * 18) * 0.7
    return fade(np.tanh(y * 1.6) * 0.9)


def chain(d=2.6, gain=1.0, **_):
    n = int((d + 0.3) * SR)
    y = np.zeros(n)
    t = 0.0
    while t < d:
        speed = 0.5 + 0.5 * abs(np.sin(np.pi * t / 1.55))
        k = int(0.06 * SR)
        tt = T(0.06)
        c = sum(np.sin(2 * np.pi * R.uniform(1200, 3200) * tt) for _ in range(3)) * np.exp(-tt * 70) * 0.22
        c += band(noise(k), 1500, 9000) * np.exp(-tt * 150) * 0.3
        i = int(t * SR)
        seg = y[i:i + k]
        seg += c[: len(seg)] * speed * (1 - t / (d + 0.5))
        t += R.uniform(0.04, 0.12) / speed
    return y * 0.6


def creak(d=0.7, **_):
    t = T(d)
    n = len(t)
    f = 160 + 40 * np.sin(2 * np.pi * 3 * t) + 25 * band(noise(n), 1, 30) * 30
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sign(np.sin(ph)) * (0.5 + 0.5 * np.abs(band(noise(n), 5, 60)) * 4)
    y = band(y, 300, 2500)
    return y * env(n, 0.08, 0.25) * 0.18


def pour(d=1.8, **_):
    t = T(d)
    n = len(t)
    bub = band(noise(n), 120, 900) * (0.6 + grains(n, 40, 0.01, 0.03))
    hiss = band(noise(n), 2000, 7000) * 0.25
    return (bub + hiss) * env(n, 0.1, 0.4) * 0.55


def whoomph(**_):
    d = 2.2
    t = T(d)
    n = len(t)
    lo, mid, hi = band(noise(n), 60, 400), band(noise(n), 400, 1800), band(noise(n), 1800, 6000)
    u = np.minimum(1, t / 0.25)
    y = lo * (1 - u) * 1.6 + mid * u + hi * u * 0.6
    y *= np.minimum(1, t / 0.03) * np.exp(-t * 1.6)
    y += sweep_sine(90, 38, d, 5) * np.exp(-t * 3) * 0.9
    return fade(np.tanh(y * 1.4) * 0.9)


def crackle(d=4.0, **_):
    t = T(d)
    n = len(t)
    y = band(noise(n), 1200, 6500) * grains(n, 45) * 0.9
    y += band(noise(n), 100, 1000) * 0.35
    return y * env(n, 0.2, 1.2) * 0.5


def jet(pitch=1.0, **_):
    d = 0.45
    t = T(d)
    n = len(t)
    a, b = band(noise(n), 600 * pitch, 2000 * pitch), band(noise(n), 2000 * pitch, 7000 * pitch)
    u = t / d
    y = a * (1 - u) + b * u
    return y * np.sin(np.pi * u) ** 1.5 * 0.45


def steam(d=2.8, **_):
    t = T(d)
    n = len(t)
    y = band(noise(n), 3500, 14000) * (1 + 0.2 * np.sin(2 * np.pi * 6 * t))
    return y * np.minimum(1, t / 0.15) * np.exp(-t * 0.9) * 0.14


def ping(pitch=1.0, **_):
    return bell(2600 * pitch, 0.6, 0.12) + bell(3900 * pitch, 0.6, 0.05)


def plop(**_):
    t = T(0.45)
    n = len(t)
    y = sweep_sine(320, 140, 0.45, 18) * np.exp(-t * 18) * 0.5
    y += band(noise(n), 3000, 12000) * np.exp(-t * 7) * 0.3
    return y * 0.5


def riser(d=2.45, **_):
    t = T(d)
    n = len(t)
    u = t / d
    lo, hi = band(noise(n), 200, 1200), band(noise(n), 1500, 9000)
    y = (lo * (1 - u) + hi * u) * u ** 2 * 0.6
    f = 70 * (1 + 5 * u ** 2.2)
    y += np.sin(2 * np.pi * np.cumsum(f) / SR) * u ** 1.5 * 0.25
    y += np.sin(2 * np.pi * 36 * t) * u ** 2 * 0.4
    return y


def boom(**_):
    d = 3.2
    t = T(d)
    y = sweep_sine(70, 28, d, 3) * np.exp(-t * 1.4) * 1.1
    y += band(noise(len(t)), 30, 600) * np.exp(-t * 4) * 0.9
    y += band(noise(len(t)), 600, 5000) * np.exp(-t * 25) * 0.4
    return fade(np.tanh(y * 1.8) * 0.95, 0.001, 0.4)


def hit(**_):
    d = 1.6
    t = T(d)
    y = sweep_sine(110, 52, d, 9) * np.exp(-t * 4) * 1.0
    y += band(noise(len(t)), 100, 2500) * np.exp(-t * 22) * 0.7
    return fade(np.tanh(y * 1.5) * 0.8)


SFX = {k: v for k, v in globals().items() if k in (
    'rumble', 'crack', 'clank', 'grind', 'roar', 'thud', 'chain', 'creak', 'pour', 'whoomph', 'crackle',
    'jet', 'steam', 'ping', 'plop', 'riser', 'boom')}
SFX['shimmer'] = sfx_shimmer


def drone(length, hits, end):
    t = T(length)
    n = len(t)
    y = np.zeros(n)
    for f, a in [(55, 0.5), (82.41, 0.3), (110, 0.18), (164.8, 0.08)]:
        for h in range(1, 5):
            y += a / h * np.sin(2 * np.pi * f * h * t * (1 + 0.0007 * h) + h)
    y = band(y, 30, 900)
    swell = np.minimum(1, np.maximum(0, (t - 0.8) / 2.5)) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t))
    swell *= np.clip(1 - (t - end) / 0.4, 0, 1)
    y *= swell * 0.35
    for h in hits:
        s = hit()
        i = int(h * SR)
        seg = y[i:i + len(s)]
        seg += s[: len(seg)]
    return y


def main():
    cues = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    length = cues['duration']
    m = cues['music']
    n = int((length + 1) * SR)
    L, Rr = np.zeros(n), np.zeros(n)
    d = drone(length + 1, [h for h in m['hits'][:-1]], m['hits'][-1])
    L[: len(d)] += d
    Rr[: len(d)] += np.roll(d, 90)
    for c in cues['sfx']:
        kind = c['type']
        kw = {}
        if 'dur' in c:
            kw['d'] = c['dur']
        if 'pitch' in c:
            kw['pitch'] = c['pitch']
        sig = SFX[kind](**kw) * c.get('gain', 1.0)
        i = int(c['t'] * SR)
        s = sig[: n - i]
        pan = R.uniform(-0.2, 0.2)
        L[i:i + len(s)] += s * (1 - pan)
        Rr[i:i + len(s)] += s * (1 + pan)
    L, Rr = reverb(L, 0.16, 1.4), reverb(Rr, 0.16, 1.4)
    k = int(length * SR)
    mix = np.stack([L[:k], Rr[:k]], 1)
    tail = int(0.3 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
    mix /= np.max(np.abs(mix)) / 0.89
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype('<i2').tobytes())
    print('wrote', out, f'{length:.1f}s')


if __name__ == '__main__':
    main()
