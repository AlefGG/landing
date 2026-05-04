import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWizardDraft } from "../useWizardDraft";

const SLUG = "event" as const;
const STORAGE_KEY = `biotoilets:wizardDraft:${SLUG}`;

type Defaults = { count: number; label: string };
const DEFAULTS: Defaults = { count: 0, label: "" };

describe("useWizardDraft", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("hydrates from initialDefaults when no stored draft", () => {
    const { result } = renderHook(() => useWizardDraft<Defaults>(SLUG, DEFAULTS));
    expect(result.current.draft).toEqual(DEFAULTS);
  });

  it("hydrates from stored draft when present", () => {
    const stored: Defaults = { count: 3, label: "stored" };
    const envelope = { savedAt: Date.now(), payload: stored };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));

    const { result } = renderHook(() => useWizardDraft<Defaults>(SLUG, DEFAULTS));
    expect(result.current.draft).toEqual(stored);
  });

  it("falls back to initialDefaults when stored draft is corrupt JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not valid json");

    const { result } = renderHook(() => useWizardDraft<Defaults>(SLUG, DEFAULTS));
    expect(result.current.draft).toEqual(DEFAULTS);
  });

  it("debounces save: 0 writes during burst, 1 write with latest value after window", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useWizardDraft<Defaults>(SLUG, DEFAULTS));

    act(() => {
      result.current.setDraft({ count: 1, label: "a" });
    });
    act(() => {
      result.current.setDraft({ count: 2, label: "b" });
    });
    act(() => {
      result.current.setDraft({ count: 3, label: "c" });
    });

    // No save yet — still inside debounce window
    expect(setItemSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Exactly one save with the latest value
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    const [key, raw] = setItemSpy.mock.calls[0]!;
    expect(key).toBe(STORAGE_KEY);
    const parsed = JSON.parse(raw as string);
    expect(parsed.payload).toEqual({ count: 3, label: "c" });
  });

  it("cancels pending save when unmounted before debounce fires", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const { result, unmount } = renderHook(() => useWizardDraft<Defaults>(SLUG, DEFAULTS));

    act(() => {
      result.current.setDraft({ count: 9, label: "x" });
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it("clearDraft removes the stored entry", () => {
    const stored: Defaults = { count: 5, label: "y" };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), payload: stored }),
    );

    const { result } = renderHook(() => useWizardDraft<Defaults>(SLUG, DEFAULTS));

    act(() => {
      result.current.clearDraft();
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
