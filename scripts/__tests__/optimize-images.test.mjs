// Wave-2 FE-PF-002: tests for the sharp pre-build image optimizer.
//
// Spawns optimize-images.mjs as a child Node process inside an isolated
// tmpdir per test so cache state, source dir, and output dir are sealed.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readdir, readFile, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SCRIPT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "optimize-images.mjs",
);

async function makeWorkspace() {
  const dir = await mkdtemp(join(tmpdir(), "optimize-images-"));
  await mkdir(join(dir, "public", "assets", "images"), { recursive: true });
  return dir;
}

// Solid-fill PNGs compress to <20 KB; we need >50 KB to pass the script's
// SKIP_BELOW_BYTES gate. Use Gaussian noise + zero compression.
async function noisyPng(width, height, seed = "#888888") {
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: seed,
      noise: { type: "gaussian", mean: 128, sigma: 60 },
    },
  })
    .png({ compressionLevel: 0 })
    .toBuffer();
}

function runScript(cwd) {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd,
    encoding: "utf8",
  });
}

test("generates 6 variants + 1 fallback for a 1500x800 PNG > 50KB", async () => {
  const dir = await makeWorkspace();
  const buf = await noisyPng(1500, 800);
  assert.ok(buf.length > 50 * 1024, `synthetic too small: ${buf.length}`);
  await writeFile(join(dir, "public/assets/images/photo.png"), buf);
  const r = runScript(dir);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const out = await readdir(join(dir, "public/assets/images-optimized"));
  const names = out.filter((n) => n.startsWith("photo@"));
  // Expect exactly: 480/800/1280 × {avif, webp} + 1 fallback @1280w.png
  assert.ok(names.includes("photo@480w.avif"), `missing 480w avif: ${names.join(",")}`);
  assert.ok(names.includes("photo@480w.webp"));
  assert.ok(names.includes("photo@800w.avif"));
  assert.ok(names.includes("photo@800w.webp"));
  assert.ok(names.includes("photo@1280w.avif"));
  assert.ok(names.includes("photo@1280w.webp"));
  assert.ok(names.includes("photo@1280w.png"));
  assert.equal(names.length, 7);
});

test("cache hit skips generation on second run", async () => {
  const dir = await makeWorkspace();
  const buf = await noisyPng(1500, 800);
  await writeFile(join(dir, "public/assets/images/cached.png"), buf);
  const r1 = runScript(dir);
  assert.equal(r1.status, 0, r1.stderr);
  const variantPath = join(
    dir,
    "public/assets/images-optimized/cached@480w.avif",
  );
  const m1 = await stat(variantPath);
  await new Promise((res) => setTimeout(res, 25));
  const r2 = runScript(dir);
  assert.equal(r2.status, 0);
  const m2 = await stat(variantPath);
  // mtime unchanged → second run was a cache hit
  assert.equal(m1.mtimeMs, m2.mtimeMs);
  assert.match(r2.stdout, /1 cached/);
});

test("hash mismatch regenerates", async () => {
  const dir = await makeWorkspace();
  const buf1 = await noisyPng(1500, 800, "#222266");
  const src = join(dir, "public/assets/images/changing.png");
  await writeFile(src, buf1);
  const r1 = runScript(dir);
  assert.equal(r1.status, 0, r1.stderr);
  const variantPath = join(
    dir,
    "public/assets/images-optimized/changing@480w.avif",
  );
  const m1 = await stat(variantPath);
  await new Promise((res) => setTimeout(res, 25));

  // Replace source with a different image (different hash).
  const buf2 = await noisyPng(1500, 800, "#aa3344");
  await writeFile(src, buf2);

  const r2 = runScript(dir);
  assert.equal(r2.status, 0, r2.stderr);
  const m2 = await stat(variantPath);
  assert.notEqual(m1.mtimeMs, m2.mtimeMs);
});

test("source narrower than max width skips upscale variants", async () => {
  const dir = await makeWorkspace();
  // 800x600 → no 1280w variants should appear.
  const buf = await noisyPng(800, 600);
  assert.ok(buf.length > 50 * 1024);
  await writeFile(join(dir, "public/assets/images/narrow.png"), buf);
  const r = runScript(dir);
  assert.equal(r.status, 0, r.stderr);
  const out = await readdir(join(dir, "public/assets/images-optimized"));
  const names = out.filter((n) => n.startsWith("narrow@"));
  assert.ok(
    !names.some((n) => n.startsWith("narrow@1280w.")),
    `unexpected 1280w variant: ${names.join(",")}`,
  );
  assert.ok(names.includes("narrow@480w.avif"));
  assert.ok(names.includes("narrow@800w.avif"));
});

test("small file (<50KB) is skipped entirely", async () => {
  const dir = await makeWorkspace();
  // Tiny solid-colour PNG; well under 50 KB.
  const tiny = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  assert.ok(tiny.length < 50 * 1024);
  await writeFile(join(dir, "public/assets/images/tiny.png"), tiny);
  const r = runScript(dir);
  assert.equal(r.status, 0, r.stderr);
  const out = await readdir(join(dir, "public/assets/images-optimized"));
  assert.ok(
    !out.some((n) => n.startsWith("tiny@")),
    `unexpected tiny variants: ${out.join(",")}`,
  );
});

test("SVG sources are ignored", async () => {
  const dir = await makeWorkspace();
  await writeFile(
    join(dir, "public/assets/images/icon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>`.repeat(2000),
  );
  const r = runScript(dir);
  assert.equal(r.status, 0, r.stderr);
  const out = await readdir(join(dir, "public/assets/images-optimized"));
  assert.ok(
    !out.some((n) => n.startsWith("icon")),
    `unexpected svg variants: ${out.join(",")}`,
  );
});

test("corrupt .cache.json triggers full regenerate", async () => {
  const dir = await makeWorkspace();
  const buf = await noisyPng(1500, 800);
  await writeFile(join(dir, "public/assets/images/recover.png"), buf);
  await mkdir(join(dir, "public/assets/images-optimized"), { recursive: true });
  await writeFile(
    join(dir, "public/assets/images-optimized/.cache.json"),
    "{not json",
  );
  const r = runScript(dir);
  assert.equal(r.status, 0, r.stderr);
  const out = await readdir(join(dir, "public/assets/images-optimized"));
  assert.ok(
    out.includes("recover@480w.avif"),
    `expected recover variants, got: ${out.join(",")}`,
  );
  // Cache file should be valid JSON after recovery
  const cacheRaw = await readFile(
    join(dir, "public/assets/images-optimized/.cache.json"),
    "utf8",
  );
  assert.doesNotThrow(() => JSON.parse(cacheRaw));
});

test("unsupported PNG-extension corrupt bytes warn + skip without failing build", async () => {
  const dir = await makeWorkspace();
  // Pretend-PNG: ext png but bytes are garbage > 50 KB.
  const garbage = Buffer.alloc(60 * 1024, 0x42);
  await writeFile(join(dir, "public/assets/images/broken.png"), garbage);
  const r = runScript(dir);
  // non-priority basename → must not fail the build.
  assert.equal(r.status, 0, r.stderr);
  const out = await readdir(join(dir, "public/assets/images-optimized"));
  assert.ok(
    !out.some((n) => n.startsWith("broken@")),
    `unexpected broken variants: ${out.join(",")}`,
  );
  assert.match(r.stdout + r.stderr, /WARN broken/);
});
