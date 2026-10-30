// Character and prop sprites. Each is a pure function of its pose, so the crow
// and the fox are drawn by the same code in every scene and always match.
// All sprites face right; flip with blit(..., flipX) to face left.

import { C, Grid, Pt, rotAll } from './raster';

export type CrowPose = {
  /** Wing angle in degrees: 0 folded at rest; when flying, -70 up .. 40 down. */
  wing?: number;
  flying?: boolean;
  beakOpen?: boolean;
  cheese?: boolean;
  /** Eyes shut in a happy arc (proud). */
  proud?: boolean;
  blink?: boolean;
  /** Head tilt in degrees, negative = up. */
  headTilt?: number;
};

export const CROW_W = 36;
export const CROW_H = 34;
/** Feet line inside the crow sprite. */
export const CROW_FEET = 31;

export function drawCrow(p: CrowPose = {}): Grid {
  const g = new Grid(CROW_W, CROW_H);
  g.oy = 4; // room for the wing tip on the upstroke
  const tilt = p.headTilt ?? 0;
  const head: Pt = [23, 9];

  // Tail feathers
  g.poly([[9, 15], [1, 19], [0, 22], [3, 23], [10, 20]], C.crow);
  g.poly([[8, 17], [2, 22], [5, 23], [10, 20]], C.wing);

  // Legs (perched only)
  if (!p.flying) {
    g.rect(14, 21, 1, 5, C.grey).rect(18, 21, 1, 5, C.grey);
    g.rect(12, 26, 4, 1, C.grey).rect(16, 26, 4, 1, C.grey);
  }

  // Body and neck
  g.ellipse(15, 16, 9, 6.5, C.crow);
  g.poly([[17, 11], [22, 5], [27, 10], [23, 17], [16, 18]], C.crow);
  // Chest sheen
  g.ellipse(20, 16, 3, 3.5, C.sheen);
  g.ellipse(19.5, 16.5, 2.4, 3, C.crow);

  // Head
  const headPts = (pts: Pt[]) => rotAll(pts, head, tilt);
  g.ellipse(head[0] + tilt * -0.02, head[1] + tilt * 0.03, 5.5, 5, C.crow);

  // Beak
  if (p.beakOpen) {
    g.poly(headPts([[27, 6.5], [34, 6], [27.5, 9]]), C.lgrey);
    g.poly(headPts([[27, 10], [33, 14], [27, 12]]), C.grey);
    g.poly(headPts([[27.5, 9], [31, 11], [27, 10.5]]), C.foxShade); // mouth
  } else {
    g.poly(headPts([[27, 7], [34, 9.5], [27, 12]]), C.lgrey);
    g.line(28, 10, 32, 10, C.grey);
  }

  // Eye
  const [ex, ey] = headPts([[24.5, 7.5]])[0];
  if (p.proud) {
    g.set(ex - 1, ey + 1, C.ink); g.set(ex, ey, C.ink); g.set(ex + 1, ey + 1, C.ink);
  } else if (p.blink) {
    g.rect(ex - 1, ey + 1, 3, 1, C.ink);
  } else {
    g.rect(ex - 1, ey - 1, 3, 3, C.white);
    g.rect(ex, ey, 2, 2, C.ink);
  }

  // Wing
  if (p.flying) {
    const a = p.wing ?? 0;
    const shoulder: Pt = [16, 12];
    const wing: Pt[] = [[12, 12], [20, 11], [14, 2], [7, -2], [4, 0], [8, 6]];
    // wing points defined for "up"; rotate down by (a + 70)
    const r = rotAll(wing, shoulder, -(a + 70));
    g.poly(r, C.wing);
    const inner = rotAll([[13, 11], [18, 11], [13, 4], [9, 3]], shoulder, -(a + 70));
    g.poly(inner, C.sheen);
  } else {
    g.poly([[7, 15], [11, 11], [19, 12], [21, 16], [15, 20], [8, 18]], C.wing);
    g.line(11, 13, 18, 14, C.sheen);
    g.line(10, 16, 16, 17, C.sheen);
  }

  if (p.cheese) {
    const c = drawCheese(false);
    g.blit(c, 29, 8);
  }

  g.oy = 0;
  return g.outline(C.ink);
}

export type FoxPose = {
  /** Leg phase in radians for the walk/run cycle. */
  walk?: number;
  /** Stride length in pixels (0 = standing). */
  stride?: number;
  /** Tail swish in degrees. */
  tail?: number;
  /** Mouth open (talking / laughing). */
  mouth?: boolean;
  /** Head tilt in degrees, negative = looking up. */
  look?: number;
  cheese?: boolean;
  /** Sitting pose. */
  sit?: boolean;
  blink?: boolean;
  /** Happy closed eyes (laughing). */
  happy?: boolean;
};

export const FOX_W = 60;
export const FOX_H = 48;
/** Feet line inside the fox sprite. */
export const FOX_FEET = 46;

/** Where the fox's mouth is inside its sprite (for catching the cheese). */
export function foxMouth(p: FoxPose = {}): Pt {
  const sit = !!p.sit;
  const neck: Pt = sit ? [32, 16] : [34, 12];
  const hy = sit ? 3 : -1;
  const m = rotAll([[46, 9 + hy]], neck, p.look ?? 0)[0];
  return [m[0], m[1] + 8];
}

export function drawFox(p: FoxPose = {}): Grid {
  const g = new Grid(FOX_W, FOX_H);
  g.oy = 8; // drawing coords run from y = -8 so ears can rise above the head
  const look = p.look ?? 0;
  const tailA = p.tail ?? 0;
  const sit = !!p.sit;
  const walk = p.walk ?? 0;
  const stride = p.stride ?? 0;
  const bob = stride > 0 ? Math.round(Math.abs(Math.sin(walk)) * 1) : 0;

  // ---- Tail: overlapping ellipses along a curve, swished around the hip.
  const hip: Pt = sit ? [14, 34] : [12, 22];
  const tailPts: Pt[] = sit
    ? [[10, 35], [6, 34], [3, 31], [2, 27], [3, 23]]
    : [[8, 22], [4, 20], [1, 17], [0, 13], [1, 9]];
  const tp = rotAll(tailPts, hip, tailA);
  tp.forEach(([x, y], i) => g.ellipse(x, y, 4.6 - i * 0.35, 4 - i * 0.3, C.fox));
  const tip = rotAll([sit ? [3, 22] : [1, 8]], hip, tailA)[0];
  g.ellipse(tip[0], tip[1], 3, 3, C.white);

  // ---- Legs
  const leg = (x: number, phase: number, shade: boolean) => {
    const dx = Math.round(Math.sin(walk + phase) * stride);
    const lift = stride > 0 ? Math.max(0, Math.round(-Math.cos(walk + phase) * 2)) : 0;
    const top = 24;
    const bottom = 38 - lift;
    g.poly([[x - 1.5, top], [x + 2.5, top], [x + 2 + dx, bottom], [x - 1 + dx, bottom]], shade ? C.foxShade : C.fox);
    g.rect(x - 1 + dx, bottom - 3, 3, 3, C.dbrown);
  };

  if (sit) {
    // haunch, body sloping up to the chest, two straight front legs
    g.ellipse(18, 31, 9, 7, C.fox);
    g.poly([[11, 37], [17, 22], [24, 14], [32, 14], [35, 24], [33, 38], [11, 38]], C.fox);
    g.ellipse(17, 37.5, 7, 1.5, C.fox);
    g.rect(11, 36, 6, 2, C.dbrown); // back paw
    g.rect(26, 24, 3, 14, C.fox).rect(31, 24, 3, 14, C.fox);
    g.line(29, 26, 29, 37, C.foxShade);
    g.rect(25, 35, 4, 3, C.dbrown).rect(31, 35, 4, 3, C.dbrown);
    g.poly([[25, 18], [29, 8], [38, 11], [35, 22]], C.fox); // neck
    g.ellipse(30.5, 22, 3.5, 6, C.white); // chest
  } else {
    leg(11, Math.PI, true);
    leg(28, 0, true);
    g.ellipse(20, 19 + bob, 13, 7, C.fox);
    g.ellipse(22, 23.5 + bob, 9, 2.5, C.white);
    leg(15, 0, false);
    leg(31, Math.PI, false);
    // neck
    g.poly([[26, 14 + bob], [33, 8], [38, 14], [34, 23 + bob]], C.fox);
    g.ellipse(33, 17 + bob, 3.5, 5, C.white);
  }

  // ---- Head, rotated around the neck so the fox can look up at the tree.
  const neck: Pt = sit ? [32, 16] : [34, 12 + bob];
  const hy = sit ? 3 : bob - 1;
  const H = (pts: Pt[]) => rotAll(pts.map(([x, y]) => [x, y + hy] as Pt), neck, look);
  // ears with dark tips
  g.poly(H([[32, 4], [33, -6], [39, 2]]), C.fox);
  g.poly(H([[38, 2], [43, -6], [45, 5]]), C.fox);
  g.poly(H([[33.5, 2], [33.8, -2], [37, 2]]), C.foxShade);
  g.poly(H([[40, 2], [42.6, -2], [43.5, 3]]), C.foxShade);
  g.poly(H([[32.4, -3], [33, -6], [34.6, -4]]), C.dbrown);
  g.poly(H([[42, -4], [43, -6], [43.8, -3]]), C.dbrown);
  // skull
  const hc = H([[38.5, 7]])[0];
  g.ellipse(hc[0], hc[1], 7.5, 6.5, C.fox);
  // snout + jaw
  if (p.mouth) {
    g.poly(H([[42, 4], [53, 8], [53, 10], [43, 10.5]]), C.fox);
    g.poly(H([[43, 10.5], [53, 10], [51, 12.5], [42, 12]]), C.foxShade);
    g.poly(H([[41, 12], [51, 12.5], [49, 15], [39, 14]]), C.white);
  } else {
    g.poly(H([[42, 4], [53, 8.5], [52, 11.5], [42, 12.5]]), C.fox);
    g.poly(H([[41, 10.5], [52, 11.5], [48, 14], [39, 13.5]]), C.white);
  }
  // white cheek
  g.poly(H([[31, 8], [37, 10], [42, 14], [34, 14.5]]), C.white);
  // nose
  const n = H([[52, 7.5]])[0];
  g.rect(n[0] - 1, n[1], 3, 2, C.ink);
  // eye
  const e = H([[41, 5]])[0];
  if (p.happy) {
    g.set(e[0] - 1, e[1] + 1, C.ink); g.set(e[0], e[1], C.ink); g.set(e[0] + 1, e[1] + 1, C.ink);
  } else if (p.blink) {
    g.rect(e[0] - 1, e[1] + 1, 3, 1, C.ink);
  } else {
    g.rect(e[0] - 1, e[1] - 1, 3, 3, C.ink);
    g.set(e[0], e[1] - 1, C.white);
  }

  if (p.cheese) {
    const m = H([[46, 9]])[0];
    g.blit(drawCheese(false), m[0] - 3, m[1] - 3);
  }

  g.oy = 0;
  return g.outline(C.ink);
}

/** Cheese wedge, 7x6 (small) or 14x11 (big, for icons). */
export function drawCheese(big: boolean, outline = false): Grid {
  if (!big) {
    const g = new Grid(7, 6);
    g.poly([[0, 2], [7, 0], [7, 6], [0, 6]], C.cheese);
    g.rect(0, 2, 7, 1, C.cheese);
    g.set(2, 4, C.cheeseShade); g.set(5, 3, C.cheeseShade);
    g.rect(0, 5, 7, 1, C.cheeseShade);
    return outline ? padOutline(g) : g;
  }
  const g = new Grid(16, 12);
  g.poly([[0, 4], [15, 0], [16, 4], [16, 12], [0, 12]], C.cheese);
  g.poly([[0, 4], [15, 0], [16, 4]], C.sun);
  g.ellipse(4, 8, 1.6, 1.6, C.cheeseShade);
  g.ellipse(10, 7, 1.2, 1.2, C.cheeseShade);
  g.ellipse(12, 10, 1, 1, C.cheeseShade);
  g.rect(0, 11, 16, 1, C.cheeseShade);
  return padOutline(g);
}

/** Returns a copy of g with a 1px margin and an ink outline. */
export function padOutline(g: Grid): Grid {
  const o = new Grid(g.w + 2, g.h + 2);
  o.blit(g, 1, 1);
  return o.outline(C.ink);
}

export function drawCloud(w: number): Grid {
  const h = Math.round(w * 0.45);
  const g = new Grid(w, h);
  g.ellipse(w * 0.3, h * 0.62, w * 0.22, h * 0.36, C.white);
  g.ellipse(w * 0.55, h * 0.45, w * 0.26, h * 0.45, C.white);
  g.ellipse(w * 0.78, h * 0.65, w * 0.2, h * 0.32, C.white);
  g.rect(Math.round(w * 0.12), Math.round(h * 0.7), Math.round(w * 0.8), Math.round(h * 0.28), C.white);
  // underside shade
  for (let x = 0; x < w; x++) {
    for (let y = h - 1; y >= 0; y--) {
      if (g.get(x, y)) { g.set(x, y, C.lgrey); break; }
    }
  }
  return g;
}

/** A big leafy tree. Branch tip (where the crow perches) is returned too. */
export function drawTree(): { g: Grid; perch: Pt } {
  const g = new Grid(110, 110);
  // trunk
  g.poly([[52, 40], [66, 40], [70, 104], [76, 109], [42, 109], [48, 104]], C.brown);
  g.line(56, 50, 55, 100, C.dbrown);
  g.line(62, 60, 63, 96, C.dbrown);
  g.poly([[46, 106], [40, 110], [50, 110]], C.brown);
  // branch toward the left (the perch)
  g.poly([[54, 66], [10, 70], [8, 73], [54, 72]], C.brown);
  g.line(14, 71, 50, 69, C.dbrown);
  // canopy
  const blobs: [number, number, number, number][] = [
    [58, 22, 30, 20], [32, 30, 20, 14], [86, 30, 22, 16], [60, 40, 26, 12],
  ];
  blobs.forEach(([x, y, rx, ry]) => g.ellipse(x, y, rx, ry, C.green));
  // canopy shading and highlights
  [[50, 14, 12, 7], [78, 22, 9, 6], [30, 24, 8, 5]].forEach(([x, y, rx, ry]) => g.ellipse(x, y, rx, ry, C.lgreen));
  [[68, 46, 14, 4], [88, 40, 10, 4], [36, 38, 8, 3]].forEach(([x, y, rx, ry]) => g.ellipse(x, y, rx, ry, C.dgreen));
  // leaf speckles
  for (let i = 0; i < 40; i++) {
    const x = 10 + ((i * 37) % 96);
    const y = 6 + ((i * 53) % 44);
    if (g.get(x, y) === C.green) g.set(x, y, i % 2 ? C.dgreen : C.lgreen);
  }
  g.outline(C.ink);
  return { g, perch: [16, 70] };
}

export function drawFeather(): Grid {
  const g = new Grid(16, 22);
  g.poly([[8, 0], [13, 6], [12, 14], [8, 19], [4, 14], [3, 6]], C.wing);
  g.poly([[8, 2], [11, 7], [10, 13], [8, 15]], C.sheen);
  g.line(8, 1, 8, 21, C.lgrey);
  return padOutline(g);
}

export function drawNote(): Grid {
  const g = new Grid(7, 9);
  g.ellipse(2.5, 7, 2.5, 1.8, C.purple);
  g.rect(4, 0, 1, 7, C.purple);
  g.rect(4, 0, 3, 2, C.purple);
  return padOutline(g);
}

/** Four-point sparkle, size 5 or 7. */
export function drawSparkle(size: 5 | 7, color: number = C.white): Grid {
  const g = new Grid(size, size);
  const m = (size - 1) / 2;
  g.rect(m, 0, 1, size, color).rect(0, m, size, 1, color);
  if (size === 7) g.rect(m - 1, m - 1, 3, 3, color);
  return g;
}

export function drawSun(): Grid {
  const g = new Grid(26, 26);
  g.ellipse(13, 13, 12, 12, C.sun);
  g.ellipse(13, 13, 9, 9, C.cheese);
  return g;
}

export function drawHeart(): Grid {
  const g = new Grid(9, 8);
  g.ellipse(2.5, 2.5, 2.5, 2.5, C.foxShade).ellipse(6.5, 2.5, 2.5, 2.5, C.foxShade);
  g.poly([[0, 3], [9, 3], [4.5, 8]], C.foxShade);
  g.set(2, 1, C.white);
  return padOutline(g);
}

export function drawBang(): Grid {
  const g = new Grid(4, 12);
  g.rect(0, 0, 4, 8, C.foxShade);
  g.rect(0, 9, 4, 3, C.foxShade);
  return padOutline(g);
}

/** Thought bubble with the cheese inside. */
export function drawThought(): Grid {
  const g = new Grid(44, 38);
  g.ellipse(24, 14, 19, 13, C.white);
  g.ellipse(9, 31, 4, 3.4, C.white);
  g.ellipse(3, 36, 2.2, 1.8, C.white);
  g.outline(C.ink);
  g.blit(drawCheese(true), 15, 7);
  return g;
}

/** Small icon tree for the key-word card. */
export function drawIconTree(): Grid {
  const g = new Grid(30, 34);
  g.rect(12, 18, 6, 15, C.brown);
  g.line(14, 21, 14, 31, C.dbrown);
  g.ellipse(15, 11, 13, 10, C.green);
  g.ellipse(11, 7, 5, 3.5, C.lgreen);
  g.ellipse(19, 15, 6, 3, C.dgreen);
  return padOutline(g);
}

/** Crops a region of a sprite (used for the beak close-up). */
export function crop(g: Grid, x: number, y: number, w: number, h: number): Grid {
  const o = new Grid(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o.d[j * w + i] = g.get(x + i, y + j);
  return o;
}

/** Tree stump where the crow finds the cheese. 30x20; top surface at y = 2. */
export function drawStump(): Grid {
  const g = new Grid(32, 22);
  g.rect(3, 4, 24, 15, C.brown);
  g.poly([[0, 21], [3, 14], [3, 21]], C.brown);
  g.poly([[30, 21], [27, 14], [27, 21]], C.brown);
  g.ellipse(15, 4, 12, 3, C.cheese);
  g.ellipse(15, 4, 8, 2, C.cheeseShade);
  g.ellipse(15, 4, 4, 1, C.cheese);
  g.line(9, 9, 9, 18, C.dbrown);
  g.line(20, 10, 20, 19, C.dbrown);
  return padOutline(g);
}
