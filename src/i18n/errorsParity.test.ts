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

// CLDR plural-bucket variants — RU has _few/_many; KK has _other.
// Listed explicitly so accidental drift is still caught (anything else
// under one of these bases must still be present in both files).
const PLURAL_EXEMPT = new Set<string>([
  // RU-only _few/_many variants:
  "wizard.construction.monthsValue_few",
  "wizard.construction.monthsValue_many",
  "wizard.rental.cabinSelector.totalUnit_few",
  "wizard.rental.cabinSelector.totalUnit_many",
  "wizard.service.package.frequencyLabel_few",
  "wizard.service.package.frequencyLabel_many",
  "wizard.service.step3Crew_few",
  "wizard.service.step3Crew_many",
  "wizard.service.step3Machine_few",
  "wizard.service.step3Machine_many",
  "wizard.service.step4DurationWeeksUnit_few",
  "wizard.service.step4DurationWeeksUnit_many",
  // KK-only _other variants (RU uses _few/_many instead):
  "wizard.rental.cabinSelector.totalUnit_other",
  "wizard.service.package.frequencyLabel_other",
  "wizard.service.step3Crew_other",
  "wizard.service.step3Machine_other",
  "wizard.service.step4DurationWeeksUnit_other",
]);

describe("ru/kk i18n parity (whole-namespace)", () => {
  const ruKeys = new Set(flatten(ru as Record<string, unknown>));
  const kkKeys = new Set(flatten(kk as Record<string, unknown>));

  it("ru and kk are key-set equal (modulo CLDR plural variants)", () => {
    const ruOnly = [...ruKeys].filter(
      (k) => !kkKeys.has(k) && !PLURAL_EXEMPT.has(k),
    );
    const kkOnly = [...kkKeys].filter(
      (k) => !ruKeys.has(k) && !PLURAL_EXEMPT.has(k),
    );
    expect({ ruOnly, kkOnly }).toEqual({ ruOnly: [], kkOnly: [] });
  });
});

describe("errors.* i18n parity", () => {
  const ruErrorsKeys = flatten(
    (ru as Record<string, unknown>).errors as Record<string, unknown>,
    "errors",
  ).sort();
  const kkErrorsKeys = flatten(
    (kk as Record<string, unknown>).errors as Record<string, unknown>,
    "errors",
  ).sort();

  it("kk has every ru errors.* key", () => {
    const missing = ruErrorsKeys.filter((k) => !kkErrorsKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("ru has every kk errors.* key (no stray kk-only keys)", () => {
    const extra = kkErrorsKeys.filter((k) => !ruErrorsKeys.includes(k));
    expect(extra).toEqual([]);
  });
});
