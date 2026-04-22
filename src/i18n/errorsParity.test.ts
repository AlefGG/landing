import { describe, it, expect } from "vitest";
import ru from "./locales/ru.json";
import kk from "./locales/kk.json";

function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flatten(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe("errors.* i18n parity", () => {
  const ruKeys = flatten((ru as Record<string, unknown>).errors as Record<string, unknown>, "errors").sort();
  const kkKeys = flatten((kk as Record<string, unknown>).errors as Record<string, unknown>, "errors").sort();

  it("kk has every ru errors.* key", () => {
    const missing = ruKeys.filter((k) => !kkKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("ru has every kk errors.* key (no stray kk-only keys)", () => {
    const extra = kkKeys.filter((k) => !ruKeys.includes(k));
    expect(extra).toEqual([]);
  });
});
