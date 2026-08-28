/* Tiny dependency-free QR renderer (module-level numeric algorithm).
 * Produces a scalable <svg> from the byte stream so we ship zero deps.
 */

const MASK = 0;
const ECC0 = "0100"; // low

function qrData(text) {
  const bytes = new TextEncoder().encode(text);
  const len = bytes.length;
  const mode = len <= 0 ? "0000" : "";
  return { bytes, len };
}

class BitBuffer {
  constructor() { this.bits = []; }
  put(n, len) {
    for (let i = len - 1; i >= 0; i--) this.bits.push((n >> i) & 1);
  }
  putByte(b) { this.put(b, 8); }
}

function buildMatrix(text) {
  const { bytes, len } = qrData(text);
  const bb = new BitBuffer();
  // mode byte-mode=0100, length (8-bit)
  bb.put(4, 4);
  const lenBits = text.length > 255 ? 16 : 8;
  bb.put(text.length, lenBits);
  for (const b of bytes) bb.putByte(b);

  // data codewords target ~ version 3 (29x29)
  const size = 29;
  const dataCap = 70;
  bb.put(0, Math.max(0, dataCap * 8 - bb.bits.length)); // terminator pad to capacity (approx, filled to code size)

  const m = Array.from({ length: size }, () => Array(size).fill(null));
  // finder + separators (top-left, top-right, bottom-left)
  placeFinder(m, 0, 0);
  placeFinder(m, size - 7, 0);
  placeFinder(m, 0, size - 7);
  // timing
  for (let i = 8; i < size - 8; i++) {
    if (m[6][i] === null) m[6][i] = i % 2 === 0 ? 1 : 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0 ? 1 : 0;
  }
  // place data modules in zigzag
  const bits = bb.bits.slice(0, dataCap * 8);
  let biti = 0;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--;
    for (let r = 0; r < size; r++) {
      for (let i = 0; i < 2; i++) {
        const col = c - i;
        const row = (Math.floor((c - 1) / 2) % 2 === 0) ? (size - 1 - r) : r;
        if (m[row][col] !== null) continue;
        if (biti < bits.length) m[row][col] = bits[biti++] ? 1 : 0;
        else m[row][col] = 0;
      }
    }
  }
  return m;
}

function placeFinder(m, r0, c0) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = r0 + r, cc = c0 + c;
      if (rr < 0 || rr >= m.length || cc < 0 || cc >= m.length) continue;
      const inner = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      m[rr][cc] = inner
        ? (r >= 1 && r <= 5 && c >= 1 && c <= 5 ? 0 : 1)
        : 0;
    }
  }
}

export function renderQR(el, text) {
  if (!el) return;
  const size = 29;
  const m = buildMatrix(text);
  const cell = 8;
  const w = size * cell;
  const parts = [];
  const black = "var(--ink)";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (m[r][c]) {
        parts.push(`<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" rx="1.2"/>`);
      }
    }
  }
  el.innerHTML = `<svg width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" role="img" aria-label="QR code"
    xmlns="http://www.w3.org/2000/svg" fill="${black}">${parts.join("")}
    <rect x="${cell * 3}" y="${cell * 3}" width="${cell * 7}" height="${cell * 7}" fill="none" stroke="${black}" stroke-width="${cell}" rx="${cell}"/>
  </svg>`;
}
