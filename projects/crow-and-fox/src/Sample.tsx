import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas } from './pixel/PixelCanvas';
import { drawCrow, drawFox, drawSparkle, CROW_FEET, FOX_FEET } from './pixel/sprites';
import { drawWorld, GROUND_Y, PERCH, SCALE } from './pixel/world';
import { Caption } from './Caption';

export const Sample: React.FC = () => {
  const frame = useCurrentFrame();
  const g = drawWorld(frame);
  const crow = drawCrow({ cheese: true });
  g.blit(crow, PERCH[0] - 10, PERCH[1] - CROW_FEET, true);
  const fox = drawFox({ sit: true, look: -24, tail: 10, mouth: true });
  g.blit(fox, 66, GROUND_Y + 6 - FOX_FEET);
  g.blit(drawSparkle(7), PERCH[0] - 4, PERCH[1] - 34);
  g.blit(drawSparkle(5), PERCH[0] + 26, PERCH[1] - 24);
  g.blit(drawSparkle(5), PERCH[0] + 2, PERCH[1] - 14);
  const words = '"Your feathers are so shiny.'.split(' ').map((text, i) => ({ text, start: i * 0.4, end: i * 0.4 + 0.4 }));
  return (
    <AbsoluteFill style={{ background: '#1a1c2c' }}>
      <PixelCanvas grid={g} scale={SCALE} />
      <Caption words={words} t={0.5} />
    </AbsoluteFill>
  );
};
