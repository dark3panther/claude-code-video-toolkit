import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import art from './art.json';
import { Caption } from './Caption';
import { captionAt, FPS, SceneData } from './story';

export const W = 240;
export const H = 135;
export const SCALE = 8;
/** Where feet stand in the sets (art pixels). */
export const FLOOR = 108;

const SIZES = art as unknown as Record<string, [number, number]>;
export const size = (name: string) => SIZES[name] ?? [0, 0];

/** Seconds since the scene started. */
export const useT = () => useCurrentFrame() / FPS;

/**
 * A pxl sprite on the 240x135 stage. (x, y) is the bottom-centre (the feet) unless `anchor` says otherwise;
 * positions are rounded so every pixel stays on the grid.
 */
export const Spr: React.FC<{ name: string; x: number; y: number; flip?: boolean; anchor?: 'feet' | 'center'; opacity?: number }> = ({
  name, x, y, flip = false, anchor = 'feet', opacity = 1,
}) => {
  const [w, h] = size(name);
  const left = Math.round(x - w / 2);
  const top = Math.round(anchor === 'feet' ? y - h : y - h / 2);
  return (
    <Img
      src={staticFile(`art/${name}.png`)}
      style={{ position: 'absolute', left, top, width: w, height: h, transform: flip ? 'scaleX(-1)' : undefined, imageRendering: 'pixelated', opacity }}
    />
  );
};

/** The pixel stage: a set image plus children in art pixels, shown at 8x, with captions and the scene's voice. */
export const Shell: React.FC<{ s: SceneData; set: string; caption?: boolean; children?: React.ReactNode; over?: React.ReactNode }> = ({
  s, set, caption = true, children, over,
}) => {
  const t = useT();
  const sen = caption ? captionAt(s, t) : null;
  return (
    <AbsoluteFill style={{ background: '#1a1c2c' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${SCALE})`, transformOrigin: '0 0', imageRendering: 'pixelated' }}>
        <Img src={staticFile(`art/${set}.png`)} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, imageRendering: 'pixelated' }} />
        {children}
      </div>
      {over}
      {sen && <Caption words={sen.words} t={t} />}
      <Voice s={s} />
    </AbsoluteFill>
  );
};

/** The scene's voice lines, each starting at its time. */
export const Voice: React.FC<{ s: SceneData }> = ({ s }) => (
  <>
    {s.audio.map((a, i) => (
      <Sequence key={i} from={Math.round(a.start * FPS)}>
        <Audio src={staticFile(a.file)} />
      </Sequence>
    ))}
  </>
);

/** A sound effect at `sec` seconds into the scene. */
export const Sfx: React.FC<{ name: string; sec: number; volume?: number }> = ({ name, sec, volume = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(sec * FPS))}>
    <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

/** Walk frame name: 4 frames, ~8 steps a second. */
export const walkFrame = (t: number) => Math.floor(t * 8) % 4;
