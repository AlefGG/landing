#!/usr/bin/env node
// Hard-fail bundle-size budget for the LCP route.
// Sums gzip size of every JS chunk loaded by index.html. Compares against
// BUDGET_GZ_KB (default 200, calibrated to post-FE-PF-001 split + 10%
// headroom). Over-budget exits 1 (CI fails). SOFT_WARN=1 reverts to the
// pre-Wave-2 warn-only mode for emergency overrides.
//
// Wave-2 hard-fail flip per strategy spec §4.4(3). FE-PF-001 Leaflet split
// landed in this PR; from now on, exceeding the budget breaks CI.
//
// Usage: node scripts/check-bundle-size.mjs

import { readFileSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const BUDGET_GZ_KB = Number(process.env.BUDGET_GZ_KB ?? 200);
const SOFT_WARN = process.env.SOFT_WARN === "1";

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
