import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublicServicePackages,
  __resetServicePackagesCacheForTests,
  type ServicePackageDTO,
} from "./servicePackagesService";

const SLUG = "biotoilets-pub";

function mockPackage(name = "Weekly", visits = 1): ServicePackageDTO {
  return { id: visits, name, visits_per_week: visits, is_active: true };
}

beforeEach(() => {
  __resetServicePackagesCacheForTests();
  vi.stubEnv("VITE_LANDING_COMPANY_SLUG", SLUG);
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetchPublicServicePackages", () => {
  it("returns empty list and skips fetch when slug is empty", async () => {
    vi.stubEnv("VITE_LANDING_COMPANY_SLUG", "");
    const list = await fetchPublicServicePackages();
    expect(list).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls /public/service-packages/ with slug and returns the array", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockPackage("A", 1), mockPackage("B", 2)],
    });
    const list = await fetchPublicServicePackages();
    expect(list).toHaveLength(2);
    const calledUrl = String(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0],
    );
    expect(calledUrl).toContain("/public/service-packages/");
    expect(calledUrl).toContain(`company=${SLUG}`);
  });

  it("dedups in-flight requests for the same slug", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    let resolveResp: (v: unknown) => void;
    const respPromise = new Promise<unknown>((r) => {
      resolveResp = r;
    });
    fetchMock.mockReturnValueOnce(respPromise);
    const a = fetchPublicServicePackages();
    const b = fetchPublicServicePackages();
    resolveResp!({ ok: true, json: async () => [mockPackage("X", 1)] });
    const [fa, fb] = await Promise.all([a, b]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fa).toBe(fb);
  });

  it("clears cache entry on fetch error so retry works", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    await expect(fetchPublicServicePackages()).rejects.toThrow("boom");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockPackage("R", 3)],
    });
    const list = await fetchPublicServicePackages();
    expect(list[0]!.name).toBe("R");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
