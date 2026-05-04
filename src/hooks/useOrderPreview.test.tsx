// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOrderPreview } from "./useOrderPreview";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useOrderPreview", () => {
  it("FE-DT-005: forwards AbortSignal to fetcher when payload populated", async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetcher = vi.fn(async (_p: { x: number }, opts?: { signal?: AbortSignal }) => {
      capturedSignal = opts?.signal;
      return { total: "100" };
    });
    renderHook(() => useOrderPreview({ x: 1 }, fetcher));
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal!.aborted).toBe(false);
  });

  it("FE-DT-005: aborts in-flight previous request on payload change", async () => {
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn(async (_p: { x: number }, opts?: { signal?: AbortSignal }) => {
      if (opts?.signal) signals.push(opts.signal);
      return new Promise<{ total: string }>(() => {
        // never resolves
      });
    });
    const { rerender } = renderHook(
      ({ payload }: { payload: { x: number } }) => useOrderPreview(payload, fetcher),
      { initialProps: { payload: { x: 1 } } },
    );
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    rerender({ payload: { x: 2 } });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(signals.length).toBeGreaterThanOrEqual(2);
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);
  });

  it("FE-DT-005: aborts in-flight request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetcher = vi.fn(async (_p: { x: number }, opts?: { signal?: AbortSignal }) => {
      capturedSignal = opts?.signal;
      return new Promise<{ total: string }>(() => {});
    });
    const { unmount } = renderHook(() => useOrderPreview({ x: 1 }, fetcher));
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(capturedSignal!.aborted).toBe(false);
    unmount();
    expect(capturedSignal!.aborted).toBe(true);
  });
});
