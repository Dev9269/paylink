/* Generate a branded, looping animated GIF for the PayLink site.
 * Uses a fixed 5-color palette so the file stays tiny and crisp.
 * Built with gifenc (pure JS, offline) - no canvas needed.
 */
import gifenc from "gifenc";
const { GIFEncoder, applyPalette } = gifenc;
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const W = 180, H = 112;
const SIZE = W * H;

// Fixed 5-color palette ordered to match our design tokens exactly.
const PALETTE = [
  [241, 235, 223], // bg
  [251, 248, 241], // surface
  [36, 29, 20],    // ink
  [176, 83, 29],   // accent
  [62, 74, 51],    // forest
];

function frame(t, total) {
  const pix = new Uint8Array(SIZE);
  for (let i = 0; i < SIZE; i++) pix[i] = 0;             // bg
  const ph = (2 * Math.PI * t) / total;
  const count = 4;
  const step = Math.floor(W / count);
  for (let k = 0; k < count; k++) {
    const x = (k * step + ((step * t) / total) % step) % W;
    const cy = Math.round(H / 2 + Math.sin(ph + k * 1.1) * (H / 2 - 20));
    const scale = 1 + 0.2 * Math.sin(ph * 2 + k);
    const color = [2, 3, 4][k % 3];                       // ink, accent, forest
    drawCard(pix, Math.round(x), cy, scale, color);
  }
  return pix;
}

function drawCard(pix, cx, cy, scale, c) {
  const w = Math.round(16 * scale), h = Math.round(11 * scale);
  const x0 = cx - w >> 0, y0 = cy - h >> 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x0 + x, py = y0 + y;
      if (px >= 0 && px < W && py >= 0 && py < H) {
        const rr = x - w / 2, cc = y - h / 2;
        if (rr * rr + cc * cc <= (w * w) / 4 + 2) pix[py * W + px] = c;
      }
    }
  }
  // light dot
  const r = Math.max(1, Math.round(scale * 1.6));
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const px = x0 + w - 6 * scale + dx, py = y0 + Math.round(h / 2) + dy;
        if (px >= 0 && px < W && py >= 0 && py < H) pix[py * W + px] = 1; // surface
      }
    }
  }
}

const total = 22;
const gif = GIFEncoder();
for (let t = 0; t < total; t++) {
  const pix = frame(t, total);
  const idx = applyPalette(pix, PALETTE);
  gif.writeFrame(idx, W, H, { palette: PALETTE, delay: 46, transparent: false });
}
gif.finish();

const out = join(fileURLToPath(new URL("./../src/assets/paylink-flow.gif", import.meta.url)));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, gif.bytes());
console.log("wrote", out, Math.round(gif.bytes().length / 1024), "KB");
