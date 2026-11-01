import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { pixelate } from '../../../lib/transitions';
import { CapsuleScene, EndingScene, HotColdScene, HumScene, OpenScene, PlaygroundScene, SecretScene, TitleScene, WordsScene } from './Scenes';
import { scene, sceneFrames, TOTAL_FRAMES, TRANSITION_FRAMES } from './story';

const ORDER: [string, React.FC][] = [
  ['title', TitleScene], ['playground', PlaygroundScene], ['hum', HumScene], ['hotcold', HotColdScene], ['secret', SecretScene],
  ['open', OpenScene], ['capsule', CapsuleScene], ['ending', EndingScene], ['words', WordsScene],
];

export const WhisperingPocket: React.FC = () => (
  <AbsoluteFill style={{ background: '#1a1c2c' }}>
    <TransitionSeries>
      {ORDER.flatMap(([id, Comp], i) => [
        ...(i > 0 ? [<TransitionSeries.Transition key={`t-${id}`} presentation={pixelate({ crisp: true, blockStep: 8, maxBlockSize: 128 })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />] : []),
        <TransitionSeries.Sequence key={id} durationInFrames={sceneFrames(scene(id))}><Comp /></TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
    <Audio src={staticFile('audio/music.wav')} volume={(f) => 0.1 * interpolate(f, [0, 15, TOTAL_FRAMES - 75, TOTAL_FRAMES], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
  </AbsoluteFill>
);
