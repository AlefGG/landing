import { describe, it, expect, beforeEach, vi } from "vitest";

describe("i18n resolveInitialLang", () => {
  beforeEach(() => {
    window.localStorage.clear();
    history.replaceState(null, "", "/");
  });

  it("prefers ?lang=kk query string over storage", async () => {
    history.replaceState(null, "", "/?lang=kk");
    window.localStorage.setItem("lang", "ru");
    vi.resetModules();
    const { default: i18n } = await import("./index");
    expect(i18n.language).toBe("kk");
  });

  it("falls back to localStorage when no query string", async () => {
    history.replaceState(null, "", "/");
    window.localStorage.setItem("lang", "kk");
    vi.resetModules();
    const { default: i18n } = await import("./index");
    expect(i18n.language).toBe("kk");
  });

  it("defaults to ru when neither query nor storage", async () => {
    history.replaceState(null, "", "/");
    vi.resetModules();
    const { default: i18n } = await import("./index");
    expect(i18n.language).toBe("ru");
  });
});
