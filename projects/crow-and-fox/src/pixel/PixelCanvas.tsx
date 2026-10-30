import React, { useLayoutEffect, useRef } from 'react';
import { Grid } from './raster';

/** Draws a Grid at its native size and scales it up with nearest-neighbour sampling. */
export const PixelCanvas: React.FC<{ grid: Grid; scale: number; style?: React.CSSProperties }> = ({ grid, scale, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, grid.w, grid.h);
    ctx.putImageData(grid.toImageData(), 0, 0);
  });
  return (
    <canvas
      ref={ref}
      width={grid.w}
      height={grid.h}
      style={{ width: grid.w * scale, height: grid.h * scale, imageRendering: 'pixelated', display: 'block', ...style }}
    />
  );
};
