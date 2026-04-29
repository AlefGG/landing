#!/usr/bin/env node
// Soft-warn bundle-size budget for the LCP route.
// Sums gzip size of every JS chunk loaded by index.html. Compares against
// BUDGET_GZ_KB (default 250). Over-budget logs WARN and exits 0 unless
// SOFT_WARN=0, in which case exits 1.
//
// Usage: node scripts/check-bundle-size.mjs

import { readFileSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const BUDGET_GZ_KB = Number(process.env.BUDGET_GZ_KB ?? 250);
const SOFT_WARN = process.env.SOFT_WARN !== "0";

function gzKb(filePath) {
  const buf = readFileSync(filePath);
  return gzipSync(buf).byteLength / 1024;
}

function findEntryChunks() {
  const html = readFileSync(resolve(DIST, "index.html"), "utf8");
  const matches = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|mjs))"/g)];
  return matches.map((m) => resolve(DIST, m[1].replace(/^\//, "")));
}

function main() {
  let chunks;
  try {
    chunks = findEntryChunks();
  } catch (err) {
    console.error(`size:check: failed to read dist/index.html — did you run \`npm run build\`?`);
    console.error(err.message);
    process.exit(1);
  }

  if (chunks.length === 0) {
    console.error("size:check: no JS assets found in dist/index.html — abort.");
    process.exit(1);
  }

  let totalKb = 0;
  for (const chunk of chunks) {
    const sizeKb = gzKb(chunk);
    totalKb += sizeKb;
    console.log(`  ${relative(DIST, chunk)}: ${sizeKb.toFixed(1)} KB gz`);
  }
  console.log(`Total LCP-route gz size: ${totalKb.toFixed(1)} KB (budget: ${BUDGET_GZ_KB} KB)`);

  if (totalKb > BUDGET_GZ_KB) {
    const verb = SOFT_WARN ? "WARN" : "FAIL";
    console.error(`size:check: ${verb} — over budget by ${(totalKb - BUDGET_GZ_KB).toFixed(1)} KB.`);
    process.exit(SOFT_WARN ? 0 : 1);
  } else {
    console.log("size:check: OK — under budget.");
    process.exit(0);
  }
}

main();
