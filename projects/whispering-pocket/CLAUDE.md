# Project: whispering-pocket

**Template:** custom pixel-art Remotion build, in the style of `projects/crow-and-fox` | **Phase:** complete (pilot)

The pilot for the Reading Buddy story videos: *The Boy with the Whispering Pocket*, voiced as an
animated film with ElevenLabs and drawn with pxl. Final: `out/whispering-pocket.mp4` (1920x1080, 30fps,
85.9 s, -14.8 LUFS, `qc.py --render` passes). Also used by Reading Buddy (Story Quest game and the
"Watch the story" button).

## How it is built

- **Voice:** `PERFORMANCE-SCRIPT.md` analyses every line (emotion, delivery, intensity, pace, gesture) and
  gives the tagged text recorded with ElevenLabs `eleven_v4` (Narrator Katie, Leo = Teddy Twinkle, Mrs. Lin
  = Grandma Muffins). Recordings are in `voice/`. All lines were joined with 1.2 s gaps
  (`voice/offsets.json`) and transcribed once with Scribe (`voice/transcript-words.json`) for word timing.
- **Timeline:** `python scripts/build_timeline.py` converts the recordings to `public/audio/vo/*.wav` and
  writes `src/timeline.json` (scenes, voice offsets, per-word times; captions use the story's own words).
- **Art:** `art/story.px.js` (pxl, github.com/dark3panther/claude-pxl): Leo and Mrs. Lin built from shared
  parts in every pose, props, the playground and classroom sets, Story Quest stones and flags. Palette =
  The Crow and the Fox. Build, then copy: `node <pxl>/bin/pxl.js build art/story.px.js && node scripts/copy_art.mjs`.
- **Video:** `src/Stage.tsx` is a 240x135 stage shown at 8x; sprites sit on whole pixels. `src/Scenes.tsx`
  keys every action to a spoken word (`at(scene, 'word')`). Music and effects: `python scripts/gen_music.py --seconds 90`.

## Making the next story (the recipe)

1. Copy this folder to `projects/<story-id>` (without `out/`, `voice/`, `node_modules`).
2. Write `PERFORMANCE-SCRIPT.md`: cast (reuse a character's voice whenever the character returns), arc,
   and a line-by-line table with the tagged text. Words stay exactly the story's words.
3. Record each paragraph and each spoken line with `eleven_v4` (one take is enough once voices are cast),
   download into `voice/`, join with gaps, transcribe once with Scribe, save `offsets.json` and
   `transcript-words.json`.
4. Edit `TEXT`, `SPEAKER` and `SCENES` in `scripts/build_timeline.py`; run it.
5. Draw the story's characters, props and sets in `art/story.px.js` (keep the palette and the people's
   proportions); build and copy.
6. Write the scenes in `src/Scenes.tsx`, render, `qc.py --render ... --fix`, keep the loudnorm version.
7. For Reading Buddy: copy `public/art/*.png`, `src/art.json` (as `sizes.json`) and `public/audio/sfx/*.wav`
   to `reading-buddy/public/game/<story-id>/`, the video to `public/videos/`, and add a level file in
   `reading-buddy/src/games/`.

Cost for this pilot: about 2,400 ElevenLabs credits for the voices (two takes of every line) and 451 for
the transcription.

## Quick commands

```bash
cd projects/whispering-pocket
npm run studio    # preview (node_modules is a link to crow-and-fox's)
npm run render    # then: uv run tools/qc.py --render projects/whispering-pocket/out/whispering-pocket.mp4 --fix
```
