// The Boy with the Whispering Pocket: every character, prop and set, drawn with pxl
// (github.com/dark3panther/claude-pxl). Build: node <pxl>/bin/pxl.js build art/story.px.js
// Sizes are art pixels; the video shows them at 8x (240x135 -> 1920x1080), like The Crow and the Fox.
// Characters face right and stand with their feet on the bottom row; the video flips them to face left.

// The Crow and the Fox palette, plus skin, hair and clothes.
pal({
  k: "#1a1c2c", K: "#333c57", n: "#29366f", N: "#3b5dc9", s: "#41a6f6", S: "#73eff7", w: "#f4f4f4",
  l: "#94b0c2", L: "#566c86", o: "#ef7d57", r: "#b13e53", y: "#ffcd75", Y: "#e8a33c", G: "#a7f070",
  g: "#38b764", t: "#257179", b: "#8a4b2a", B: "#5a2e1a", p: "#5d275d", u: "#fff4a3",
  // Leo
  d: "#8f5d3e", D: "#6a442e", h: "#2e2626",
  // Mrs. Lin
  f: "#f3cdb2", F: "#d9a98c", e: "#cfcfcf", E: "#9a9a9a", v: "#8d6cc7", V: "#5d4a8c",
  // glow green, wood
  q: "#9dffc4", Q: "#4fd68a", m: "#c98e5b", M: "#a06a3c", c: "#f2e3c6", C: "#e0c9a0",
})
ramps("kKnNsS", "kBbMmCcw", "ktgG", "kryu", "kDdF", "kVvw", "kLlw", "tQqw")

// ------------------------------------------------------------------ people
// A pose: legs ("stand" or walk frame 0-3), arms in degrees (0 = down, 90 = straight forward,
// 160 = raised), eyes ("open" | "shut" | "happy" | "wide"), mouth ("smile" | "open" | "o" | "grin").
const LEGS = { stand: [0, 0], 0: [-2, 2], 1: [0, 0], 2: [2, -2], 3: [0, 0] }

function arm(x, y, deg, len, sleeve, skin, w = 3) {
  const a = (deg * Math.PI) / 180
  const hx = Math.round(x + Math.sin(a) * len)
  const hy = Math.round(y + Math.cos(a) * len)
  return [line(x, y, hx, hy, sleeve, w), circ(hx, hy, 1, skin)]
}

function face(cx, cy, eyes, mouth, skinDark) {
  const ex = cx + 4, ey = cy - 1
  const out = []
  if (eyes === "shut") out.push(hline(ex - 1, ey + 1, 2, "k"))
  else if (eyes === "happy") out.push(px(ex - 1, ey + 1, "k"), px(ex, ey, "k"), px(ex + 1, ey + 1, "k"))
  else if (eyes === "wide") out.push(rect(ex - 1, ey - 1, 2, 3, "k"), px(ex - 1, ey - 1, "w"))
  else out.push(rect(ex, ey, 1, 2, "k"))
  const mx = cx + 5, my = cy + 4
  if (mouth === "open") out.push(rect(mx - 1, my, 3, 2, "k"), px(mx, my + 1, "r"))
  else if (mouth === "o") out.push(rect(mx, my - 1, 2, 2, "k"))
  else if (mouth === "grin") out.push(hline(mx - 2, my, 4, "k"), px(mx - 3, my - 1, "k"), hline(mx - 1, my + 1, 2, "r"))
  else out.push(hline(mx - 1, my, 3, "k"), px(mx - 2, my - 1, "k"))
  out.push(px(cx + 7, cy + 1, skinDark)) // nose
  return out
}

/** Leo: 7, dark brown skin, short black curly hair, green T-shirt, blue trousers. 26 x 46 before outline. */
function leo(o = {}) {
  const { legs = "stand", back = 4, front = 4, eyes = "open", mouth = "smile", glow = 0, lean = 0 } = o
  const [bl, fl] = LEGS[legs]
  const cx = 12 + lean, cy = 14
  return [
    // legs and shoes
    rect(9 + bl, 34, 4, 9, "n"), rect(8 + bl, 43, 6, 3, "k"),
    rect(13 + fl, 34, 4, 9, "N"), rect(13 + fl, 43, 6, 3, "K"),
    // back arm, body, front arm
    ...arm(10 + lean, 24, -back, 9, "t", "D"),
    rect(7 + lean, 22, 11, 13, "g"), hline(7 + lean, 34, 11, "t"), rect(8 + lean, 21, 9, 2, "g"),
    rect(13 + lean, 28, 4, 4, "t"), // pocket
    ...(glow ? [rect(14 + lean, 29, 2, 2, glow > 1 ? "q" : "Q")] : []),
    ...arm(15 + lean, 24, front, 9, "g", "d"),
    // neck and head
    rect(11 + lean, 19, 3, 3, "D"),
    circ(cx, cy, 8, "d"),
    // curly hair: bumps over the top and back
    circ(cx - 4, cy - 6, 3, "h"), circ(cx, cy - 7, 3, "h"), circ(cx + 4, cy - 6, 2, "h"),
    circ(cx - 7, cy - 2, 3, "h"), circ(cx - 6, cy + 2, 2, "h"), px(cx + 6, cy - 5, "h"),
    circ(cx - 3, cy + 1, 1, "D"), // ear
    ...face(cx, cy, eyes, mouth, "D"),
  ]
}

/** Mrs. Lin: older teacher, grey hair in a bun, glasses, purple cardigan, long skirt. 28 x 56 before outline. */
function lin(o = {}) {
  const { legs = "stand", back = 4, front = 4, eyes = "open", mouth = "smile" } = o
  const [bl, fl] = LEGS[legs]
  const cx = 13, cy = 15
  return [
    rect(10 + bl, 50, 4, 4, "F"), rect(9 + bl, 53, 6, 3, "k"),
    rect(14 + fl, 50, 4, 4, "F"), rect(14 + fl, 53, 6, 3, "K"),
    poly([7, 36, 21, 36, 23, 51, 5, 51], "V"), // skirt
    ...arm(10, 26, -back, 11, "V", "F"),
    rect(7, 24, 13, 14, "w"), rect(7, 24, 4, 14, "v"), rect(16, 24, 4, 14, "v"), rect(8, 23, 11, 2, "v"),
    ...arm(17, 26, front, 11, "v", "f"),
    rect(12, 20, 3, 4, "F"),
    circ(cx, cy, 8, "f"),
    circ(cx - 3, cy - 8, 4, "e"), circ(cx - 9, cy - 6, 3, "e"), // bun at the back
    circ(cx - 6, cy - 4, 3, "e"), circ(cx - 2, cy - 7, 3, "e"), circ(cx + 3, cy - 7, 3, "e"), circ(cx + 6, cy - 4, 2, "e"),
    px(cx + 1, cy - 3, "f"),
    circ(cx - 3, cy + 1, 1, "F"),
    ...face(cx, cy, eyes, mouth, "F"),
    // glasses
    box(cx + 2, cy - 3, 4, 4, "V"), hline(cx + 6, cy - 2, 2, "V"),
  ]
}

const pose = (name, fn, o) => sprite(name, { w: 30, h: name.startsWith("lin") ? 58 : 48, outline: "k" }, ...fn(o))

for (let f = 0; f < 4; f++) pose(`leo_walk_${f}`, leo, { legs: f, back: [-18, 0, 18, 0][f], front: [18, 0, -18, 0][f] })
pose("leo_stand", leo, {})
pose("leo_blink", leo, { eyes: "shut" })
pose("leo_talk", leo, { mouth: "open" })
pose("leo_wow", leo, { eyes: "wide", mouth: "o" })
pose("leo_wow_talk", leo, { eyes: "wide", mouth: "open", front: 70 })
pose("leo_point", leo, { front: 100, mouth: "open", eyes: "wide" })
pose("leo_happy", leo, { eyes: "happy", mouth: "grin" })
pose("leo_cheer", leo, { eyes: "happy", mouth: "grin", front: 165, back: -165 })
pose("leo_bend", leo, { front: 40, lean: 2, eyes: "wide", mouth: "o" })
pose("leo_hold_up", leo, { front: 160, eyes: "wide", mouth: "grin" })
pose("leo_pocket", leo, { front: 25, eyes: "happy", mouth: "smile", glow: 1 })
for (const g of [1, 2]) {
  pose(`leo_glow${g}`, leo, { glow: g })
  pose(`leo_glow${g}_blink`, leo, { glow: g, eyes: "shut" })
  pose(`leo_glow${g}_wow`, leo, { glow: g, eyes: "wide", mouth: "o" })
  for (let f = 0; f < 4; f++) pose(`leo_glow${g}_walk_${f}`, leo, { glow: g, legs: f, back: [-18, 0, 18, 0][f], front: [18, 0, -18, 0][f] })
}
pose("leo_glow2_point", leo, { glow: 2, front: 100, mouth: "open", eyes: "wide" })
pose("leo_glow2_happy", leo, { glow: 2, eyes: "happy", mouth: "grin" })
pose("leo_glow2_point_shut", leo, { glow: 2, front: 100, mouth: "smile", eyes: "wide" })
pose("leo_glow2_cheer", leo, { glow: 2, eyes: "happy", mouth: "grin", front: 165, back: -165 })
pose("leo_glow1_happy", leo, { glow: 1, eyes: "happy", mouth: "smile" })

for (let f = 0; f < 4; f++) pose(`lin_walk_${f}`, lin, { legs: f, back: [-14, 0, 14, 0][f], front: [14, 0, -14, 0][f] })
pose("lin_stand", lin, {})
pose("lin_blink", lin, { eyes: "shut" })
pose("lin_reach", lin, { front: 95, back: -80 })
pose("lin_hold", lin, { front: 70, eyes: "wide", mouth: "o" })
pose("lin_talk", lin, { front: 70, eyes: "happy", mouth: "open" })
pose("lin_smile", lin, { front: 70, eyes: "happy", mouth: "grin" })

// ------------------------------------------------------------------ props
sprite("pebble", { outline: "k" }, `
  .QQQ.
  QqqQQ
  QQQQt
  .tt t`)
sprite("pebble_dim", { base: "pebble", swap: { q: "Q", Q: "t" } })
// halo drawn as dithered rings, so the glow stays pixel art
sprite("halo", { w: 21, h: 21 }, layer("a", { density: 0.25 }, circ(10, 10, 10, "q")), layer("b", { density: 0.55 }, circ(10, 10, 6, "q")), circ(10, 10, 3, "q"))

sprite("note", { outline: "k" }, `
  ..yy
  ..yY
  ..y.
  ..y.
  yyy.
  yYy.`)
sprite("note2", { base: "note", swap: { y: "o", Y: "r" } })
sprite("sparkle", { mx: "c" }, `
  ..w
  ..w
  wwu`)

// Cupboard: 34 x 50; the doors swing open as frames (closed, ajar, open).
function cupboard(open) {
  const items = [
    rect(0, 2, 34, 48, "M"), rect(0, 0, 34, 4, "m"), rect(2, 46, 4, 4, "B"), rect(28, 46, 4, 4, "B"),
    rect(3, 5, 28, 39, "B"), hline(3, 25, 28, "M"), // inside, shelf
  ]
  if (open === 0) {
    items.push(rect(3, 5, 14, 39, "m"), rect(17, 5, 14, 39, "m"), vline(17, 5, 39, "M"),
      box(5, 8, 10, 14, "M"), box(5, 26, 10, 15, "M"), box(19, 8, 10, 14, "M"), box(19, 26, 10, 15, "M"),
      px(15, 24, "y"), px(19, 24, "y"))
  } else {
    const dw = open === 1 ? 8 : 3
    items.push(rect(3, 5, dw, 39, "m"), rect(31 - dw, 5, dw, 39, "m"),
      rect(0 - (open === 2 ? 0 : 0), 5, 3, 39, "m"))
  }
  return items
}
for (const o of [0, 1, 2]) sprite(`cupboard_${o}`, { w: 34, h: 50, outline: "k" }, ...cupboard(o))

sprite("tinbox", { w: 14, h: 9, outline: "k" }, rect(0, 2, 14, 7, "l"), rect(0, 0, 14, 3, "w"), hline(0, 5, 14, "L"),
  px(3, 4, "c"), px(9, 6, "c"), px(11, 3, "C"))
sprite("tinbox_open", { w: 14, h: 12, outline: "k" }, rect(0, 5, 14, 7, "l"), hline(0, 8, 14, "L"),
  poly([0, 5, 2, 0, 16, 0, 14, 5], "w"), rect(2, 3, 4, 3, "c"), rect(7, 2, 4, 4, "y"))
sprite("letter", { w: 7, h: 6, outline: "k" }, rect(0, 0, 7, 6, "c"), hline(1, 1, 5, "L"), hline(1, 3, 4, "L"))
sprite("drawing", { w: 7, h: 6, outline: "k" }, rect(0, 0, 7, 6, "w"), circ(3, 3, 1, "o"), px(5, 1, "y"), hline(1, 5, 5, "g"))
sprite("dust", { w: 5, h: 5 }, px(0, 2, "C"), px(2, 0, "C"), px(4, 3, "C"), px(2, 4, "C"))

// ------------------------------------------------------------------ sets (240 x 135)
const GROUND = 100
scene("playground", { w: 240, h: 135, bg: "s" },
  grad(0, 0, 240, 70, "sS", "v", 0.6),
  // sun and clouds
  circ(26, 20, 9, "u"), circ(26, 20, 7, "y"),
  ...[[60, 18, 16], [150, 12, 22], [205, 26, 12]].flatMap(([x, y, r]) => [ellipse(x, y, r, 5, "w"), ellipse(x + r * 0.4, y - 3, r * 0.5, 4, "w"), hline(x - r + 2, y + 4, 2 * r - 4, "l")]),
  // distant trees and hills
  ellipse(40, 82, 70, 18, "g"), ellipse(210, 84, 70, 20, "g"), ellipse(128, 86, 40, 12, "t"),
  // fence
  ...Array.from({ length: 20 }, (_, i) => [rect(i * 13, 72, 6, 20, "c"), px(i * 13 + 2, 71, "c"), px(i * 13 + 3, 71, "c")]).flat(),
  rect(0, 78, 240, 3, "C"), rect(0, 86, 240, 3, "C"),
  // slide
  rect(170, 54, 3, 46, "r"), rect(186, 54, 3, 46, "r"), rect(168, 52, 23, 4, "y"),
  poly([189, 54, 195, 54, 222, 98, 216, 100], "N"), hline(214, 99, 10, "n"),
  vline(176, 58, 40, "L"), hline(173, 64, 13, "L"), hline(173, 74, 13, "L"), hline(173, 84, 13, "L"),
  // ground
  rect(0, GROUND - 8, 240, 43, "G"), hline(0, GROUND - 8, 240, "g"),
  ellipse(60, 112, 26, 4, "C"), ellipse(150, 118, 34, 5, "C"), // sandy patches
  ...[[14, 106], [92, 104], [126, 124], [200, 108], [228, 120], [40, 128]].flatMap(([x, y], i) => [vline(x, y, 3, "t"), px(x, y - 1, i % 2 ? "w" : "y"), px(x - 1, y - 1, "r"), px(x + 1, y - 1, "r")]),
  ...Array.from({ length: 30 }, (_, i) => [(i * 37) % 236 + 2, 96 + ((i * 53) % 36)]).flatMap(([x, y]) => [px(x, y, "g"), px(x + 1, y - 1, "g"), px(x + 2, y, "g")]),
)

scene("classroom", { w: 240, h: 135, bg: "c" },
  rect(0, 0, 240, 92, "c"), hline(0, 60, 240, "C"), rect(0, 61, 240, 31, "C"), // wall with a wainscot
  ...Array.from({ length: 24 }, (_, i) => vline(i * 10 + 4, 62, 30, "c")),
  // window with sky
  rect(12, 10, 52, 40, "w"), rect(15, 13, 46, 34, "S"), rect(15, 13, 46, 12, "s"), vline(37, 13, 34, "w"), hline(15, 29, 46, "w"),
  circ(52, 19, 4, "u"), ellipse(26, 36, 7, 2, "w"),
  // chalkboard
  rect(80, 10, 84, 44, "b"), rect(83, 13, 78, 38, "t"), rect(84, 52, 76, 3, "M"),
  text(90, 20, "ABC", "w"), text(90, 30, "1 2 3", "w"), line(130, 22, 150, 40, "S"), circ(146, 22, 4, "y"), ring(146, 22, 4, "Y"),
  rect(150, 50, 4, 2, "w"), // chalk
  // children's pictures
  rect(176, 14, 16, 12, "w"), circ(184, 20, 3, "o"), rect(200, 20, 16, 12, "w"), rect(203, 24, 10, 6, "g"), px(206, 22, "y"),
  // floor
  rect(0, 92, 240, 43, "m"), hline(0, 92, 240, "M"),
  ...[100, 109, 119, 130].map((y) => hline(0, y, 240, "M")),
  ...Array.from({ length: 16 }, (_, i) => [vline((i * 31) % 240, 93 + (i % 4) * 9, 7, "M")]).flat(),
  // a desk with a book at the left
  rect(10, 86, 40, 4, "b"), rect(12, 90, 3, 14, "B"), rect(45, 90, 3, 14, "B"), rect(20, 82, 12, 4, "r"), hline(20, 82, 12, "o"),
)

sheet("leo", ["leo_*"], { pad: 1 })
sheet("lin", ["lin_*"], { pad: 1 })

// ------------------------------------------------------------------ Story Quest game pieces
sprite("stone", { w: 24, h: 7, outline: "k" }, ellipse(11, 3, 11, 3, "l"), ellipse(11, 2, 10, 2, "w"), hline(4, 5, 15, "L"), px(6, 2, "l"), px(15, 1, "l"))
sprite("stone_lit", { base: "stone", swap: { w: "u", l: "y" } })
sprite("stone_done", { base: "stone", swap: { w: "G", l: "g", L: "t" } })
sprite("flag", { w: 10, h: 18, outline: "k" }, vline(1, 0, 18, "B"), poly([2, 1, 10, 4, 2, 8], "q"), poly([2, 2, 8, 4, 2, 6], "Q"))
