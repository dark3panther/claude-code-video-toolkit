"""Generate every voice line with Kokoro-82M (offline) and write src/timeline.json.

Each sentence is made of chunks, each chunk spoken by one character. Word timings
come straight from the model's predicted phoneme durations (an extra graph output,
600 audio samples per duration frame), so the caption highlight is exact.

Usage (from this project folder):
    python scripts/gen_audio.py --model kokoro-q8-dur.onnx --voices voices.npz
"""
import argparse
import json
import re
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx.tokenizer import Tokenizer

SR = 24000
HOP = 600
PUNCT = set(';:,.!?\u00a1\u00bf\u2014\u2026"\u00ab\u00bb\u201c\u201d ')

VOICES = {
    "N": ("af_heart", 0.7),   # narrator: calm, clear, slow
    "F": ("am_michael", 0.76),  # the Fox
    "C": ("bf_emma", 0.76),    # the Crow
}

# Gaps in seconds
CHUNK_GAP = 0.25
SENTENCE_GAP = 0.55
LEAD_IN = 0.9
TAIL = 0.8

# scene id -> list of sentences; sentence = list of (voice, caption text) chunks,
# optional "after" pause (seconds) for on-screen action following the sentence.
SCRIPT = [
    ("title", [
        {"chunks": [("N", "The Crow and the Fox.")], "after": 0.5},
    ]),
    ("cheese", [
        {"chunks": [("N", "One morning, a crow found a piece of cheese.")], "after": 0.6},
        {"chunks": [("N", "She flew up into a tall tree.")], "after": 1.0},
    ]),
    ("fox", [
        {"chunks": [("N", "A hungry fox walked by.")], "after": 0.5},
        {"chunks": [("N", "He saw the cheese.")], "after": 0.4},
        {"chunks": [("F", '"I want that cheese!"'), ("N", "he said.")]},
    ]),
    ("flatter", [
        {"chunks": [("F", '"Hello, Crow!"'), ("N", "said the Fox.")]},
        {"chunks": [("F", '"Your feathers are so shiny.')]},
        {"chunks": [("F", "I think your voice is beautiful too.")]},
        {"chunks": [("F", 'Please sing for me!"')]},
    ]),
    ("sing", [
        {"chunks": [("N", "The Crow felt very proud.")], "after": 0.3},
        {"chunks": [("N", "She opened her beak and sang,"), ("C", '"Caw! Caw!"')], "after": 0.6},
    ]),
    ("fall", [
        {"chunks": [("N", "The cheese fell down.")], "after": 1.0},
        {"chunks": [("N", "The Fox caught it and ran away.")], "after": 0.3},
        {"chunks": [("F", '"Thank you!"'), ("N", "he laughed.")], "after": 0.8},
    ]),
    ("moral", [
        {"chunks": [("N", "Moral: Be careful when someone says nice things just to get something from you.")], "after": 0.7},
    ]),
    ("words", [
        {"chunks": [("N", w)], "after": 0.25, "gap": 0.0}
        for w in ["crow", "fox", "cheese", "tree", "feathers", "beak", "sing"]
    ]),
]


def speakable(text: str) -> str:
    return text.replace('"', "").strip()


class Voice:
    def __init__(self, model: str, voices: str):
        self.sess = ort.InferenceSession(model)
        self.voices = np.load(voices)
        self.tok = Tokenizer()

    def say(self, text: str, voice: str, speed: float):
        """Returns (audio, [(start, end)] per caption word)."""
        words = text.split()
        ph = self.tok.phonemize(speakable(text), "en-us")
        ph_words = ph.split(" ")
        ids, word_of = [], []
        for wi, pw in enumerate(ph_words):
            for ch in pw:
                if ch in self.tok.vocab:
                    ids.append(self.tok.vocab[ch])
                    # punctuation carries the pause after a word, not the word itself
                    word_of.append(-1 if ch in PUNCT else wi)
            if wi < len(ph_words) - 1:
                ids.append(self.tok.vocab[" "])
                word_of.append(-1)
        style = self.voices[voice][len(ids)]
        audio, dur = self.sess.run(None, {
            "input_ids": np.array([[0, *ids, 0]], dtype=np.int64),
            "style": style.astype(np.float32),
            "speed": np.array([speed], dtype=np.float32),
        })
        audio = audio.ravel()
        dur = dur.ravel()  # includes BOS and EOS
        cum = np.concatenate([[0], np.cumsum(dur)])
        spans = {}
        for i, wi in enumerate(word_of):
            if wi < 0:
                continue
            s, e = cum[i + 1] * HOP / SR, cum[i + 2] * HOP / SR
            a, b = spans.get(wi, (s, e))
            spans[wi] = (min(a, s), max(b, e))
        spans = [spans[i] for i in sorted(spans)]
        if len(spans) != len(words):
            # phonemizer merged/split words: fall back to spreading the span evenly by length
            print(f"  ! word count mismatch for {text!r}: {len(spans)} vs {len(words)}")
            t0, t1 = spans[0][0], spans[-1][1]
            total = sum(len(w) for w in words)
            acc, spans = t0, []
            for w in words:
                d = (t1 - t0) * len(w) / total
                spans.append((acc, acc + d))
                acc += d
        # trim the model's leading and trailing silence
        a = max(0, int((spans[0][0] - 0.06) * SR))
        b = min(len(audio), int((spans[-1][1] + 0.3) * SR))
        audio = audio[a:b].copy()
        fade = int(0.03 * SR)
        audio[-fade:] *= np.linspace(1, 0, fade)
        off = a / SR
        return audio, [(x - off, y - off) for x, y in spans]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    args = ap.parse_args()

    root = Path(__file__).resolve().parent.parent
    out_dir = root / "public" / "audio" / "vo"
    out_dir.mkdir(parents=True, exist_ok=True)
    tts = Voice(args.model, args.voices)

    timeline = {"scenes": []}
    for sid, sentences in SCRIPT:
        t = LEAD_IN
        scene = {"id": sid, "sentences": [], "audio": []}
        for si, sent in enumerate(sentences):
            if si > 0:
                t += sent.get("gap", SENTENCE_GAP)
            words_out, s_start = [], t
            for ci, (who, text) in enumerate(sent["chunks"]):
                if ci > 0:
                    t += CHUNK_GAP
                voice, speed = VOICES[who]
                audio, spans = tts.say(text, voice, speed)
                name = f"{sid}_{si}_{ci}.wav"
                sf.write(out_dir / name, audio, SR)
                scene["audio"].append({"file": f"audio/vo/{name}", "start": round(t, 3), "speaker": who})
                for w, (a, b) in zip(text.split(), spans):
                    words_out.append({"text": w, "start": round(t + a, 3), "end": round(t + b, 3), "speaker": who})
                t += len(audio) / SR
            scene["sentences"].append({"start": round(s_start, 3), "end": round(t, 3), "words": words_out})
            t += sent.get("after", 0)
        scene["duration"] = round(t + TAIL, 3)
        timeline["scenes"].append(scene)
        wpm = sum(len(s["words"]) for s in scene["sentences"]) / max(
            1e-6, sum(s["end"] - s["start"] for s in scene["sentences"])) * 60
        print(f"{sid:8s} {scene['duration']:6.2f}s  ~{wpm:.0f} wpm")

    total = sum(s["duration"] for s in timeline["scenes"])
    print(f"total (before transition overlap): {total:.2f}s")
    (root / "src" / "timeline.json").write_text(json.dumps(timeline, indent=1))


if __name__ == "__main__":
    main()
