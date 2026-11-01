"""Turn the ElevenLabs recordings into public/audio/vo/*.wav and src/timeline.json.

The voice lines were recorded with eleven_v4 (see PERFORMANCE-SCRIPT.md) and saved in voice/. For word
timing, every line was joined into one file with 1.2 s gaps (voice/offsets.json gives where each line
starts) and transcribed once with ElevenLabs Scribe (voice/transcript-words.json). Captions show the
story's own words; each is given the time of the matching transcribed word.

    python scripts/build_timeline.py
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE = ROOT / "voice"

# The story's words for each recorded line (what the captions show).
TEXT = {
    "title": "The Boy with the Whispering Pocket",
    "p1": "Leo found a small pebble on the playground. It was round and smooth. It glowed a soft green.",
    "p2": "Leo put the pebble in his pocket. Then he went back to class.",
    "p3": "When Leo walked past the old cupboard, his pocket began to hum. Hmm, hmm, hmm. It was a happy little tune.",
    "p4": "Leo stepped away. The humming stopped. Leo stepped back. The humming started again.",
    "leo": '"There is a secret in this cupboard,"',
    "leosaid": "Leo said.",
    "p6": "Leo and his teacher, Mrs. Lin, opened the cupboard. At the very back was a dusty tin box. Inside the box were letters and drawings. They were from children who sat in this class fifty years ago!",
    "lin": '"It is a time capsule,"',
    "linsaid": "said Mrs. Lin.",
    "p8": "The pebble stopped humming. Leo smiled. The secret was found.",
    "words": "pebble pocket cupboard secret time capsule",
}
SPEAKER = {"leo": "L", "lin": "T"}  # everything else is the narrator, "N"

# Scenes: (id, [(line, start seconds in the scene), ...], tail seconds after the last line)
SCENES = [
    ("title", [("title", 0.8)], 1.2),
    ("playground", [("p1", 1.6), ("p2", 10.1)], 2.2),
    ("hum", [("p3", 1.6)], 1.0),
    ("hotcold", [("p4", 0.6)], 1.2),
    ("secret", [("leo", 0.6), ("leosaid", 4.0)], 1.0),
    ("open", [("p6", 2.2)], 1.2),
    ("capsule", [("lin", 0.6), ("linsaid", 3.1)], 1.2),
    ("ending", [("p8", 0.6)], 2.2),
    ("words", [("words", 0.8)], 1.6),
]

norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())


def line_words(name, offs, heard):
    """Story tokens of one line with times relative to the line's own audio."""
    start, dur = offs[name]
    mine = [w for w in heard if start - 0.05 <= w["end"] <= start + dur + 0.3]
    tokens = TEXT[name].split()
    out, j = [], 0
    for tok in tokens:
        if j < len(mine) and norm(mine[j]["text"]) == norm(tok):
            w = mine[j]
            j += 1
            s, e = w["start"] - start, w["end"] - start
            out.append({"text": tok, "start": round(max(s, e - 0.6, 0), 3), "end": round(e, 3)})
        else:
            out.append({"text": tok, "start": None, "end": None})  # sung or missed: fill below
    if j != len(mine):
        raise SystemExit(f"{name}: matched {j} of {len(mine)} heard words")
    # fill gaps (the hummed "Hmm, hmm, hmm") evenly between their neighbours
    i = 0
    while i < len(out):
        if out[i]["start"] is None:
            k = i
            while k < len(out) and out[k]["start"] is None:
                k += 1
            a = out[i - 1]["end"] + 0.25 if i else 0.0
            b = (out[k]["start"] - 0.3) if k < len(out) else dur
            step = (b - a) / (k - i)
            for n in range(i, k):
                out[n]["start"] = round(a + step * (n - i), 3)
                out[n]["end"] = round(a + step * (n - i + 0.8), 3)
            i = k
        i += 1
    return out


def main():
    offs = json.loads((VOICE / "offsets.json").read_text())
    heard = json.loads((VOICE / "transcript-words.json").read_text())["words"]
    vo = ROOT / "public" / "audio" / "vo"
    vo.mkdir(parents=True, exist_ok=True)
    scenes = []
    for sid, lines, tail in SCENES:
        words, audio, end = [], [], 0.0
        for name, at in lines:
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(VOICE / f"{name}.mp3"), "-ar", "48000", str(vo / f"{name}.wav")], check=True)
            audio.append({"file": f"audio/vo/{name}.wav", "start": at, "speaker": SPEAKER.get(name, "N")})
            for w in line_words(name, offs, heard):
                words.append({**w, "start": round(w["start"] + at, 3), "end": round(w["end"] + at, 3), "speaker": SPEAKER.get(name, "N")})
            end = max(end, at + offs[name][1])
        # sentences for the captions: split after . ! ? (keeping a closing quote)
        sentences, cur = [], []
        for w in words:
            cur.append(w)
            ends = re.search(r'[.!?]"?$', w["text"]) and w["text"] != "Mrs."
            if ends or (sid == "words" and w["text"] != "time"):
                sentences.append({"start": cur[0]["start"], "end": cur[-1]["end"], "words": cur})
                cur = []
        if cur:
            sentences.append({"start": cur[0]["start"], "end": cur[-1]["end"], "words": cur})
        scenes.append({"id": sid, "sentences": sentences, "audio": audio, "duration": round(end + tail, 3)})
    out = ROOT / "src" / "timeline.json"
    out.write_text(json.dumps({"scenes": scenes}, indent=1))
    total = sum(s["duration"] for s in scenes)
    print(f"wrote {out.name}: {len(scenes)} scenes, {total:.1f}s before transitions")


if __name__ == "__main__":
    main()
