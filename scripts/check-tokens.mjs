#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = path.join(root, "src/index.css");
const css = fs.readFileSync(cssPath, "utf8");

const themeMatch = css.match(/@theme\s*{([\s\S]*?)\n}/);
if (!themeMatch) {
  console.error("check:tokens: @theme block not found in src/index.css");
  process.exit(1);
}
const tokenNames = new Set(
  [...themeMatch[1].matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]),
);

// Prefixes the project owns (not in Tailwind 4's default palette).
// Suffixes seen with these prefixes MUST exist in @theme; everything
// else (neutral-*, blue-*, etc.) is left to Tailwind's default palette
// merge so we do not false-positive on `bg-neutral-100`, `text-blue-700`.
const ownedPrefixes = ["cta", "link", "status-error", "status-alert", "surface", "hero", "social", "toggle"];

const exts = new Set([".ts", ".tsx"]);
const skipDir = /(__tests__)/;
const skipFile = /\.test\.tsx?$/;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (skipDir.test(p)) continue;
      yield* walk(p);
    } else if (exts.has(path.extname(e.name)) && !skipFile.test(p)) {
      yield p;
    }
  }
}

const utilityPrefixes = ["bg", "text", "border", "from", "to", "via", "outline", "ring", "fill", "stroke",
  "border-t", "border-r", "border-b", "border-l", "border-x", "border-y"];
const utilRe = new RegExp(`\\b(?:${utilityPrefixes.join("|")})-([a-z][a-z0-9-]*)`, "g");
const carveOut = /^\[var\(/;

const reports = [];
for (const file of walk(path.join(root, "src"))) {
  const content = fs.readFileSync(file, "utf8");
  let m;
  while ((m = utilRe.exec(content)) !== null) {
    const suffix = m[1];
    // Only audit suffixes that start with an owned prefix.
    const owned = ownedPrefixes.find((p) => suffix === p || suffix.startsWith(p + "-"));
    if (!owned) continue;
    const fullMatch = content.slice(m.index, m.index + 200);
    if (carveOut.test(fullMatch.slice(m[0].length))) continue;
    if (!tokenNames.has(suffix)) {
      reports.push(`${path.relative(root, file)}: unknown token suffix "${suffix}" in "${m[0]}"`);
    }
  }
}

if (reports.length > 0) {
  for (const r of reports) console.error(r);
  console.error(`check:tokens: ${reports.length} unknown token reference(s).`);
  process.exit(1);
}
console.log("check:tokens: OK");
