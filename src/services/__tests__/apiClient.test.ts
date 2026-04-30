import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createApiClient,
  configureApiClient,
  fetchJson,
  getApiClient,
  __resetApiClient,
  AuthExpiredError,
} from "../apiClient";

type Resolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

function withResolvers<T>(): Resolvers<T> {
  let resolve!: Resolvers<T>["resolve"];
  let reject!: Resolvers<T>["reject"];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unauthorized(): Response {
  return new Response(null, { status: 401 });
}

describe("apiClient factory + mutex", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    __resetApiClient();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("two factories don't share mutex", async () => {
    const onRefresh1 = vi.fn(async () => "A2");
    const onRefresh2 = vi.fn(async () => "B2");
    const c1 = createApiClient({
      getAccessToken: () => "A1",
      onRefresh: onRefresh1,
      onAuthError: () => {},
    });
    const c2 = createApiClient({
      getAccessToken: () => "B1",
      onRefresh: onRefresh2,
      onAuthError: () => {},
    });

    const seen = new Map<string, number>();
    fetchMock.mockImplementation(async (input: RequestInfo) => {
      const key = typeof input === "string" ? input : input.url;
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      if (count === 1) return unauthorized();
      return jsonResponse({});
    });

    await Promise.all([c1.request("/x"), c2.request("/y")]);

    expect(onRefresh1).toHaveBeenCalledTimes(1);
    expect(onRefresh2).toHaveBeenCalledTimes(1);
  });

  it("401 → refresh → retry happy path", async () => {
    const onRefresh = vi.fn(async () => "A2");
    const client = createApiClient({
      getAccessToken: () => "A1",
      onRefresh,
      onAuthError: () => {},
    });
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await client.request<{ ok: boolean }>("/x");

    expect(result).toEqual({ ok: true });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("mutex: parallel 401 → single refresh", async () => {
    const refreshGate = withResolvers<string>();
    const onRefresh = vi.fn(async () => refreshGate.promise);
    const client = createApiClient({
      getAccessToken: () => "A1",
      onRefresh,
      onAuthError: () => {},
    });

    let n = 0;
    fetchMock.mockImplementation(async () => {
      n += 1;
      // First 3 calls (one per request) → 401; next 3 (retries) → 200.
      if (n <= 3) return unauthorized();
      return jsonResponse({ ok: true, n });
    });

    const reqs = Promise.all([
      client.request("/a"),
      client.request("/b"),
      client.request("/c"),
    ]);

    // Wait for the three 401s to land + reach refreshOnce. Microtasks flush
    // when we await any settled promise.
    await Promise.resolve();
    await Promise.resolve();

    refreshGate.resolve("A2");
    const results = await reqs;

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(3);
    // 3 first-pass 401s + 3 retries = 6 fetch calls.
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("refresh resolves null → all pending fail (realistic path)", async () => {
    const onRefresh = vi.fn(async () => null);
    const onAuthError = vi.fn();
    const client = createApiClient({
      getAccessToken: () => "A1",
      onRefresh,
      onAuthError,
    });
    fetchMock.mockResolvedValue(unauthorized());

    const r1 = client.request("/a");
    const r2 = client.request("/b");

    await expect(r1).rejects.toBeInstanceOf(AuthExpiredError);
    await expect(r2).rejects.toBeInstanceOf(AuthExpiredError);
    expect(onAuthError).toHaveBeenCalledTimes(2);
    // No retry — only the first-pass 401s fired.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refresh rejects → all pending fail (defence-in-depth)", async () => {
    const onRefresh = vi.fn(async () => {
      throw new Error("boom");
    });
    const onAuthError = vi.fn();
    const client = createApiClient({
      getAccessToken: () => "A1",
      onRefresh,
      onAuthError,
    });
    fetchMock.mockResolvedValue(unauthorized());

    const r1 = client.request("/a");
    const r2 = client.request("/b");

    await expect(r1).rejects.toBeInstanceOf(AuthExpiredError);
    await expect(r2).rejects.toBeInstanceOf(AuthExpiredError);
    expect(onAuthError).toHaveBeenCalledTimes(2);
  });

  it("second 401 after retry → onAuthError + AuthExpiredError", async () => {
    const onRefresh = vi.fn(async () => "A2");
    const onAuthError = vi.fn();
    const client = createApiClient({
      getAccessToken: () => "A1",
      onRefresh,
      onAuthError,
    });
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(unauthorized());

    await expect(client.request("/x")).rejects.toBeInstanceOf(AuthExpiredError);
    expect(onAuthError).toHaveBeenCalledTimes(1);
  });

  it("reconfigure swaps client", async () => {
    configureApiClient({
      getAccessToken: () => "A1",
      onRefresh: async () => null,
      onAuthError: () => {},
    });
    fetchMock.mockResolvedValue(jsonResponse({ ok: 1 }));

    await fetchJson("/first");
    const firstHeaders = new Headers(fetchMock.mock.calls[0]![1]!.headers);
    expect(firstHeaders.get("Authorization")).toBe("Bearer A1");

    configureApiClient({
      getAccessToken: () => "B1",
      onRefresh: async () => null,
      onAuthError: () => {},
    });
    fetchMock.mockResolvedValue(jsonResponse({ ok: 2 }));

    await fetchJson("/second");
    const secondHeaders = new Headers(fetchMock.mock.calls[1]![1]!.headers);
    expect(secondHeaders.get("Authorization")).toBe("Bearer B1");
  });

  it("getApiClient() returns current slot", async () => {
    configureApiClient({
      getAccessToken: () => "A1",
      onRefresh: async () => null,
      onAuthError: () => {},
    });
    const before = getApiClient();
    configureApiClient({
      getAccessToken: () => "B1",
      onRefresh: async () => null,
      onAuthError: () => {},
    });
    const after = getApiClient();

    fetchMock.mockResolvedValue(jsonResponse({}));
    await after.request("/x");
    const headers = new Headers(fetchMock.mock.calls[0]![1]!.headers);
    expect(headers.get("Authorization")).toBe("Bearer B1");

    // The two refs are different ApiClient instances (slot replaced).
    expect(before).not.toBe(after);
  });

  it("__resetApiClient between tests yields default unauth client", async () => {
    configureApiClient({
      getAccessToken: () => "A1",
      onRefresh: async () => null,
      onAuthError: () => {},
    });
    __resetApiClient();
    fetchMock.mockResolvedValue(jsonResponse({}));
    await fetchJson("/x");
    const headers = new Headers(fetchMock.mock.calls[0]![1]!.headers);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("macrotask-deferred clear: next macrotask request triggers a fresh refresh", async () => {
    vi.useFakeTimers();
    const onRefresh = vi.fn(async () => "A2");
    const client = createApiClient({
      getAccessToken: () => "A1",
      onRefresh,
      onAuthError: () => {},
    });
    fetchMock
      // first request: 401 then 200
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(jsonResponse({}))
      // second request (next macrotask): 401 then 200
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(jsonResponse({}));

    await client.request("/first");
    // Flush the setTimeout(0) clearing the slot.
    await vi.advanceTimersByTimeAsync(1);
    await client.request("/second");

    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it("requestBlob shares the same 401 → refresh → retry pipeline", async () => {
    const onRefresh = vi.fn(async () => "A2");
    const client = createApiClient({
      getAccessToken: () => "A1",
      onRefresh,
      onAuthError: () => {},
    });
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(new Response("xyz", { status: 200 }));

    const blob = await client.requestBlob("/img");
    // jsdom + node Blob types may not be strictly === — verify shape instead.
    expect(blob.size).toBe(3);
    expect(typeof blob.arrayBuffer).toBe("function");
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
