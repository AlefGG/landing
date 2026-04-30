#!/usr/bin/env node
// Wave-2 FE-PF-002: pre-build image optimizer.
//
// Reads PNG/JPEG sources from public/assets/images/, emits 480/800/1280w
// AVIF + WebP variants and one compressed fallback in the original format
// to public/assets/images-optimized/. Hash-cached in .cache.json so warm
// runs are <1s. Output dir is gitignored.
//
// PRIORITY_BASENAMES list fails the build on optimization failure so a
// silent LCP regression cannot ship.
//
// CLI: node scripts/optimize-images.mjs

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, parse } from "node:path";
import sharp from "sharp";

const SRC_DIR = "public/assets/images";
const OUT_DIR = "public/assets/images-optimized";
const CACHE_FILE = `${OUT_DIR}/.cache.json`;
const WIDTHS = [480, 800, 1280];
const FORMATS = ["avif", "webp"];
const SKIP_BELOW_BYTES = 50 * 1024;
const QUALITY = { avif: 65, webp: 80 };
// Failures on these basenames fail the build (silent LCP regression
// guard). Anything else logs a warning and skips.
const PRIORITY_BASENAMES = ["cabin-hero"];

async function loadCache() {
  if (!existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function processFile(filename, cache) {
  const fullPath = join(SRC_DIR, filename);
  const buf = await readFile(fullPath);
  if (buf.length < SKIP_BELOW_BYTES) return { skipped: "small" };
  const { name: basename, ext } = parse(filename);
  const lowerExt = ext.toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(lowerExt)) {
    return { skipped: "format" };
  }
  const hash = createHash("sha256").update(buf).digest("hex");
  const cached = cache[basename];
  if (
    cached?.hash === hash &&
    Array.isArray(cached.variants) &&
    cached.variants.every((v) => existsSync(join(OUT_DIR, v)))
  ) {
    return { cached: true };
  }

  let metadata;
  try {
    metadata = await sharp(buf).metadata();
  } catch (err) {
    if (PRIORITY_BASENAMES.includes(basename)) {
      throw new Error(
        `[optimize-images] PRIORITY image ${basename} cannot be decoded: ${err.message}`,
      );
    }
    console.warn(
      `[optimize-images] WARN ${basename}: cannot decode (${err.message}); skipping`,
    );
    return { warned: err.message };
  }
  const maxWidth = metadata.width ?? Infinity;
  const variants = [];

  for (const width of WIDTHS) {
    if (width > maxWidth) continue;
    for (const format of FORMATS) {
      const out = `${basename}@${width}w.${format}`;
      const outPath = join(OUT_DIR, out);
      const opts =
        format === "avif" ? { quality: QUALITY.avif } : { quality: QUALITY.webp };
      try {
        await sharp(buf).resize(width).toFormat(format, opts).toFile(outPath);
        variants.push(out);
      } catch (err) {
        if (PRIORITY_BASENAMES.includes(basename)) {
          throw err;
        }
        console.warn(
          `[optimize-images] WARN ${basename} -> ${format}@${width}w: ${err.message}`,
        );
      }
    }
  }

  // Fallback: largest fitting width in the original format.
  const fallbackWidth = Math.min(1280, maxWidth);
  const fallbackName = `${basename}@${fallbackWidth}w${lowerExt}`;
  const fallbackPath = join(OUT_DIR, fallbackName);
  try {
    if (lowerExt === ".png") {
      await sharp(buf)
        .resize(fallbackWidth)
        .png({ compressionLevel: 9, palette: true })
        .toFile(fallbackPath);
    } else {
      await sharp(buf)
        .resize(fallbackWidth)
        .jpeg({ mozjpeg: true, quality: 82 })
        .toFile(fallbackPath);
    }
    variants.push(fallbackName);
  } catch (err) {
    if (PRIORITY_BASENAMES.includes(basename)) throw err;
    console.warn(
      `[optimize-images] WARN ${basename} fallback: ${err.message}`,
    );
  }

  cache[basename] = {
    hash,
    generated_at: Date.now(),
    variants,
  };
  return { generated: variants.length };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const cache = await loadCache();
  let files;
  try {
    files = await readdir(SRC_DIR);
  } catch (err) {
    console.warn(`[optimize-images] source dir ${SRC_DIR} unreadable: ${err.message}`);
    return;
  }
  let processedCount = 0;
  let generatedCount = 0;
  let cachedCount = 0;
  for (const f of files) {
    let result;
    try {
      result = await processFile(f, cache);
    } catch (err) {
      throw err;
    }
    if (result.skipped) continue;
    processedCount += 1;
    if (result.cached) cachedCount += 1;
    else if (result.generated) generatedCount += result.generated;
  }
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(
    `[optimize-images] ${processedCount} sources, ${generatedCount} variants generated, ${cachedCount} cached`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
