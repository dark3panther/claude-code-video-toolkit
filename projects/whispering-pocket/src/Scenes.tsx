// The nine scenes. Every action is keyed to the time a word is spoken (at(scene, word)), so the
// picture follows the performance. Sprites come from art/story.px.js (pxl).
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { FONT } from './Caption';
import { FLOOR, H, SCALE, Sfx, Shell, size, Spr, useT, Voice, W, walkFrame } from './Stage';
import { at, blinking, easeInOut, lerp, mouthOpen, prog, scene } from './story';

// Hand and pocket positions, measured from the sprites (offsets from the feet, in art pixels).
const POCKET = { dx: 0, dy: -19 };
const HAND_BEND = { dx: 8, dy: -18 };
const HAND_UP = { dx: 3, dy: -33 };
const LIN_HAND = { dx: 12, dy: -29 };

/** Music notes floating up from Leo's pocket while it hums. */
const Notes: React.FC<{ x: number; on: boolean; t: number; big?: boolean }> = ({ x, on, t, big }) => {
  if (!on) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const ph = (t * (big ? 0.9 : 0.6) + i / 3) % 1;
        return (
          <Spr
            key={i}
            name={i === 1 ? 'note2' : 'note'}
            x={x + POCKET.dx + 6 + i * 4 + Math.round(Math.sin((ph + i) * 6) * 3)}
            y={FLOOR + POCKET.dy - Math.round(ph * 34)}
            anchor="center"
            opacity={ph < 0.85 ? 1 : (1 - ph) / 0.15}
          />
        );
      })}
    </>
  );
};

/** A glowing pebble with a dithered halo that pulses. */
const Pebble: React.FC<{ x: number; y: number; t: number; glow?: number }> = ({ x, y, t, glow = 1 }) => (
  <>
    <Spr name="halo" x={x} y={y} anchor="center" opacity={glow * (0.55 + 0.3 * Math.sin(t * 5))} />
    <Spr name="pebble" x={x} y={y} anchor="center" />
  </>
);

const Sparkles: React.FC<{ x: number; y: number; t: number; from: number }> = ({ x, y, t, from }) => {
  if (t < from) return null;
  return (
    <>
      {[[-20, -6], [18, -14], [-12, -26], [24, 4], [2, -36]].map(([dx, dy], i) =>
        Math.floor((t - from) * 6 + i) % 3 === 0 ? null : <Spr key={i} name="sparkle" x={x + dx} y={y + dy} anchor="center" />,
      )}
    </>
  );
};

/** Leo's pose name, with blinking added when he is just standing. */
const leoIdle = (t: number, glow: 0 | 1 | 2, offset = 0) => {
  const g = glow ? `leo_glow${glow}` : 'leo';
  return blinking(t, 3.1, offset) ? (glow ? `${g}_blink` : 'leo_blink') : glow ? g : 'leo_stand';
};
const leoWalk = (t: number, glow: 0 | 1 | 2) => (glow ? `leo_glow${glow}_walk_${walkFrame(t)}` : `leo_walk_${walkFrame(t)}`);
const linIdle = (t: number) => (blinking(t, 3.7, 1.3) ? 'lin_blink' : 'lin_stand');

const CUPBOARD_X = 200;

// ---------------------------------------------------------------- 1. title
export const TitleScene: React.FC = () => {
  const s = scene('title');
  const t = useT();
  const words = s.sentences[0].words;
  const active = words.findIndex((w) => t >= w.start && t < w.end);
  const drop = Math.round(easeInOut(prog(t, 0.1, 0.7)) * 26) * 8;
  return (
    <Shell
      s={s}
      set="playground"
      caption={false}
      over={
        <div style={{ position: 'absolute', top: -160 + drop, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontFamily: FONT, fontSize: 132, lineHeight: 1, padding: '24px 56px 34px', background: '#1a1c2c', color: '#f4f4f4', boxShadow: '0 -8px 0 0 #9dffc4, 0 8px 0 0 #9dffc4, -8px 0 0 0 #9dffc4, 8px 0 0 0 #9dffc4, 16px 16px 0 0 #257179' }}>
            {words.map((w, i) => (
              <span key={i} style={{ color: i === active ? '#9dffc4' : '#f4f4f4' }}>{w.text}{i < words.length - 1 ? ' ' : ''}</span>
            ))}
          </div>
        </div>
      }
    >
      <Spr name={leoIdle(t, 2)} x={110} y={FLOOR} />
      <Notes x={110} on t={t} />
      <Sfx name="twinkle" sec={0.4} volume={0.35} />
    </Shell>
  );
};

// ---------------------------------------------------------------- 2. the pebble on the playground
export const PlaygroundScene: React.FC = () => {
  const s = scene('playground');
  const t = useT();
  const arrive = at(s, 'found') - 0.1;
  const tPebble = at(s, 'pebble');
  const tRound = at(s, 'round');
  const tSmooth = at(s, 'smooth');
  const tGlowed = at(s, 'glowed');
  const tPocket = at(s, 'pocket');
  const tThen = at(s, 'then');
  const stopX = 96;

  let x = stopX;
  let pose: string;
  if (t < arrive) { x = Math.round(lerp(-20, stopX, prog(t, 0, arrive))); pose = leoWalk(t, 0); }
  else if (t < tRound) pose = t > tPebble ? 'leo_wow' : leoIdle(t, 0);
  else if (t < tGlowed) pose = 'leo_bend';
  else if (t < tPocket) pose = 'leo_hold_up';
  else if (t < tThen + 0.3) pose = 'leo_pocket';
  else { x = Math.round(lerp(stopX, 280, prog(t, tThen + 0.3, s.duration - 0.2))); pose = leoWalk(t, 1); }

  // where the pebble is: on the ground, picked up, held high, then into the pocket
  const ground = { x: 110, y: FLOOR - 3 };
  const bend = { x: stopX + HAND_BEND.dx, y: FLOOR + HAND_BEND.dy };
  const up = { x: stopX + HAND_UP.dx, y: FLOOR + HAND_UP.dy };
  let p = ground;
  if (t >= tSmooth - 0.2 && t < tGlowed) { const k = prog(t, tSmooth - 0.2, tSmooth + 0.2); p = { x: lerp(ground.x, bend.x, k), y: lerp(ground.y, bend.y, k) }; }
  else if (t >= tGlowed) { const k = prog(t, tGlowed - 0.1, tGlowed + 0.2); p = { x: lerp(bend.x, up.x, k), y: lerp(bend.y, up.y, k) }; }
  const inPocket = t >= tPocket;

  return (
    <Shell s={s} set="playground">
      {!inPocket && <Pebble x={p.x} y={p.y} t={t} glow={t >= tGlowed ? 1.3 : 0.8} />}
      <Spr name={pose} x={x} y={FLOOR} />
      <Sparkles x={up.x} y={up.y} t={t} from={tGlowed} />
      {[0.2, 0.55, 0.9, 1.25].map((k) => <Sfx key={k} name="step" sec={k} volume={0.25} />)}
      <Sfx name="twinkle" sec={tGlowed} volume={0.45} />
      <Sfx name="blip" sec={tPocket} volume={0.3} />
    </Shell>
  );
};

// ---------------------------------------------------------------- 3. the pocket hums by the cupboard
export const HumScene: React.FC = () => {
  const s = scene('hum');
  const t = useT();
  const arrive = at(s, 'cupboard');
  const tHum = at(s, 'hum');
  const tHmm = at(s, 'hmm');
  const tHappy = at(s, 'happy');
  const stopX = 150;
  const humming = t >= tHum;
  let x = stopX;
  let pose: string;
  if (t < arrive) { x = Math.round(lerp(-20, stopX, prog(t, 0, arrive))); pose = leoWalk(t, 1); }
  else if (!humming) pose = leoIdle(t, 1);
  else if (t < tHappy) pose = 'leo_glow2_wow';
  else pose = 'leo_glow2_happy';
  return (
    <Shell s={s} set="classroom">
      <Spr name="cupboard_0" x={CUPBOARD_X} y={FLOOR} />
      <Spr name={pose} x={x} y={FLOOR} />
      <Notes x={x} on={humming} t={t} big={t >= tHmm && t < tHappy} />
      <Sfx name="twinkle" sec={tHum} volume={0.3} />
    </Shell>
  );
};

// ---------------------------------------------------------------- 4. stepping away and back
export const HotColdScene: React.FC = () => {
  const s = scene('hotcold');
  const t = useT();
  const tAway = at(s, 'away') - 0.3;
  const tStopped = at(s, 'stopped');
  const tBack = at(s, 'back') - 0.3;
  const tStarted = at(s, 'started');
  const near = 150, far = 92;
  let x = near;
  let pose: string;
  let flip = false;
  let glow: 1 | 2 = 2;
  if (t < tAway) pose = leoIdle(t, 2);
  else if (t < tAway + 1.0) { x = Math.round(lerp(near, far, prog(t, tAway, tAway + 1.0))); pose = leoWalk(t, 2); flip = true; }
  else if (t < tBack) { x = far; glow = t >= tStopped ? 1 : 2; pose = glow === 1 ? 'leo_glow1_wow' : leoIdle(t, 2); }
  else if (t < tBack + 1.0) { x = Math.round(lerp(far, near, prog(t, tBack, tBack + 1.0))); pose = leoWalk(t, 1); glow = 1; }
  else { glow = t >= tStarted - 0.1 ? 2 : 1; pose = glow === 2 ? 'leo_glow2_happy' : 'leo_glow1_wow'; }
  const humming = (t < tStopped - 0.1) || (t >= tStarted - 0.1);
  return (
    <Shell s={s} set="classroom">
      <Spr name="cupboard_0" x={CUPBOARD_X} y={FLOOR} />
      <Spr name={pose} x={x} y={FLOOR} flip={flip} />
      <Notes x={x} on={humming} t={t} />
      <Sfx name="twinkle" sec={tStarted - 0.1} volume={0.3} />
    </Shell>
  );
};

// ---------------------------------------------------------------- 5. "There is a secret in this cupboard"
export const SecretScene: React.FC = () => {
  const s = scene('secret');
  const t = useT();
  const talking = mouthOpen(s, t, 'L');
  const tSpeak = at(s, 'there') - 0.2;
  const pose = t < tSpeak ? 'leo_glow2_wow' : talking ? 'leo_glow2_point' : 'leo_glow2_point_shut';
  return (
    <Shell s={s} set="classroom">
      <Spr name="cupboard_0" x={CUPBOARD_X} y={FLOOR} />
      <Spr name={pose} x={150} y={FLOOR} />
      <Notes x={150} on t={t} />
    </Shell>
  );
};

// ---------------------------------------------------------------- 6. the cupboard opens: a tin box of letters
const PAPERS = ['letter', 'drawing', 'letter', 'drawing', 'letter', 'drawing'];
/** Letters and drawings flying up out of the box, then floating. */
const Papers: React.FC<{ x: number; y: number; t: number; from: number }> = ({ x, y, t, from }) => {
  if (t < from) return null;
  return (
    <>
      {PAPERS.map((name, i) => {
        const k = easeInOut(prog(t, from + i * 0.12, from + i * 0.12 + 0.9));
        const tx = x + (i - 2.5) * 16;
        const ty = 30 + (i % 2) * 12;
        const bob = Math.round(Math.sin(t * 2 + i) * 2);
        return <Spr key={i} name={name} x={Math.round(lerp(x, tx, k))} y={Math.round(lerp(y, ty, k)) + (k >= 1 ? bob : 0)} anchor="center" opacity={k > 0 ? 1 : 0} />;
      })}
    </>
  );
};

export const OpenScene: React.FC = () => {
  const s = scene('open');
  const t = useT();
  const linStop = 168;
  const arrive = at(s, 'leo') - 0.1;
  const tOpened = at(s, 'opened');
  const tBack = at(s, 'back');
  const tDusty = at(s, 'dusty');
  const tInside = at(s, 'inside');
  const tLetters = at(s, 'letters');
  const tChildren = at(s, 'children');

  const linX = t < arrive ? Math.round(lerp(-20, linStop, prog(t, 0, arrive))) : linStop;
  let linPose: string;
  if (t < arrive) linPose = `lin_walk_${walkFrame(t)}`;
  else if (t > tOpened - 0.4 && t < tOpened + 0.8) linPose = 'lin_reach';
  else if (t > tInside - 0.2 && t < tInside + 0.4) linPose = 'lin_reach';
  else if (t >= tInside + 0.4) linPose = 'lin_hold';
  else linPose = linIdle(t);

  const door = t < tOpened ? 0 : t < tOpened + 0.3 ? 1 : 2;
  const shelf = { x: CUPBOARD_X, y: FLOOR - 24 };
  const hand = { x: linStop + LIN_HAND.dx, y: FLOOR + LIN_HAND.dy };
  const boxK = prog(t, tInside, tInside + 0.5);
  const box = { x: lerp(shelf.x, hand.x, boxK), y: lerp(shelf.y, hand.y + 4, boxK) };
  const boxOpen = t >= tLetters;
  const leoPose = t >= tChildren ? 'leo_glow2_happy' : t >= tLetters ? 'leo_glow2_wow' : leoIdle(t, 2, 0.7);
  return (
    <Shell s={s} set="classroom">
      <Spr name={`cupboard_${door}`} x={CUPBOARD_X} y={FLOOR} />
      {t >= tBack && <Spr name={boxOpen ? 'tinbox_open' : 'tinbox'} x={box.x} y={box.y} />}
      {t >= tDusty && t < tDusty + 1.6 && <Spr name="dust" x={shelf.x + (Math.floor(t * 4) % 2 ? 4 : -3)} y={shelf.y - 10 - Math.round((t - tDusty) * 6)} anchor="center" />}
      <Spr name={linPose} x={linX} y={FLOOR} />
      <Spr name={leoPose} x={110} y={FLOOR} />
      <Notes x={110} on t={t} />
      <Papers x={box.x} y={box.y - 10} t={t} from={tLetters} />
      {[0.2, 0.6, 1.0, 1.4, 1.8].map((k) => <Sfx key={k} name="step" sec={k} volume={0.22} />)}
      <Sfx name="creak" sec={tOpened} volume={0.45} />
      <Sfx name="whoosh" sec={tLetters} volume={0.5} />
    </Shell>
  );
};

// ---------------------------------------------------------------- 7. "It is a time capsule"
export const CapsuleScene: React.FC = () => {
  const s = scene('capsule');
  const t = useT();
  const linX = 168;
  const hand = { x: linX + LIN_HAND.dx, y: FLOOR + LIN_HAND.dy };
  const linPose = mouthOpen(s, t, 'T') ? 'lin_talk' : 'lin_smile';
  return (
    <Shell s={s} set="classroom">
      <Spr name="cupboard_2" x={CUPBOARD_X} y={FLOOR} />
      <Spr name={linPose} x={linX} y={FLOOR} />
      <Spr name="tinbox_open" x={hand.x} y={hand.y + 4} />
      <Spr name={leoIdle(t, 2) === 'leo_glow2_blink' ? 'leo_glow2_blink' : 'leo_glow2_happy'} x={110} y={FLOOR} />
      <Notes x={110} on t={t} />
      <Papers x={hand.x} y={hand.y - 6} t={t + 5} from={0} />
      <Sparkles x={140} y={44} t={t} from={0.3} />
      <Sfx name="chime" sec={0.3} volume={0.45} />
    </Shell>
  );
};

// ---------------------------------------------------------------- 8. the secret is found
export const EndingScene: React.FC = () => {
  const s = scene('ending');
  const t = useT();
  const tStopped = at(s, 'stopped');
  const tSmiled = at(s, 'smiled');
  const tFound = at(s, 'found');
  const linX = 168;
  const hand = { x: linX + LIN_HAND.dx, y: FLOOR + LIN_HAND.dy };
  let leo: string;
  if (t < tStopped) leo = 'leo_glow2_wow';
  else if (t < tStopped + 0.5) leo = 'leo_glow1_wow';
  else if (t < tSmiled) leo = 'leo_wow';
  else if (t < tFound) leo = 'leo_happy';
  else leo = 'leo_cheer';
  const jump = t >= tFound ? Math.round(Math.abs(Math.sin((t - tFound) * 5)) * 5) : 0;
  return (
    <Shell s={s} set="classroom">
      <Spr name="cupboard_2" x={CUPBOARD_X} y={FLOOR} />
      <Spr name={blinking(t, 3.4) ? 'lin_blink' : 'lin_smile'} x={linX} y={FLOOR} />
      <Spr name="tinbox_open" x={hand.x} y={hand.y + 4} />
      <Spr name={leo} x={110} y={FLOOR - jump} />
      <Notes x={110} on={t < tStopped} t={t} />
      <Sparkles x={110} y={FLOOR - 30} t={t} from={tFound} />
      <Sfx name="twinkle" sec={tFound} volume={0.45} />
    </Shell>
  );
};

// ---------------------------------------------------------------- 9. key words
const CARDS: { word: string; img: string; scale: number }[] = [
  { word: 'pebble', img: 'pebble', scale: 22 },
  { word: 'pocket', img: 'leo_glow2', scale: 4 },
  { word: 'cupboard', img: 'cupboard_0', scale: 4 },
  { word: 'secret', img: 'letter', scale: 18 },
  { word: 'time capsule', img: 'tinbox_open', scale: 12 },
];

export const WordsScene: React.FC = () => {
  const s = scene('words');
  const t = useT();
  const frame = useCurrentFrame();
  const off = Math.floor(frame / 6) % 16;
  return (
    <AbsoluteFill style={{ background: '#73eff7' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-conic-gradient(#41a6f6 0 25%, #73eff7 0 50%)', backgroundSize: `${16 * SCALE}px ${16 * SCALE}px`, backgroundPosition: `${off * SCALE}px ${off * SCALE}px` }} />
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontSize: 136, color: '#f4f4f4', textShadow: '8px 8px 0 #1a1c2c' }}>Key Words</div>
      <div style={{ position: 'absolute', top: 220, left: 0, right: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px 40px', padding: '0 100px' }}>
        {CARDS.map((c, i) => {
          const w = s.sentences[i].words[0];
          const end = s.sentences[i].end;
          const shown = t >= w.start - 0.15;
          const speaking = t >= w.start && t < end + 0.25;
          const ring = speaking ? '#9dffc4' : '#1a1c2c';
          const [iw, ih] = size(c.img);
          return (
            <div key={c.word} style={{ width: 480, height: 380, background: '#f4f4f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 16px', boxSizing: 'border-box', boxShadow: `0 -8px 0 0 ${ring}, 0 8px 0 0 ${ring}, -8px 0 0 0 ${ring}, 8px 0 0 0 ${ring}, 16px 16px 0 0 #257179`, opacity: shown ? 1 : 0, transform: `scale(${shown && t < w.start + 0.1 ? 1.08 : 1})` }}>
              <div style={{ height: 240, display: 'flex', alignItems: 'center' }}>
                <Img src={staticFile(`art/${c.img}.png`)} style={{ width: iw * Math.min(c.scale, 240 / ih), height: ih * Math.min(c.scale, 240 / ih), imageRendering: 'pixelated' }} />
              </div>
              <div style={{ fontFamily: FONT, fontSize: 88, lineHeight: 1, color: speaking ? '#257179' : '#1a1c2c' }}>{c.word}</div>
            </div>
          );
        })}
      </div>
      {s.sentences.map((sen, i) => <Sfx key={i} name="blip" sec={sen.start - 0.15} volume={0.3} />)}
      <Voice s={s} />
    </AbsoluteFill>
  );
};

export { W, H };
