// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTimeSlots } from "./useTimeSlots";
import { __resetTimeSlotsCacheForTests } from "../services/timeSlotsService";

const SLUG = "biotoilets-pub";

beforeEach(() => {
  __resetTimeSlotsCacheForTests();
  vi.stubEnv("VITE_LANDING_COMPANY_SLUG", SLUG);
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("useTimeSlots", () => {
  it("populates slots on successful fetch", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "A", start_time: "08:00", end_time: "12:00", order: 1, is_active: true },
      ],
    });
    const { result } = renderHook(() => useTimeSlots());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.slots).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("F-016: retries once after a transient error before surfacing it", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("transient AbortError"));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Утро", start_time: "08:00", end_time: "12:00", order: 1, is_active: true },
        { id: 2, name: "День", start_time: "14:00", end_time: "17:00", order: 2, is_active: true },
      ],
    });
    const { result } = renderHook(() => useTimeSlots());
    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 2000,
    });
    expect(result.current.slots).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("F-016: surfaces the error if the retry also fails", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("first boom"));
    fetchMock.mockRejectedValueOnce(new Error("second boom"));
    const { result } = renderHook(() => useTimeSlots());
    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 2000,
    });
    expect(result.current.slots).toEqual([]);
    expect(result.current.error?.message).toBe("second boom");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("FE-DT-006: ignores resolved data after unmount (abort path)", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    let resolveFetch: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise((res) => {
        resolveFetch = res;
      }),
    );
    const { result, unmount } = renderHook(() => useTimeSlots());
    unmount();
    resolveFetch({
      ok: true,
      json: async () => [
        { id: 1, name: "X", start_time: "08:00", end_time: "12:00", order: 1, is_active: true },
      ],
    });
    await Promise.resolve();
    // No throw, no setState-on-unmounted warning. result is captured at last render.
    expect(result.current.loading).toBe(true);
  });
});
