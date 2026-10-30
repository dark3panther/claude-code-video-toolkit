import timeline from './timeline.json';
import type { Word } from './Caption';

export const FPS = 30;
export const TRANSITION_FRAMES = 20;

export type SpokenWord = Word & { speaker: 'N' | 'F' | 'C' };
export type Sentence = { start: number; end: number; words: SpokenWord[] };
export type SceneData = {
  id: string;
  duration: number;
  sentences: Sentence[];
  audio: { file: string; start: number; speaker: string }[];
};

export const SCENES = timeline.scenes as SceneData[];
export const scene = (id: string) => SCENES.find((s) => s.id === id)!;
export const sceneFrames = (s: SceneData) => Math.round(s.duration * FPS);
export const TOTAL_FRAMES =
  SCENES.reduce((a, s) => a + sceneFrames(s), 0) - TRANSITION_FRAMES * (SCENES.length - 1);

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** 0..1 progress of t through [a, b]. */
export const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** Start time of word wi in sentence si. */
export const wordAt = (s: SceneData, si: number, wi: number) => s.sentences[si].words[wi].start;

/** The sentence to show as a caption at time t (one at a time). */
export function captionAt(s: SceneData, t: number): Sentence | null {
  for (let i = s.sentences.length - 1; i >= 0; i--) {
    const sen = s.sentences[i];
    if (t >= sen.start - 0.25) {
      return t < s.duration - 0.45 ? sen : null;
    }
  }
  return null;
}

/** True while `who` is speaking and the mouth should be open (flaps ~7 times a second). */
export function mouthOpen(s: SceneData, t: number, who: 'F' | 'C'): boolean {
  for (const sen of s.sentences) {
    for (const w of sen.words) {
      if (w.speaker === who && t >= w.start && t < w.end) {
        return Math.floor((t - w.start) * 7) % 2 === 0;
      }
    }
  }
  return false;
}

/** Natural-looking blink: closed for ~0.12s every few seconds. */
export const blinking = (t: number, period = 3.3, offset = 0) => ((t + offset) % period) < 0.12;
