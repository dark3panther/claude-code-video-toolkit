import React from 'react';
import { Composition } from 'remotion';
import { WhisperingPocket } from './Video';
import { FPS, TOTAL_FRAMES } from './story';

export const RemotionRoot: React.FC = () => (
  <Composition id="WhisperingPocket" component={WhisperingPocket} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
