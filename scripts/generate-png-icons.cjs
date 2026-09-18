const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure-Node PNG encoder
function createPNG(width, height, getPixelRGBA) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  // Raw image data with 0 filter byte per scanline
  const rowStride = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowStride);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRGBA(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(rawData);

  // Helper to construct a chunk
  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  // CRC32 table & implementation
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const mix = (crc ^ byte) & 1;
        crc = (crc >>> 1) ^ (mix ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ -1) >>> 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate stylized bell icon pixel function
function getSchoolBellPixel(isMaskable) {
  return (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;
    const cx = 0.5;
    const cy = 0.5;
    const dx = nx - cx;
    const dy = ny - cy;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);

    // Dark slate background: #0f172a to #1e293b
    const bgR = Math.round(15 + 15 * ny);
    const bgG = Math.round(23 + 18 * ny);
    const bgB = Math.round(42 + 17 * ny);

    if (!isMaskable && distFromCenter > 0.48) {
      // Rounded icon boundary
      return [0, 0, 0, 0];
    }

    // Bell body geometry scaled
    // Center of bell is at (0.5, 0.48)
    const bx = nx - 0.5;
    const by = ny - 0.48;

    // Bell dome shape formula
    const bellTop = -0.22;
    const bellBottom = 0.16;

    if (by >= bellTop && by <= bellBottom) {
      const progress = (by - bellTop) / (bellBottom - bellTop);
      // Width profile of bell
      const halfWidth = 0.08 + 0.18 * Math.pow(progress, 2.2);

      if (Math.abs(bx) <= halfWidth) {
        // Shading on bell (golden amber #f59e0b to #d97706)
        const light = 1.0 - (bx / halfWidth) * 0.4;
        const r = Math.min(255, Math.round(245 * light));
        const g = Math.min(255, Math.round(158 * light));
        const b = Math.min(255, Math.round(11 * light));
        return [r, g, b, 255];
      }
    }

    // Bell Clapper at bottom
    const clapperY = 0.22;
    const cdx = bx;
    const cdy = by - clapperY;
    if (Math.sqrt(cdx * cdx + cdy * cdy) <= 0.055) {
      return [217, 119, 6, 255];
    }

    // Soundwaves
    const waveDist = Math.sqrt(bx * bx + by * by);
    if ((waveDist >= 0.28 && waveDist <= 0.31) || (waveDist >= 0.35 && waveDist <= 0.37)) {
      if (Math.abs(bx) > 0.20 && Math.abs(by) < 0.20) {
        return [251, 191, 36, 200];
      }
    }

    // Default background
    return [bgR, bgG, bgB, 255];
  };
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. 192x192
console.log('Generating pwa-192x192.png...');
const png192 = createPNG(192, 192, getSchoolBellPixel(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 2. 512x512
console.log('Generating pwa-512x512.png...');
const png512 = createPNG(512, 512, getSchoolBellPixel(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// 3. 512x512 maskable (with full-bleed background)
console.log('Generating pwa-maskable-512x512.png...');
const pngMaskable = createPNG(512, 512, getSchoolBellPixel(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// 4. apple-touch-icon 180x180
console.log('Generating apple-touch-icon.png...');
const pngApple = createPNG(180, 180, getSchoolBellPixel(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// 5. favicon.ico (can copy 192 or write small)
const png32 = createPNG(32, 32, getSchoolBellPixel(false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png32);

console.log('All icons generated successfully!');
