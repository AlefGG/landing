import { describe, it, expect } from "vitest";
import { ESLint } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(here, "../../eslint.config.js");

const eslint = new ESLint({ overrideConfigFile: configPath });

async function lint(src: string, ext = "tsx") {
  const results = await eslint.lintText(src, { filePath: `dummy.${ext}` });
  const r = results[0];
  if (!r) throw new Error("ESLint returned no result");
  return r.messages.filter((m) => m.ruleId === "no-restricted-syntax");
}

describe("FE-UX-004 no-restricted-syntax", () => {
  it("fires on string-literal hex in className", async () => {
    expect((await lint(`export default () => <div className="bg-[#abc123]" />`)).length).toBe(1);
  });
  it("fires on template-literal hex in className", async () => {
    expect((await lint("export default () => <div className={`bg-[#abc123] ${''}`} />")).length).toBe(1);
  });
  it("does not fire on token utility", async () => {
    expect((await lint(`export default () => <div className="bg-cta-main" />`)).length).toBe(0);
  });
  it("does not fire on hex outside className", async () => {
    expect((await lint(`const c = "#abc123"; export default () => <div title={c} />`)).length).toBe(0);
  });
  it("does not fire on hex inside style={{}}", async () => {
    expect((await lint(`export default () => <div style={{ color: "#abc123" }} />`)).length).toBe(0);
  });
});
