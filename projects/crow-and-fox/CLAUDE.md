# Project: crow-and-fox

**Template:** custom pixel-art Remotion build | **Brand:** none | **Phase:** complete

## Current Status

Video complete: `out/crow-and-fox.mp4` (1920x1080, 30fps, 83.4s, -15.1 LUFS). `qc.py --render` passes.

## How it is built

- Every frame is drawn into a 240x135 palette-indexed `Grid` (`src/pixel/raster.ts`) and shown at 8x on a
  `<canvas>` with `image-rendering: pixelated`, so all edges stay on the pixel grid.
- The crow and fox are pure functions of their pose (`src/pixel/sprites.ts`), so they match in every scene.
  `SpriteSheet` composition shows all poses; `Sample` is the approved look frame.
- `src/timeline.json` (written by `scripts/gen_audio.py`) holds per-scene durations, voice clip offsets and
  per-word times. Scenes in `src/Scenes.tsx` key their actions to those word times.
- Transitions: `pixelate({ crisp: true })` from `lib/transitions` (hard-edged mosaic, no blur).
- Font: Jersey 10 (`@fontsource/jersey-10`), chosen because its "C" reads clearly for early readers.

## Scenes

| # | Scene | Duration |
|---|-------|----------|
| 1 | Title | 4.4s |
| 2 | Crow finds the cheese, flies to the tree | 10.6s |
| 3 | The fox arrives | 12.3s |
| 4 | The fox flatters | 15.7s |
| 5 | The crow sings | 10.2s |
| 6 | The cheese falls, the fox runs | 13.3s |
| 7 | Moral | 8.9s |
| 8 | Key words | 12.5s |

## Regenerating audio

Voices use Kokoro-82M offline (no API key). Weights come from npm (`kokoro-q8-shards`, voices from
`kokoro-local-runtime`); see `scripts/README.md`. Then:

```bash
python scripts/gen_audio.py --model kokoro-q8-dur.onnx --voices voices.npz   # voices + src/timeline.json
python scripts/gen_music.py --seconds 90                                     # music + sfx
```

## Quick Commands

```bash
cd projects/crow-and-fox
npm run studio    # Preview in browser
npm run render    # Final render, then: uv run tools/qc.py --render projects/crow-and-fox/out/crow-and-fox.mp4 --fix
```

## Session History

- 2026-10-29: Project created; pixel-art engine, sprites and sample frame approved
- 2026-10-30: Voices, music, SFX, all 8 scenes, crisp pixelate transition; rendered and QC passed

---
*Auto-generated from project.json. Do not edit manually.*
