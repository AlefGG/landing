import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublicZones,
  __resetZonesCacheForTests,
  type ZonesFeatureCollection,
} from "./zonesService";

const SLUG = "biotoilets-pub";

function mockFc(name = "Z1"): ZonesFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: { id: 1, name, price: "1000", priority: 0 },
    }],
  };
}

beforeEach(() => {
  __resetZonesCacheForTests();
  vi.stubEnv("VITE_LANDING_COMPANY_SLUG", SLUG);
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetchPublicZones", () => {
  it("returns empty FC and skips fetch when slug is empty", async () => {
    vi.stubEnv("VITE_LANDING_COMPANY_SLUG", "");
    const fc = await fetchPublicZones("rental_event");
    expect(fc.features).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls /api/public/zones/ with the right query and returns the FC", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFc(),
    });
    const fc = await fetchPublicZones("rental_event");
    expect(fc.features).toHaveLength(1);
    const calledUrl = String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]);
    expect(calledUrl).toContain("/public/zones/");
    expect(calledUrl).toContain(`company=${SLUG}`);
    expect(calledUrl).toContain("service_type=rental_event");
  });

  it("dedups in-flight requests for the same (slug, serviceType)", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    let resolveResp: (v: unknown) => void;
    const respPromise = new Promise<unknown>((r) => {
      resolveResp = r;
    });
    fetchMock.mockReturnValueOnce(respPromise);
    const a = fetchPublicZones("rental_event");
    const b = fetchPublicZones("rental_event");
    resolveResp!({ ok: true, json: async () => mockFc("X") });
    const [fa, fb] = await Promise.all([a, b]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fa).toBe(fb);
  });

  it("clears cache entry on fetch error so a retry works", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    await expect(fetchPublicZones("sale")).rejects.toThrow("boom");
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockFc("R") });
    const fc = await fetchPublicZones("sale");
    expect(fc.features[0]!.properties.name).toBe("R");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
