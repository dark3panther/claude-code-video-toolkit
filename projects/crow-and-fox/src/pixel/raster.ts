// A tiny palette-indexed raster. Everything in the video is drawn into one of
// these at low resolution and scaled up with nearest-neighbour sampling, so
// every edge lands on the pixel grid.

export const PALETTE: string[] = [
  'transparent', // 0
  '#1a1c2c', // 1  outline / ink
  '#333c57', // 2  crow body
  '#29366f', // 3  crow wing
  '#3b5dc9', // 4  crow sheen
  '#41a6f6', // 5  sky
  '#73eff7', // 6  sky light
  '#f4f4f4', // 7  white
  '#94b0c2', // 8  light grey (beak, cloud shade)
  '#566c86', // 9  grey
  '#ef7d57', // 10 fox orange
  '#b13e53', // 11 fox shade / red
  '#ffcd75', // 12 cheese yellow
  '#e8a33c', // 13 cheese shade
  '#a7f070', // 14 light green
  '#38b764', // 15 green
  '#257179', // 16 dark green
  '#8a4b2a', // 17 trunk brown
  '#5a2e1a', // 18 dark brown
  '#5d275d', // 19 purple
  '#fff4a3', // 20 sun pale
];

export const C = {
  none: 0, ink: 1, crow: 2, wing: 3, sheen: 4, sky: 5, skyLight: 6, white: 7,
  lgrey: 8, grey: 9, fox: 10, foxShade: 11, cheese: 12, cheeseShade: 13,
  lgreen: 14, green: 15, dgreen: 16, brown: 17, dbrown: 18, purple: 19, sun: 20,
} as const;

const RGBA: number[][] = PALETTE.map((hex) => {
  if (hex === 'transparent') return [0, 0, 0, 0];
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
});

export type Pt = [number, number];

export class Grid {
  w: number;
  h: number;
  d: Uint8Array;
  /** Drawing offset applied by set(): lets a sprite draw with a margin. */
  ox = 0;
  oy = 0;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h);
  }

  set(x: number, y: number, c: number) {
    x = Math.floor(x + this.ox);
    y = Math.floor(y + this.oy);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  }

  /** Raw read, ignoring the drawing offset. */
  get(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  }

  fill(c: number) {
    this.d.fill(c);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  /** Filled ellipse sampled at pixel centres. */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: number) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
    return this;
  }

  /** Filled polygon sampled at pixel centres (even-odd rule). */
  poly(pts: Pt[], c: number) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
        const px = x + 0.5, py = y + 0.5;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[j];
          if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, c);
      }
    }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, c: number) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }

  /** Adds a 1px outline of colour c around every filled pixel (4-neighbour). */
  outline(c: number = C.ink) {
    const out = new Uint8Array(this.d);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== 0) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) {
          out[y * this.w + x] = c;
        }
      }
    }
    this.d = out;
    return this;
  }

  /** Copies src onto this grid at (ox, oy); transparent pixels are skipped. */
  blit(src: Grid, ox: number, oy: number, flipX = false) {
    ox = Math.round(ox);
    oy = Math.round(oy);
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.d[y * src.w + (flipX ? src.w - 1 - x : x)];
        if (c) this.set(ox + x, oy + y, c);
      }
    }
    return this;
  }

  /** Recolours every pixel of colour `from` to `to`. */
  swap(from: number, to: number) {
    for (let i = 0; i < this.d.length; i++) if (this.d[i] === from) this.d[i] = to;
    return this;
  }

  toImageData(): ImageData {
    const img = new ImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) {
      const rgba = RGBA[this.d[i]];
      img.data[i * 4] = rgba[0];
      img.data[i * 4 + 1] = rgba[1];
      img.data[i * 4 + 2] = rgba[2];
      img.data[i * 4 + 3] = rgba[3];
    }
    return img;
  }
}

export const rot = (p: Pt, o: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  const dx = p[0] - o[0], dy = p[1] - o[1];
  return [o[0] + dx * Math.cos(a) - dy * Math.sin(a), o[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};

export const rotAll = (pts: Pt[], o: Pt, deg: number): Pt[] => pts.map((p) => rot(p, o, deg));
