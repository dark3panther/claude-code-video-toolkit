# Audio scripts

## Voices (`gen_audio.py`)

Kokoro-82M runs offline through `kokoro-onnx`. Hugging Face was unreachable when this was built, so the weights
come from npm:

```bash
npm pack kokoro-q8-shards@1.0.0 kokoro-local-runtime@0.1.0
tar xzf kokoro-q8-shards-1.0.0.tgz && cat package/kokoro-q8.part*.bin > kokoro-q8.onnx   # sha256 fbae9257...
tar xzf kokoro-local-runtime-0.1.0.tgz                                                   # package/voices/*.bin
pip install kokoro-onnx phonemizer-fork onnx soundfile
```

Two one-off conversions:

```python
# voices.npz from the per-voice float32 files (510 x 256 each)
import numpy as np, glob, os
np.savez('voices.npz', **{os.path.basename(f)[:-4]: np.fromfile(f, np.float32).reshape(510, 1, 256)
                          for f in glob.glob('package/voices/*.bin')})

# expose the predicted phoneme durations as a second output (exact word timing for captions)
import onnx
m = onnx.load('kokoro-q8.onnx')
m.graph.output.append(onnx.helper.make_tensor_value_info('/encoder/Clip_output_0', onnx.TensorProto.FLOAT, None))
onnx.save(m, 'kokoro-q8-dur.onnx')
```

`espeakng-loader` 0.2.x has a build path baked in for its data folder. If phonemizing fails with
`.../espeak-ng-data/phontab: No such file or directory`, symlink that path to the package's
`espeakng_loader/espeak-ng-data` directory.

## Music and sound effects (`gen_music.py`)

Pure numpy chiptune: triangle bass, 25% pulse arpeggio and a soft pentatonic lead at 84 bpm, low-passed.
Also writes `sfx/caw.wav`, `plop.wav`, `twinkle.wav` and `blip.wav`.
