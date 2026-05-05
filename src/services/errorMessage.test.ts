import { describe, it, expect } from "vitest";
import { errorMessage, type NormalizedError } from "./errors";

type Fixture = Record<string, string>;
function makeT(fixture: Fixture) {
  return ((key: string, opts?: { defaultValue?: string }) => {
    if (key in fixture) return fixture[key];
    return opts?.defaultValue ?? key;
  }) as unknown as Parameters<typeof errorMessage>[1];
}

const err: NormalizedError = { kind: "server", status: 500 };

describe("errorMessage lookup precedence", () => {
  it("prefers override.kind over override.variant", () => {
    const t = makeT({
      "errors.orderCreate.server": "CONTEXT-KIND",
      "errors.orderCreate.short": "CONTEXT-VARIANT",
      "errors.server.short": "BASE-KIND",
    });
    expect(errorMessage(err, t, "errors.orderCreate", "short")).toBe("CONTEXT-KIND");
  });

  it("falls back to override.variant when override.kind missing", () => {
    const t = makeT({
      "errors.orderCreate.short": "CONTEXT-VARIANT",
      "errors.server.short": "BASE-KIND",
    });
    expect(errorMessage(err, t, "errors.orderCreate", "short")).toBe("CONTEXT-VARIANT");
  });

  it("falls back to errors.<kind>.<variant>", () => {
    const t = makeT({
      "errors.server.short": "BASE-KIND",
    });
    expect(errorMessage(err, t, "errors.orderCreate", "short")).toBe("BASE-KIND");
  });

  it("final fallback to errors.unknown.<variant>", () => {
    const t = makeT({
      "errors.unknown.short": "FALLBACK",
    });
    expect(errorMessage(err, t, undefined, "short")).toBe("FALLBACK");
  });

  it("default variant is short", () => {
    const t = makeT({ "errors.server.short": "S" });
    expect(errorMessage(err, t)).toBe("S");
  });

  it("title variant routes independently", () => {
    const t = makeT({
      "errors.server.title": "T",
      "errors.server.short": "S",
    });
    expect(errorMessage(err, t, undefined, "title")).toBe("T");
  });

  it("validation without fieldErrors prefers backend detail over override", () => {
    const validationErr: NormalizedError = {
      kind: "validation",
      status: 400,
      detail: 'До мероприятия менее 24 часов. Выберите тип "ЧС" (emergency).',
    };
    const t = makeT({
      "errors.orderCreate.validation": "Проверьте заполненные поля выше",
      "errors.validation.short": "Проверьте поля",
    });
    expect(errorMessage(validationErr, t, "errors.orderCreate", "short")).toBe(
      'До мероприятия менее 24 часов. Выберите тип "ЧС" (emergency).',
    );
  });

  it("validation WITH fieldErrors keeps override (detail is supplementary)", () => {
    const validationErr: NormalizedError = {
      kind: "validation",
      status: 400,
      detail: "ignored when fields are present",
      fieldErrors: { items: "too few" },
    };
    const t = makeT({
      "errors.orderCreate.validation": "Проверьте заполненные поля выше",
    });
    expect(errorMessage(validationErr, t, "errors.orderCreate", "short")).toBe(
      "Проверьте заполненные поля выше",
    );
  });
});
