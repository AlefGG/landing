import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchJsonMock = vi.fn();
vi.mock("./apiClient", () => ({
  fetchJson: (...args: unknown[]) => fetchJsonMock(...args),
}));

import {
  fetchPublicFixedDestinations,
  __resetFixedDestinationsCacheForTests,
  type FixedDestinationDTO,
} from "./fixedDestinationsService";

function mockDest(name = "Алматы–Кольсай"): FixedDestinationDTO {
  return {
    id: 1,
    name,
    fixed_price: "100000.00",
    max_cabins: 6,
    multi_day_surcharge: "50000.00",
    is_active: true,
  };
}

beforeEach(() => {
  __resetFixedDestinationsCacheForTests();
  fetchJsonMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchPublicFixedDestinations", () => {
  it("calls the authenticated /catalog/fixed-destinations/ endpoint", async () => {
    fetchJsonMock.mockResolvedValueOnce([mockDest("A"), mockDest("B")]);
    const list = await fetchPublicFixedDestinations();
    expect(list).toHaveLength(2);
    expect(fetchJsonMock).toHaveBeenCalledWith("/catalog/fixed-destinations/");
  });

  it("dedups in-flight requests", async () => {
    let resolveResp: (v: unknown) => void;
    const respPromise = new Promise<unknown>((r) => {
      resolveResp = r;
    });
    fetchJsonMock.mockReturnValueOnce(respPromise);
    const a = fetchPublicFixedDestinations();
    const b = fetchPublicFixedDestinations();
    resolveResp!([mockDest("X")]);
    const [fa, fb] = await Promise.all([a, b]);
    expect(fetchJsonMock).toHaveBeenCalledTimes(1);
    expect(fa).toBe(fb);
  });

  it("clears cache entry on error so a retry refetches", async () => {
    fetchJsonMock.mockRejectedValueOnce(new Error("boom"));
    await expect(fetchPublicFixedDestinations()).rejects.toThrow("boom");
    fetchJsonMock.mockResolvedValueOnce([mockDest("R")]);
    const list = await fetchPublicFixedDestinations();
    expect(list[0]!.name).toBe("R");
    expect(fetchJsonMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT cache empty results — next caller refetches", async () => {
    fetchJsonMock.mockResolvedValueOnce([]);
    const first = await fetchPublicFixedDestinations();
    expect(first).toEqual([]);
    fetchJsonMock.mockResolvedValueOnce([mockDest("Y")]);
    const second = await fetchPublicFixedDestinations();
    expect(second).toHaveLength(1);
    expect(fetchJsonMock).toHaveBeenCalledTimes(2);
  });

  it("rejects with AbortError when the signal aborts before resolution", async () => {
    let resolveResp: (v: unknown) => void;
    fetchJsonMock.mockReturnValueOnce(
      new Promise<unknown>((r) => {
        resolveResp = r;
      }),
    );
    const ctrl = new AbortController();
    const p = fetchPublicFixedDestinations(ctrl.signal);
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
    // resolve the shared promise so it doesn't leak as an unhandled rejection
    resolveResp!([mockDest("Z")]);
  });
});
