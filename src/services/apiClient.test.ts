import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { configureApiClient, fetchJson, __resetApiClient } from "./apiClient";

const PUBLIC_PATHS = [
  "/orders/availability/calendar/?service_type=rental_event",
  "/catalog/cabin-types/?scenario=rental",
  "/catalog/sale/equipment/",
  "/catalog/sale/equipment/1/",
  "/public/time-slots/?company=default",
  "/public/service-packages/?company=default",
  "/public/zones/list/",
  "/public/pricing/preview/?service_type=rental_event",
];

describe("apiClient public-endpoint auth header", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    configureApiClient({
      baseUrl: "/api",
      getAccessToken: () => "expired.token.value",
      onRefresh: async () => null,
      onAuthError: () => {},
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    __resetApiClient();
  });

  for (const p of PUBLIC_PATHS) {
    it(`omits Authorization for public endpoint ${p}`, async () => {
      await fetchJson(p);
      expect(fetchSpy).toHaveBeenCalledOnce();
      const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
    });
  }

  it("includes Authorization for authenticated endpoints", async () => {
    await fetchJson("/orders/my/");
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer expired.token.value");
  });

  it("does not retry on 401 for public paths", async () => {
    const onAuthError = vi.fn();
    const onRefresh = vi.fn().mockResolvedValue("new.token");
    configureApiClient({
      baseUrl: "/api",
      getAccessToken: () => "expired.token.value",
      onRefresh,
      onAuthError,
    });
    fetchSpy.mockResolvedValueOnce(
      new Response("{}", {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(
      fetchJson("/orders/availability/calendar/?service_type=rental_event"),
    ).rejects.toThrow(); // ApiError with status 401, NOT AuthExpiredError
    expect(onRefresh).not.toHaveBeenCalled();
    expect(onAuthError).not.toHaveBeenCalled();
  });
});
