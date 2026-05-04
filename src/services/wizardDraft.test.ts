// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { z } from "zod";
import { saveDraft, loadDraft, clearDraft } from "./wizardDraft";

const SLUG = "event" as const;

describe("wizardDraft", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-28T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves and loads payload roundtrip", () => {
    saveDraft(SLUG, { name: "Alice", count: 2 });
    expect(loadDraft<{ name: string; count: number }>(SLUG)).toEqual({
      name: "Alice",
      count: 2,
    });
  });

  it("returns null for missing slug", () => {
    expect(loadDraft(SLUG)).toBeNull();
  });

  it("returns null for expired draft (>24h)", () => {
    saveDraft(SLUG, { name: "old" });
    vi.setSystemTime(new Date("2026-04-29T10:00:01Z"));
    expect(loadDraft(SLUG)).toBeNull();
  });

  it("returns non-null at 24h boundary minus 1ms", () => {
    saveDraft(SLUG, { name: "fresh" });
    vi.setSystemTime(new Date("2026-04-29T09:59:59.999Z"));
    expect(loadDraft<{ name: string }>(SLUG)).toEqual({ name: "fresh" });
  });

  it("returns null on corrupt JSON", () => {
    window.localStorage.setItem("biotoilets:wizardDraft:event", "{not json");
    expect(loadDraft(SLUG)).toBeNull();
  });

  it("returns null when envelope shape is wrong", () => {
    window.localStorage.setItem(
      "biotoilets:wizardDraft:event",
      JSON.stringify({ noSavedAt: true }),
    );
    expect(loadDraft(SLUG)).toBeNull();
  });

  it("clearDraft removes the entry", () => {
    saveDraft(SLUG, { x: 1 });
    clearDraft(SLUG);
    expect(loadDraft(SLUG)).toBeNull();
  });

  it("different slugs do not collide", () => {
    saveDraft("event", { x: 1 });
    saveDraft("emergency", { x: 2 });
    expect(loadDraft<{ x: number }>("event")).toEqual({ x: 1 });
    expect(loadDraft<{ x: number }>("emergency")).toEqual({ x: 2 });
  });

  it("save silently swallows storage errors (quota)", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota", "QuotaExceededError");
    });
    expect(() => saveDraft(SLUG, { x: 1 })).not.toThrow();
    setItem.mockRestore();
  });

  describe("FE-TS-003 schema validation", () => {
    const PayloadSchema = z.object({
      name: z.string(),
      count: z.number(),
    });

    it("returns parsed payload when schema matches", () => {
      saveDraft(SLUG, { name: "Alice", count: 2 });
      const out = loadDraft(SLUG, PayloadSchema);
      expect(out).toEqual({ name: "Alice", count: 2 });
    });

    it("returns null AND clears storage when payload fails the schema", () => {
      saveDraft(SLUG, { name: "Alice", count: "two" }); // count wrong type
      const out = loadDraft(SLUG, PayloadSchema);
      expect(out).toBeNull();
      // Cleared so the next mount won't loop on the corrupt payload.
      expect(window.localStorage.getItem("biotoilets:wizardDraft:event")).toBeNull();
    });

    it("returns null AND clears storage when envelope shape is wrong", () => {
      window.localStorage.setItem(
        "biotoilets:wizardDraft:event",
        JSON.stringify({ noSavedAt: true }),
      );
      const out = loadDraft(SLUG, PayloadSchema);
      expect(out).toBeNull();
      expect(window.localStorage.getItem("biotoilets:wizardDraft:event")).toBeNull();
    });
  });
});
