import React from 'react';
import { Composition } from 'remotion';
import { CrowAndFox } from './CrowAndFox';
import { Sample } from './Sample';
import { SpriteSheet } from './SpriteSheet';
import { FPS, TOTAL_FRAMES } from './story';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CrowAndFox" component={CrowAndFox} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="SpriteSheet" component={SpriteSheet} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Sample" component={Sample} durationInFrames={60} fps={30} width={1920} height={1080} />
  </>
);
