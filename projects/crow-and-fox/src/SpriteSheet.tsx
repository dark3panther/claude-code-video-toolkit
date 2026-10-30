import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PixelCanvas } from './pixel/PixelCanvas';
import { Grid, C } from './pixel/raster';
import { drawCrow, drawFox, drawCheese, drawFeather, drawNote } from './pixel/sprites';

export const SpriteSheet: React.FC = () => {
  const g = new Grid(240, 135).fill(C.skyLight);
  const foxes = [
    drawFox({}), drawFox({ stride: 3, walk: 0 }), drawFox({ stride: 3, walk: Math.PI / 2 }), drawFox({ stride: 3, walk: Math.PI }),
  ];
  foxes.forEach((f, i) => g.blit(f, i * 60, 0));
  [drawFox({ sit: true, look: -25, mouth: true, tail: 10 }), drawFox({ sit: true, cheese: true, happy: true }), drawFox({ stride: 4, walk: 1, cheese: true, mouth: false })].forEach((f, i) => g.blit(f, i * 60, 48));
  [drawCrow({}), drawCrow({ flying: true, wing: -70 }), drawCrow({ flying: true, wing: 0 }), drawCrow({ flying: true, wing: 40, cheese: true }), drawCrow({ beakOpen: true, proud: true }), drawCrow({ cheese: true, blink: true })].forEach((c, i) => g.blit(c, i * 38, 98));
  g.blit(drawCheese(true), 190, 60);
  g.blit(drawFeather(), 212, 56);
  g.blit(drawNote(), 230, 60);
  return (
    <AbsoluteFill>
      <PixelCanvas grid={g} scale={8} />
    </AbsoluteFill>
  );
};
