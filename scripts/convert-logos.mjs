// Conversion ponctuelle des SVG sources vers PNG/SVG dans public/ et app/.
// Usage: node scripts/convert-logos.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const EMAIL_SRC   = '/Users/zakariya/Downloads/1.svg';
const FAVICON_SRC = '/Users/zakariya/Downloads/LOGO NEUROCARE.svg';

async function svgToPng(srcPath, destPath, size, opts = {}) {
  const buf = fs.readFileSync(srcPath);
  const img = sharp(buf, { density: 384 })
    .resize(size, size, {
      fit: 'contain',
      background: opts.background || { r: 0, g: 0, b: 0, alpha: 0 },
    });
  await img.png().toFile(destPath);
  const { size: bytes } = fs.statSync(destPath);
  console.log(`✔ ${path.relative(ROOT, destPath)}  (${size}×${size}, ${(bytes / 1024).toFixed(1)} KB)`);
}

async function copySvg(srcPath, destPath) {
  fs.copyFileSync(srcPath, destPath);
  console.log(`✔ ${path.relative(ROOT, destPath)}  (svg copy)`);
}

(async () => {
  // 1) Email logo — PNG @ 280×280 (rendu retina à 140×140)
  await svgToPng(EMAIL_SRC, path.join(ROOT, 'public/images/logo-neurocare.png'), 280);

  // 2) Favicons / icônes — depuis le nouveau LOGO NEUROCARE.svg
  await copySvg(FAVICON_SRC, path.join(ROOT, 'public/icon.svg'));
  await copySvg(FAVICON_SRC, path.join(ROOT, 'public/apple-icon.svg'));
  await copySvg(FAVICON_SRC, path.join(ROOT, 'app/icon.svg'));
  await copySvg(FAVICON_SRC, path.join(ROOT, 'app/apple-icon.svg'));

  // PNGs déclarés dans le manifest / liens classiques
  await svgToPng(FAVICON_SRC, path.join(ROOT, 'public/favicon-16.png'), 16);
  await svgToPng(FAVICON_SRC, path.join(ROOT, 'public/favicon-32.png'), 32);
  await svgToPng(FAVICON_SRC, path.join(ROOT, 'public/favicon-48.png'), 48);
  await svgToPng(FAVICON_SRC, path.join(ROOT, 'public/icon-192.png'), 192);
  await svgToPng(FAVICON_SRC, path.join(ROOT, 'public/icon-512.png'), 512);
  await svgToPng(FAVICON_SRC, path.join(ROOT, 'public/apple-touch-icon.png'), 180);

  console.log('\nDone.');
})();
