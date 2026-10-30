import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { pixelate } from '../../../lib/transitions';
import {
  CheeseScene, FallScene, FlatterScene, FoxScene, MoralScene, SingScene, TitleScene, WordsScene,
} from './Scenes';
import { scene, sceneFrames, TOTAL_FRAMES, TRANSITION_FRAMES } from './story';

const ORDER: [string, React.FC][] = [
  ['title', TitleScene],
  ['cheese', CheeseScene],
  ['fox', FoxScene],
  ['flatter', FlatterScene],
  ['sing', SingScene],
  ['fall', FallScene],
  ['moral', MoralScene],
  ['words', WordsScene],
];

export const CrowAndFox: React.FC = () => (
  <AbsoluteFill style={{ background: '#1a1c2c' }}>
    <TransitionSeries>
      {ORDER.flatMap(([id, Comp], i) => [
        ...(i > 0
          ? [
              <TransitionSeries.Transition
                key={`t-${id}`}
                presentation={pixelate({ crisp: true, blockStep: 8, maxBlockSize: 128 })}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />,
            ]
          : []),
        <TransitionSeries.Sequence key={id} durationInFrames={sceneFrames(scene(id))}>
          <Comp />
        </TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
    <Audio
      src={staticFile('audio/music.wav')}
      volume={(f) => 0.11 * interpolate(f, [0, 15, TOTAL_FRAMES - 75, TOTAL_FRAMES], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
    />
  </AbsoluteFill>
);
