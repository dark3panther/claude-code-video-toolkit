// Copies the pxl build (art/out) into public/art and writes src/art.json: name -> [width, height].
//   node <claude-pxl>/bin/pxl.js build art/story.px.js && node scripts/copy_art.mjs
import { readdirSync, readFileSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dest = join(root, 'public', 'art');
mkdirSync(dest, { recursive: true });
const sizes = {};
for (const dir of ['sprites', 'scenes']) {
  for (const f of readdirSync(join(root, 'art', 'out', dir)).filter((f) => f.endsWith('.png'))) {
    const buf = readFileSync(join(root, 'art', 'out', dir, f));
    sizes[f.slice(0, -4)] = [buf.readUInt32BE(16), buf.readUInt32BE(20)]; // PNG IHDR width, height
    copyFileSync(join(root, 'art', 'out', dir, f), join(dest, f));
  }
}
writeFileSync(join(root, 'src', 'art.json'), JSON.stringify(sizes));
console.log(`copied ${Object.keys(sizes).length} images`);
