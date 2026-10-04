import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'build');
const size = 256;
const ss = 4;
const big = size * ss;

const VIOLET = [91, 42, 166, 255];
const VIOLET_DARK = [61, 24, 116, 255];
const WHITE = [255, 255, 255, 255];

function makeCanvas(w, h) {
  return { w, h, data: new Uint8Array(w * h * 4) };
}

function insideRoundedRect(x, y, rx, ry, rw, rh, r) {
  if (x < rx || x > rx + rw || y < ry || y > ry + rh) return false;
  const cx = Math.min(Math.max(x, rx + r), rx + rw - r);
  const cy = Math.min(Math.max(y, ry + r), ry + rh - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function fillRoundedRect(canvas, rx, ry, rw, rh, r, color) {
  for (let y = Math.floor(ry); y < Math.ceil(ry + rh); y += 1) {
    for (let x = Math.floor(rx); x < Math.ceil(rx + rw); x += 1) {
      if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) continue;
      if (!insideRoundedRect(x + 0.5, y + 0.5, rx, ry, rw, rh, r)) continue;
      const i = (y * canvas.w + x) * 4;
      canvas.data[i] = color[0];
      canvas.data[i + 1] = color[1];
      canvas.data[i + 2] = color[2];
      canvas.data[i + 3] = color[3];
    }
  }
}

function fillCircle(canvas, cx, cy, radius, color) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) continue;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > radius * radius) continue;
      const i = (y * canvas.w + x) * 4;
      canvas.data[i] = color[0];
      canvas.data[i + 1] = color[1];
      canvas.data[i + 2] = color[2];
      canvas.data[i + 3] = color[3];
    }
  }
}

function downscale(source, factor) {
  const w = source.w / factor;
  const h = source.h / factor;
  const out = makeCanvas(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let dy = 0; dy < factor; dy += 1) {
        for (let dx = 0; dx < factor; dx += 1) {
          const i = ((y * factor + dy) * source.w + (x * factor + dx)) * 4;
          r += source.data[i];
          g += source.data[i + 1];
          b += source.data[i + 2];
          a += source.data[i + 3];
        }
      }
      const n = factor * factor;
      const o = (y * w + x) * 4;
      out.data[o] = Math.round(r / n);
      out.data[o + 1] = Math.round(g / n);
      out.data[o + 2] = Math.round(b / n);
      out.data[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

function renderIcon() {
  const canvas = makeCanvas(big, big);
  const s = big / size;

  fillRoundedRect(canvas, 4 * s, 4 * s, big - 8 * s, big - 8 * s, 54 * s, VIOLET_DARK);
  fillRoundedRect(canvas, 8 * s, 8 * s, big - 16 * s, big - 16 * s, 50 * s, VIOLET);

  const die = { x: 46 * s, y: 46 * s, size: 164 * s, r: 30 * s };
  fillRoundedRect(canvas, die.x, die.y, die.size, die.size, die.r, WHITE);

  const pip = 15 * s;
  const left = die.x + die.size * 0.27;
  const right = die.x + die.size * 0.73;
  const top = die.y + die.size * 0.27;
  const bottom = die.y + die.size * 0.73;
  const center = die.x + die.size / 2;

  for (const [px, py] of [
    [left, top],
    [right, top],
    [center, center],
    [left, bottom],
    [right, bottom],
  ]) {
    fillCircle(canvas, px, py, pip, VIOLET);
  }

  return downscale(canvas, ss);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function encodePng(canvas) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.w, 0);
  ihdr.writeUInt32BE(canvas.h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = canvas.w * 4;
  const raw = Buffer.alloc((stride + 1) * canvas.h);
  for (let y = 0; y < canvas.h; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(canvas.data.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function encodeIco(pngBuffer, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = width >= 256 ? 0 : width;
  entry[1] = height >= 256 ? 0 : height;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(6 + 16, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

const icon = renderIcon();
const png = encodePng(icon);

fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, 'icon.png'), png);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), encodeIco(png, size, size));

console.log(`[AlgeRoll] Icono generado en build/icon.ico (${size}x${size}).`);
