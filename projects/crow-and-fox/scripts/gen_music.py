"""Synthesise the gentle 8-bit music bed and the chiptune sound effects (numpy only).

    python scripts/gen_music.py --seconds 90
"""
import argparse
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tone(freq, dur, kind="pulse", duty=0.5, vol=1.0, attack=0.01, release=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) else np.full(n, float(freq))
    phase = np.cumsum(f) / SR % 1.0
    if kind == "pulse":
        w = np.where(phase < duty, 1.0, -1.0)
    elif kind == "tri":
        w = 4 * np.abs(phase - 0.5) - 1
    else:  # noise
        w = np.random.default_rng(1).uniform(-1, 1, n)
    env = np.ones(n)
    a = max(1, int(attack * SR))
    r = max(1, min(n, int(release * SR)))
    env[:a] = np.linspace(0, 1, a)
    env[-r:] *= np.linspace(1, 0, r)
    return w * env * vol


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def add(buf, sig, at):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i]


def music(seconds):
    bpm = 84
    beat = 60 / bpm
    buf = np.zeros(int(seconds * SR) + SR)
    # C - Am - F - G, two bars each (4/4)
    chords = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [53, 57, 60]), (43, [55, 59, 62])]
    # a gentle pentatonic tune, one note per beat (None = rest), 8 bars per phrase
    tune = [
        76, None, 74, 72, 74, None, 76, None,
        72, None, 69, None, 72, 74, None, None,
        69, None, 72, 74, 72, None, 69, None,
        67, None, 71, 74, 72, None, None, None,
    ]
    bar = 4 * beat
    t, step = 0.0, 0
    while t < seconds:
        root, triad = chords[(step // 2) % 4]
        # triangle bass on beats 1 and 3
        for b in (0, 2):
            add(buf, tone(midi(root), beat * 1.8, "tri", vol=0.32, release=0.3), t + b * beat)
        # soft arpeggio, eighth notes, 25% pulse
        for k in range(8):
            n = triad[[0, 1, 2, 1][k % 4]]
            add(buf, tone(midi(n), beat * 0.45, "pulse", duty=0.25, vol=0.05, release=0.12), t + k * beat / 2)
        # melody
        for k in range(4):
            n = tune[(step * 4 + k) % len(tune)]
            if n is not None:
                add(buf, tone(midi(n), beat * 0.9, "pulse", duty=0.5, vol=0.07, attack=0.02, release=0.35), t + k * beat)
        t += bar
        step += 1
    buf = lowpass(buf, 3200)
    buf = buf[: int(seconds * SR)]
    fade = int(3 * SR)
    buf[-fade:] *= np.linspace(1, 0, fade)
    buf[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
    return buf / np.max(np.abs(buf)) * 0.5


def caw():
    """Two-part scratchy chiptune 'caw': a falling pulse sweep with noise grit."""
    d = 0.26
    n = int(d * SR)
    f = np.linspace(980, 560, n) * (1 + 0.04 * np.sin(np.arange(n) / SR * 2 * np.pi * 38))
    s = tone(f, d, "pulse", duty=0.3, vol=0.8, attack=0.005, release=0.09)
    s += tone(0, d, "noise", vol=0.18, attack=0.005, release=0.1)
    return lowpass(s, 5000) * 0.8


def plop():
    d = 0.16
    n = int(d * SR)
    f = 700 * np.exp(-np.arange(n) / SR * 18) + 110
    s = tone(f, d, "tri", vol=1.0, attack=0.002, release=0.08)
    s += tone(f * 2, d, "pulse", duty=0.5, vol=0.12, attack=0.002, release=0.12)
    return s * 0.8


def twinkle():
    out = np.zeros(int(0.6 * SR))
    for i, n in enumerate([84, 88, 91, 96]):
        add(out, tone(midi(n), 0.18, "pulse", duty=0.25, vol=0.25, release=0.15), i * 0.07)
    return lowpass(out, 6000)


def blip():
    """Little pop for key-word cards appearing."""
    return tone(np.linspace(midi(72), midi(84), int(0.09 * SR)), 0.09, "pulse", duty=0.5, vol=0.3, release=0.05)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seconds", type=float, required=True)
    args = ap.parse_args()
    root = Path(__file__).resolve().parent.parent / "public" / "audio"
    (root / "sfx").mkdir(parents=True, exist_ok=True)
    sf.write(root / "music.wav", music(args.seconds), SR)
    sf.write(root / "sfx" / "caw.wav", caw(), SR)
    sf.write(root / "sfx" / "plop.wav", plop(), SR)
    sf.write(root / "sfx" / "twinkle.wav", twinkle(), SR)
    sf.write(root / "sfx" / "blip.wav", blip(), SR)
    print("wrote music.wav and sfx/")


if __name__ == "__main__":
    main()
