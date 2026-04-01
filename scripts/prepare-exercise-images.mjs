#!/usr/bin/env node
/**
 * Prepare exercise illustration images for Supabase Storage.
 *
 * Each source image contains 3 perspectives stacked vertically:
 *   - Top:    Starting position
 *   - Middle: Muscle highlight (green overlay)
 *   - Bottom: Side / alternate view
 *
 * Outputs per image:
 *   full.webp    – complete image, 640px wide, quality 85
 *   preview.webp – middle third only, 240px wide, quality 80
 *   thumb.webp   – top third, center-cropped to 80×80, quality 75
 *
 * Usage:
 *   node scripts/prepare-exercise-images.mjs <source> <exercise-key>
 *   node scripts/prepare-exercise-images.mjs --batch <src1> <key1> <src2> <key2> ...
 *
 * Examples:
 *   node scripts/prepare-exercise-images.mjs goblet.png goblet-squat
 *   node scripts/prepare-exercise-images.mjs --batch \
 *     goblet.png goblet-squat \
 *     superman.png superman-hold \
 *     pulldown.png lat-pulldown
 *
 * Output lands in:  ./exercise-images/<key>/full.webp etc.
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve, basename } from "node:path";

const OUTPUT_ROOT = resolve("exercise-images");

async function processImage(srcPath, key) {
  const outDir = resolve(OUTPUT_ROOT, key);
  await mkdir(outDir, { recursive: true });

  const meta = await sharp(srcPath).metadata();
  const { width, height } = meta;
  const thirdH = Math.round(height / 3);

  console.log(
    `\n📐 ${basename(srcPath)} → ${key}/  (${width}×${height}, panel ~${thirdH}px)`
  );

  // 1) full.webp – entire image, 640px wide
  await sharp(srcPath)
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(resolve(outDir, "full.webp"));
  console.log(`   ✔ full.webp    (640w, q85)`);

  // 2) preview.webp – middle third, 240px wide
  await sharp(srcPath)
    .extract({ left: 0, top: thirdH, width, height: thirdH })
    .resize({ width: 240, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(resolve(outDir, "preview.webp"));
  console.log(`   ✔ preview.webp (240w, q80, middle panel)`);

  // 3) thumb.webp – top third, center-cropped square, 80×80
  await sharp(srcPath)
    .extract({ left: 0, top: 0, width, height: thirdH })
    .resize({ width: 80, height: 80, fit: "cover", position: "centre" })
    .webp({ quality: 75 })
    .toFile(resolve(outDir, "thumb.webp"));
  console.log(`   ✔ thumb.webp   (80×80, q75, top panel)`);
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`Usage:
  node scripts/prepare-exercise-images.mjs <source> <key>
  node scripts/prepare-exercise-images.mjs --batch <src1> <key1> [<src2> <key2> ...]`);
  process.exit(0);
}

const pairs = [];

if (args[0] === "--batch") {
  const rest = args.slice(1);
  if (rest.length % 2 !== 0) {
    console.error("❌ --batch expects pairs: <source> <key> <source> <key> ...");
    process.exit(1);
  }
  for (let i = 0; i < rest.length; i += 2) {
    pairs.push([rest[i], rest[i + 1]]);
  }
} else {
  if (args.length < 2) {
    console.error("❌ Provide <source> <key>");
    process.exit(1);
  }
  pairs.push([args[0], args[1]]);
}

for (const [src, key] of pairs) {
  await processImage(src, key);
}

console.log(`\n✅ Done — ${pairs.length * 3} files in ./exercise-images/`);
