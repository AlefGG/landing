import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublicTimeSlots,
  __resetTimeSlotsCacheForTests,
  type TimeSlotDTO,
} from "./timeSlotsService";

const SLUG = "biotoilets-pub";

function mockSlot(name = "Утро"): TimeSlotDTO {
  return {
    id: 1,
    name,
    start_time: "08:00:00",
    end_time: "12:00:00",
    order: 1,
    is_active: true,
  };
}

beforeEach(() => {
  __resetTimeSlotsCacheForTests();
  vi.stubEnv("VITE_LANDING_COMPANY_SLUG", SLUG);
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetchPublicTimeSlots", () => {
  it("returns empty list and skips fetch when slug is empty", async () => {
    vi.stubEnv("VITE_LANDING_COMPANY_SLUG", "");
    const slots = await fetchPublicTimeSlots();
    expect(slots).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls /public/time-slots/ with slug and returns the array", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockSlot("A"), mockSlot("B")],
    });
    const slots = await fetchPublicTimeSlots();
    expect(slots).toHaveLength(2);
    const calledUrl = String(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0],
    );
    expect(calledUrl).toContain("/public/time-slots/");
    expect(calledUrl).toContain(`company=${SLUG}`);
  });

  it("dedups in-flight requests for the same slug", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    let resolveResp: (v: unknown) => void;
    const respPromise = new Promise<unknown>((r) => {
      resolveResp = r;
    });
    fetchMock.mockReturnValueOnce(respPromise);
    const a = fetchPublicTimeSlots();
    const b = fetchPublicTimeSlots();
    resolveResp!({ ok: true, json: async () => [mockSlot("X")] });
    const [fa, fb] = await Promise.all([a, b]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fa).toBe(fb);
  });

  it("clears cache entry on fetch error so retry works", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    await expect(fetchPublicTimeSlots()).rejects.toThrow("boom");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockSlot("R")],
    });
    const slots = await fetchPublicTimeSlots();
    expect(slots[0]!.name).toBe("R");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
