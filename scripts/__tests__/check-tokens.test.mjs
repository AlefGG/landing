import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

test("fails on unknown owned-prefix token suffix", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-tokens-"));
  fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, "src/index.css"),
    "@theme {\n  --color-cta-main: #3E7A01;\n}\n",
  );
  fs.writeFileSync(
    path.join(tmp, "src/Bad.tsx"),
    'export default () => <div className="bg-cta-bluuuue" />;\n',
  );
  fs.mkdirSync(path.join(tmp, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(here, "..", "check-tokens.mjs"), path.join(tmp, "scripts/check-tokens.mjs"));
  const result = spawnSync("node", ["scripts/check-tokens.mjs"], { cwd: tmp, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cta-bluuuue/);
});

test("passes on Tailwind default palette suffix", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-tokens-"));
  fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, "src/index.css"),
    "@theme {\n  --color-cta-main: #3E7A01;\n}\n",
  );
  fs.writeFileSync(
    path.join(tmp, "src/Good.tsx"),
    'export default () => <div className="bg-blue-500 text-neutral-100" />;\n',
  );
  fs.mkdirSync(path.join(tmp, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(here, "..", "check-tokens.mjs"), path.join(tmp, "scripts/check-tokens.mjs"));
  const result = spawnSync("node", ["scripts/check-tokens.mjs"], { cwd: tmp, encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /OK/);
});
