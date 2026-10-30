// The shared meadow every story scene is set in: 240x135 art pixels, shown at 8x.
import { C, Grid } from './raster';
import { drawCloud, drawSun, drawTree } from './sprites';

export const W = 240;
export const H = 135;
export const SCALE = 8;
export const GROUND_Y = 96;

const TREE = drawTree();
export const TREE_X = 128;
export const TREE_Y = GROUND_Y - 104;
/** Where the crow's feet go when perched (art pixels). */
export const PERCH: [number, number] = [TREE_X + TREE.perch[0], TREE_Y + TREE.perch[1]];

const CLOUDS = [
  { g: drawCloud(34), y: 10, speed: 0.06, x0: 20 },
  { g: drawCloud(24), y: 26, speed: 0.1, x0: 120 },
  { g: drawCloud(40), y: 6, speed: 0.045, x0: 200 },
];
const SUN = drawSun();

const sky = (() => {
  const g = new Grid(W, H);
  // sky: deep blue at the top, light near the horizon, joined by a 4x4 Bayer dither
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < GROUND_Y; y++) {
    const t = (y - 36) / 18;
    for (let x = 0; x < W; x++) {
      g.set(x, y, bayer[(y % 4) * 4 + (x % 4)] / 16 < t ? C.skyLight : C.sky);
    }
  }
  // distant hills
  g.ellipse(40, GROUND_Y + 6, 60, 20, C.green);
  g.ellipse(200, GROUND_Y + 10, 70, 22, C.green);
  g.ellipse(112, GROUND_Y + 3, 34, 11, C.dgreen);
  // ground
  g.rect(0, GROUND_Y, W, H - GROUND_Y, C.lgreen);
  for (let x = 0; x < W; x++) g.set(x, GROUND_Y, C.green);
  for (let y = GROUND_Y + 4; y < H; y += 6) {
    for (let x = (y * 7) % 11; x < W; x += 13) {
      g.set(x, y, C.green); g.set(x + 1, y - 1, C.green); g.set(x + 2, y, C.green);
    }
  }
  // flowers
  [[14, 104], [70, 112], [104, 101], [196, 108], [226, 100], [36, 118]].forEach(([x, y], i) => {
    g.rect(x, y, 1, 3, C.dgreen);
    g.set(x, y - 1, i % 2 ? C.white : C.cheese);
    g.set(x - 1, y - 1, C.foxShade); g.set(x + 1, y - 1, C.foxShade); g.set(x, y - 2, C.foxShade);
  });
  return g;
})();

export type WorldOpts = { tree?: boolean; sunX?: number };

/** Paints sky, sun, drifting clouds, ground and (optionally) the tree. */
export function drawWorld(frame: number, opts: WorldOpts = {}): Grid {
  const g = new Grid(W, H);
  g.d.set(sky.d);
  g.blit(SUN, opts.sunX ?? 18, 8);
  for (const c of CLOUDS) {
    const span = W + c.g.w;
    const x = ((c.x0 + frame * c.speed) % span) - c.g.w;
    g.blit(c.g, Math.floor(x), c.y);
  }
  if (opts.tree !== false) g.blit(TREE.g, TREE_X, TREE_Y);
  return g;
}
