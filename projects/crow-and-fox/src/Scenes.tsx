import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Caption, FONT } from './Caption';
import { PixelCanvas } from './pixel/PixelCanvas';
import { C, Grid } from './pixel/raster';
import {
  crop, CROW_FEET, CROW_W, drawBang, drawStump, drawCheese, drawCrow, drawFeather, drawFox, drawIconTree, drawNote,
  drawSparkle, drawThought, CrowPose, FOX_FEET, FOX_W, FoxPose, foxMouth,
} from './pixel/sprites';
import { drawWorld, GROUND_Y, PERCH, SCALE } from './pixel/world';
import {
  blinking, captionAt, easeInOut, FPS, lerp, mouthOpen, prog, scene, SceneData, wordAt,
} from './story';

// ---------------------------------------------------------------- shared bits

const FOX_SIT_X = 66;
const FOX_Y = GROUND_Y + 6 - FOX_FEET;

const crowOnPerch = (g: Grid, pose: CrowPose) =>
  g.blit(drawCrow(pose), PERCH[0] - 10, PERCH[1] - CROW_FEET, true);

/** World position of the cheese when it is in the perched crow's beak. */
const BEAK_CHEESE: [number, number] = [PERCH[0] - 10, PERCH[1] - CROW_FEET + 12];

const tailSwish = (t: number, speed = 1.6, amount = 10) => Math.round(Math.sin(t * Math.PI * speed) * amount);

type Sfx = { file: string; at: number; volume?: number };

/** Voice lines (and any sound effects) of a scene, placed at their timeline times. */
const SceneAudio: React.FC<{ s: SceneData; sfx?: Sfx[] }> = ({ s, sfx = [] }) => (
  <>
    {s.audio.map((a) => (
      <Sequence key={a.file} from={Math.round(a.start * FPS)} layout="none">
        <Audio src={staticFile(a.file)} />
      </Sequence>
    ))}
    {sfx.map((x, i) => (
      <Sequence key={i} from={Math.round(x.at * FPS)} layout="none">
        <Audio src={staticFile(`audio/sfx/${x.file}`)} volume={x.volume ?? 0.5} />
      </Sequence>
    ))}
  </>
);

const Shell: React.FC<{ s: SceneData; grid: Grid; t: number; caption?: boolean; sfx?: Sfx[]; children?: React.ReactNode }> = ({
  s, grid, t, caption = true, sfx, children,
}) => {
  const sen = caption ? captionAt(s, t) : null;
  return (
    <AbsoluteFill style={{ background: '#1a1c2c' }}>
      <PixelCanvas grid={grid} scale={SCALE} />
      {children}
      {sen && <Caption words={sen.words} t={t} />}
      <SceneAudio s={s} sfx={sfx} />
    </AbsoluteFill>
  );
};

const useT = () => useCurrentFrame() / FPS;

/** Twinkling sparkles around a point; each one blinks on its own beat. */
function sparkles(g: Grid, t: number, cx: number, cy: number, spots: [number, number][], color: number = C.white) {
  spots.forEach(([dx, dy], i) => {
    const phase = (t * 2.2 + i * 0.37) % 1;
    if (phase < 0.6) g.blit(drawSparkle(phase < 0.3 ? 7 : 5, color), cx + dx, cy + dy);
  });
}

// ---------------------------------------------------------------- 1. title

export const TitleScene: React.FC = () => {
  const s = scene('title');
  const t = useT();
  const g = drawWorld(useCurrentFrame());
  crowOnPerch(g, { cheese: true, blink: blinking(t, 2.6) });
  g.blit(drawFox({ sit: true, look: -10, tail: tailSwish(t), blink: blinking(t, 3.1, 1) }), FOX_SIT_X, FOX_Y);
  const words = s.sentences[0].words;
  const active = words.findIndex((w) => t >= w.start && t < w.end);
  const drop = Math.round(easeInOut(prog(t, 0.1, 0.7)) * 26) * 8; // banner slides in, snapped to the pixel grid
  return (
    <Shell s={s} grid={g} t={t} caption={false}>
      <div style={{ position: 'absolute', top: -160 + drop, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            fontFamily: FONT, fontWeight: 400, fontSize: 168, lineHeight: 1, padding: '24px 64px 34px',
            background: '#1a1c2c', color: '#f4f4f4',
            boxShadow: '0 -8px 0 0 #ffcd75, 0 8px 0 0 #ffcd75, -8px 0 0 0 #ffcd75, 8px 0 0 0 #ffcd75, 16px 16px 0 0 #b13e53',
          }}
        >
          {words.map((w, i) => (
            <span key={i} style={{ color: i === active ? '#ffcd75' : '#f4f4f4' }}>
              {w.text.replace('.', '')}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      </div>
    </Shell>
  );
};

// ---------------------------------------------------------------- 2. crow finds cheese, flies up

const STUMP = drawStump();

export const CheeseScene: React.FC = () => {
  const s = scene('cheese');
  const t = useT();
  const frame = useCurrentFrame();
  const g = drawWorld(frame);

  // the crow finds the cheese on an old stump (kept clear of the caption box)
  const stumpX = 44;
  const stumpY = GROUND_Y - 18;
  g.blit(STUMP, stumpX, stumpY);
  const groundX = stumpX - 6;
  const groundY = stumpY + 4 - CROW_FEET;
  const cheeseOnGround: [number, number] = [stumpX + 24, stumpY - 3];
  const tLand = 1.5;
  const tPick = wordAt(s, 0, 8); // "cheese."
  const tTake = s.sentences[1].start; // "She flew up..."
  const tPerch = tTake + 2.0;

  const flap = (k: number) => Math.round(Math.sin(t * Math.PI * 2 * k) * 55 - 15);

  if (t < tLand) {
    // flying in from the left and gliding down to the ground
    const p = easeInOut(prog(t, 0, tLand));
    g.blit(drawCheese(false, true), cheeseOnGround[0], cheeseOnGround[1]);
    g.blit(drawCrow({ flying: true, wing: flap(3) }), lerp(-40, groundX, p), lerp(20, groundY, p) - Math.sin(p * Math.PI) * 6);
  } else if (t < tTake) {
    const pecking = t > tPick - 0.35 && t < tPick;
    const hasCheese = t >= tPick;
    if (!hasCheese) g.blit(drawCheese(false, true), cheeseOnGround[0], cheeseOnGround[1]);
    // hop toward the cheese before picking it up
    const hop = t < tPick - 0.35 ? Math.round(prog(t, tLand + 0.3, tPick - 0.4) * 2) : 2;
    g.blit(drawCrow({ cheese: hasCheese, headTilt: pecking ? 35 : 0, blink: blinking(t, 2.4) }), groundX + hop, groundY + (pecking ? 1 : 0));
    if (hasCheese && t < tPick + 0.8) sparkles(g, t, groundX + hop + 30, groundY, [[2, -4], [9, 4]], C.sun);
  } else if (t < tPerch) {
    // flies up in an arc to the branch, still holding the cheese
    const p = easeInOut(prog(t, tTake, tPerch));
    const x = lerp(groundX + 2, PERCH[0] - 10, p);
    const y = lerp(groundY, PERCH[1] - CROW_FEET, p) - Math.sin(p * Math.PI) * 30;
    g.blit(drawCrow({ flying: true, wing: flap(3.5), cheese: true }), x, y);
  } else {
    // lands facing right, then turns to face the meadow
    const turned = t > tPerch + 0.5;
    g.blit(drawCrow({ cheese: true, blink: blinking(t, 2.8) }), PERCH[0] - 10, PERCH[1] - CROW_FEET, turned);
  }
  return <Shell s={s} grid={g} t={t} />;
};

// ---------------------------------------------------------------- 3. the fox arrives

export const FoxScene: React.FC = () => {
  const s = scene('fox');
  const t = useT();
  const g = drawWorld(useCurrentFrame());
  crowOnPerch(g, { cheese: true, blink: blinking(t, 2.7) });

  const stopX = 52;
  const tWalk0 = s.sentences[0].start - 0.4;
  const tWalk1 = s.sentences[0].end + 0.3;
  const tSee = wordAt(s, 1, 1); // "saw"
  const walking = t < tWalk1;
  const x = lerp(-FOX_W, stopX, prog(t, tWalk0, tWalk1));
  const look = t >= tSee ? -Math.round(easeInOut(prog(t, tSee, tSee + 0.3)) * 26) : 0;
  const pose: FoxPose = {
    walk: walking ? t * 9 : 0,
    stride: walking ? 3 : 0,
    tail: tailSwish(t, walking ? 3 : 1.6),
    look,
    mouth: mouthOpen(s, t, 'F'),
    blink: !walking && blinking(t, 3.0),
  };
  g.blit(drawFox(pose), x, GROUND_Y + 6 - FOX_FEET);
  if (t >= tSee && t < tSee + 1.4) g.blit(drawBang(), stopX + 34, GROUND_Y - 62 - (t < tSee + 0.15 ? 2 : 0));
  const tWant = s.sentences[2].start;
  if (t >= tWant - 0.1) g.blit(drawThought(), stopX + 2, 14);
  return <Shell s={s} grid={g} t={t} />;
};

// ---------------------------------------------------------------- 4. flattery

export const FlatterScene: React.FC = () => {
  const s = scene('flatter');
  const t = useT();
  const g = drawWorld(useCurrentFrame());
  crowOnPerch(g, { cheese: true, blink: blinking(t, 2.5, 0.8), headTilt: t > s.sentences[1].start ? -6 : 0 });
  const begging = t > s.sentences[3].start;
  g.blit(
    drawFox({ sit: true, look: -24, tail: tailSwish(t, begging ? 4 : 1.6, begging ? 14 : 10), mouth: mouthOpen(s, t, 'F'), blink: blinking(t, 3.4, 2) }),
    FOX_SIT_X, FOX_Y,
  );
  // "shiny" feathers sparkle; "voice" brings out the music notes
  const tShiny = wordAt(s, 1, 0);
  const tVoice = wordAt(s, 2, 3);
  if (t > tShiny && t < s.sentences[2].start + 0.3) {
    sparkles(g, t, PERCH[0] - 6, PERCH[1] - 32, [[0, 0], [26, 6], [8, 16], [20, -6], [32, 18]]);
  }
  if (t > tVoice) {
    for (let i = 0; i < 3; i++) {
      const k = ((t - tVoice) * 0.5 + i / 3) % 1;
      g.blit(drawNote(), PERCH[0] - 22 + i * 12 + Math.round(Math.sin(k * 6 + i) * 2), PERCH[1] - 34 - Math.round(k * 22));
    }
  }
  return <Shell s={s} grid={g} t={t} sfx={[{ file: 'twinkle.wav', at: wordAt(s, 1, 4), volume: 0.35 }]} />;
};

// ---------------------------------------------------------------- 5. the crow sings

export const SingScene: React.FC = () => {
  const s = scene('sing');
  const t = useT();
  const g = drawWorld(useCurrentFrame());
  const caws = s.sentences[1].words.filter((w) => w.speaker === 'C');
  const singing = caws.some((w) => t >= w.start - 0.05 && t < w.end + 0.1);
  const afterFirst = t >= caws[0].start;
  const proud = t >= s.sentences[0].start + 0.3;
  crowOnPerch(g, {
    cheese: !afterFirst,
    proud,
    beakOpen: singing,
    headTilt: proud ? -10 : 0,
    blink: !proud && blinking(t, 2.5),
  });
  if (afterFirst) {
    // the cheese slips from the open beak... and wobbles at the tip
    const slip = Math.min(3, Math.floor((t - caws[0].start) * 4));
    g.blit(drawCheese(false, true), BEAK_CHEESE[0] - 1 - slip, BEAK_CHEESE[1] + slip);
  }
  if (proud && t < s.sentences[1].start) sparkles(g, t, PERCH[0] - 4, PERCH[1] - 36, [[0, 4], [24, 0], [30, 14]], C.sun);
  if (singing || (afterFirst && t < caws[caws.length - 1].end + 0.8)) {
    for (let i = 0; i < 4; i++) {
      const k = ((t - caws[0].start) * 0.8 + i / 4) % 1;
      g.blit(drawNote(), PERCH[0] - 26 - Math.round(k * 16) + i * 6, PERCH[1] - 30 - Math.round(k * 26) - i * 2);
    }
  }
  g.blit(drawFox({ sit: true, look: -24, tail: tailSwish(t), blink: blinking(t, 3.2) }), FOX_SIT_X, FOX_Y);
  return (
    <Shell
      s={s} grid={g} t={t}
      sfx={caws.map((w) => ({ file: 'caw.wav', at: w.start, volume: 0.32 }))}
    />
  );
};

// ---------------------------------------------------------------- 6. the cheese falls, the fox runs

export const FallScene: React.FC = () => {
  const s = scene('fall');
  const t = useT();
  const g = drawWorld(useCurrentFrame());

  const tFall0 = s.sentences[0].start + 0.2;
  const tCatch = tFall0 + 1.1;
  const tRun = wordAt(s, 1, 5); // "ran"
  const tStop = s.sentences[2].start - 0.2;
  const tLeave = s.sentences[2].end + 0.3;

  const caught = t >= tCatch;
  crowOnPerch(g, {
    beakOpen: t < tFall0 + 0.6,
    headTilt: caught ? 14 : 0,
    blink: caught && blinking(t, 2.2),
  });

  // fox: sitting, catching, running left, turning back to laugh, then gone
  const sitPose: FoxPose = { sit: true, look: -24, tail: tailSwish(t), mouth: !caught && t > tFall0 + 0.5, cheese: caught };
  if (t < tRun) {
    g.blit(drawFox({ ...sitPose, look: caught ? -Math.round(24 * (1 - prog(t, tCatch, tCatch + 0.4))) : -24 }), FOX_SIT_X, FOX_Y);
  } else if (t < tStop) {
    const x = lerp(FOX_SIT_X, 4, easeInOut(prog(t, tRun, tStop)));
    g.blit(drawFox({ walk: t * 14, stride: 4, tail: tailSwish(t, 4), cheese: true }), x, FOX_Y, true);
  } else if (t < tLeave) {
    const bounce = Math.floor((t - tStop) * 6) % 2;
    g.blit(drawFox({ happy: true, cheese: true, tail: tailSwish(t, 5, 14), look: -8 }), 4, FOX_Y - bounce);
  } else {
    const x = lerp(4, -FOX_W - 4, prog(t, tLeave, tLeave + 0.7));
    g.blit(drawFox({ walk: t * 14, stride: 4, tail: tailSwish(t, 4), cheese: true }), x, FOX_Y, true);
  }

  // the falling cheese: drops from the beak to the fox's mouth
  if (t < tCatch) {
    const m = foxMouth({ sit: true, look: -24 });
    const p = prog(t, tFall0, tCatch);
    const x = lerp(BEAK_CHEESE[0] - 4, FOX_SIT_X + m[0] - 3, p);
    const y = lerp(BEAK_CHEESE[1] + 3, FOX_Y + m[1] - 3, p * p);
    g.blit(drawCheese(false, true), x, y);
  }
  return <Shell s={s} grid={g} t={t} sfx={[{ file: 'plop.wav', at: tCatch, volume: 0.55 }]} />;
};

// ---------------------------------------------------------------- 7. moral

export const MoralScene: React.FC = () => {
  const s = scene('moral');
  const t = useT();
  const g = drawWorld(useCurrentFrame());
  crowOnPerch(g, { headTilt: 14, blink: blinking(t, 2.0) });
  const sen = s.sentences[0];
  const words = sen.words.slice(1); // "Moral:" becomes the heading
  const headingOn = t >= sen.words[0].start && t < sen.words[0].end;
  const active = words.findIndex((w) => t >= w.start && t < w.end);
  return (
    <Shell s={s} grid={g} t={t} caption={false}>
      <div style={{ position: 'absolute', left: 96, top: 96, width: 1000 }}>
        <div
          style={{
            fontFamily: FONT, fontWeight: 400, background: '#1a1c2c', color: '#f4f4f4', padding: '32px 48px 40px',
            boxShadow: '0 -8px 0 0 #f4f4f4, 0 8px 0 0 #f4f4f4, -8px 0 0 0 #f4f4f4, 8px 0 0 0 #f4f4f4, 16px 16px 0 0 #b13e53',
          }}
        >
          <div style={{ fontSize: 120, color: headingOn ? '#ffcd75' : '#ef7d57', marginBottom: 8 }}>Moral</div>
          <div style={{ fontSize: 100, lineHeight: 1.1 }}>
            {words.map((w, i) => (
              <span key={i} style={{ color: i === active ? '#ffcd75' : '#f4f4f4' }}>
                {w.text}
                {i < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
};

// ---------------------------------------------------------------- 8. key words

type Card = { word: string; grid: Grid; scale: number };

const crowGrid = drawCrow({});
const CARDS: Card[] = [
  { word: 'crow', grid: crowGrid, scale: 6 },
  { word: 'fox', grid: drawFox({}), scale: 4 },
  { word: 'cheese', grid: drawCheese(true), scale: 11 },
  { word: 'tree', grid: drawIconTree(), scale: 6 },
  { word: 'feathers', grid: drawFeather(), scale: 8 },
  { word: 'beak', grid: crop(crowGrid, 16, 4, CROW_W - 16, 20), scale: 9 },
  {
    word: 'sing',
    grid: (() => {
      const g = new Grid(48, 36);
      g.blit(drawCrow({ beakOpen: true, proud: true }), 0, 2);
      g.blit(drawNote(), 37, 2);
      g.blit(drawNote(), 40, 14);
      return g;
    })(),
    scale: 5,
  },
];

export const WordsScene: React.FC = () => {
  const s = scene('words');
  const t = useT();
  const frame = useCurrentFrame();
  const bg = new Grid(240, 135).fill(C.skyLight);
  // a soft checker of light/sky tiles that scrolls slowly
  const off = Math.floor(frame / 6) % 16;
  for (let y = 0; y < 135; y++) for (let x = 0; x < 240; x++) {
    if ((Math.floor((x + off) / 8) + Math.floor((y + off) / 8)) % 2 === 0) bg.set(x, y, C.sky);
  }
  return (
    <AbsoluteFill style={{ background: '#1a1c2c' }}>
      <PixelCanvas grid={bg} scale={SCALE} />
      <div
        style={{
          position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 400,
          fontSize: 136, color: '#f4f4f4', textShadow: '8px 8px 0 #1a1c2c',
        }}
      >
        Key Words
      </div>
      <div style={{ position: 'absolute', top: 200, left: 0, right: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px 40px', padding: '0 120px' }}>
        {CARDS.map((c, i) => {
          const w = s.sentences[i].words[0];
          const shown = t >= w.start - 0.15;
          const speaking = t >= w.start && t < w.end + 0.25;
          const pop = shown && t < w.start + 0.1 ? 1.08 : 1;
          return (
            <div
              key={c.word}
              style={{
                width: 368, height: 360, background: '#f4f4f4', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 16px', boxSizing: 'border-box',
                boxShadow: `0 -8px 0 0 ${speaking ? '#ffcd75' : '#1a1c2c'}, 0 8px 0 0 ${speaking ? '#ffcd75' : '#1a1c2c'}, -8px 0 0 0 ${speaking ? '#ffcd75' : '#1a1c2c'}, 8px 0 0 0 ${speaking ? '#ffcd75' : '#1a1c2c'}, 16px 16px 0 0 #29366f`,
                opacity: shown ? 1 : 0,
                transform: `scale(${pop})`,
              }}
            >
              <div style={{ height: 232, display: 'flex', alignItems: 'center' }}>
                <PixelCanvas grid={c.grid} scale={c.scale} />
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 92, lineHeight: 1, color: speaking ? '#b13e53' : '#1a1c2c' }}>
                {c.word}
              </div>
            </div>
          );
        })}
      </div>
      <SceneAudio s={s} sfx={s.sentences.map((sen) => ({ file: 'blip.wav', at: sen.start - 0.15, volume: 0.25 }))} />
    </AbsoluteFill>
  );
};
