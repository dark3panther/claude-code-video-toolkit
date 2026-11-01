"""Synthesise the music-box chiptune bed and the sound effects for The Whispering Pocket (numpy only).

Based on projects/crow-and-fox/scripts/gen_music.py: same instruments, a new tune.

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
    """A curious, warm music-box tune: F - Dm - Bb - C at 76 bpm."""
    bpm = 76
    beat = 60 / bpm
    buf = np.zeros(int(seconds * SR) + SR)
    chords = [(41, [65, 69, 72]), (38, [62, 65, 69]), (46, [58, 62, 65]), (48, [60, 64, 67])]
    tune = [
        77, None, 76, 74, 72, None, 74, None,
        69, None, 72, None, 74, 72, None, None,
        70, None, 72, 74, 77, None, 76, None,
        74, None, 72, 76, 77, None, None, None,
    ]
    bar = 4 * beat
    t, step = 0.0, 0
    while t < seconds:
        root, triad = chords[(step // 2) % 4]
        add(buf, tone(midi(root), beat * 3.6, "tri", vol=0.28, release=0.6), t)
        # music-box arpeggio: high, short, triangle
        for k in range(8):
            n = triad[[0, 1, 2, 1, 2, 1, 0, 1][k]] + 12
            add(buf, tone(midi(n), beat * 0.3, "tri", vol=0.07, attack=0.003, release=0.25), t + k * beat / 2)
        for k in range(4):
            n = tune[(step * 4 + k) % len(tune)]
            if n is not None:
                add(buf, tone(midi(n), beat * 0.85, "pulse", duty=0.25, vol=0.055, attack=0.02, release=0.4), t + k * beat)
        t += bar
        step += 1
    buf = lowpass(buf, 3000)
    buf = buf[: int(seconds * SR)]
    fade = int(3 * SR)
    buf[-fade:] *= np.linspace(1, 0, fade)
    buf[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
    return buf / np.max(np.abs(buf)) * 0.5


def twinkle():
    """Pebble glow and sparkles."""
    out = np.zeros(int(0.7 * SR))
    for i, n in enumerate([84, 88, 91, 96, 100]):
        add(out, tone(midi(n), 0.2, "pulse", duty=0.25, vol=0.22, release=0.18), i * 0.07)
    return lowpass(out, 6000)


def creak():
    """Old cupboard doors: a slow, wobbling low pulse sweep."""
    d = 0.9
    n = int(d * SR)
    f = np.linspace(140, 230, n) * (1 + 0.08 * np.sin(np.arange(n) / SR * 2 * np.pi * 9))
    s = tone(f, d, "pulse", duty=0.15, vol=0.5, attack=0.05, release=0.3)
    return lowpass(s, 1800) * 0.6


def whoosh():
    """Letters flying up: filtered noise that rises."""
    d = 0.6
    s = tone(0, d, "noise", vol=0.5, attack=0.15, release=0.35)
    return lowpass(s, 2500) * np.linspace(0.3, 1, len(s)) * 0.5


def chime():
    """The time-capsule reveal: a bright rising arpeggio."""
    out = np.zeros(int(1.4 * SR))
    for i, n in enumerate([65, 69, 72, 77, 81, 84]):
        add(out, tone(midi(n), 0.7, "tri", vol=0.3, attack=0.005, release=0.6), i * 0.09)
    return lowpass(out, 7000) * 0.8


def step_tap():
    """A soft footstep."""
    return lowpass(tone(np.linspace(220, 90, int(0.07 * SR)), 0.07, "tri", vol=0.5, release=0.05), 900) * 0.5


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
    for name, fn in [("twinkle", twinkle), ("creak", creak), ("whoosh", whoosh), ("chime", chime), ("step", step_tap), ("blip", blip)]:
        sf.write(root / "sfx" / f"{name}.wav", fn(), SR)
    print("wrote music.wav and sfx/")


if __name__ == "__main__":
    main()
