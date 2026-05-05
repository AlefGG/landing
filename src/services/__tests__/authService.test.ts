import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  refresh,
  logout,
  verifyOtp,
} from "../authService";
import { getCsrfToken } from "../csrf";
import { ApiError } from "../apiClient";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function setCookie(value: string): void {
  // jsdom: write directly into document.cookie.
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => value,
  });
}

describe("authService — cookie-mode (FE-SEC-001 step 2)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let localStorageSetItem: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setCookie("");
    localStorageSetItem = vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("refresh sends credentials + CSRF + empty body", async () => {
    setCookie("csrftoken=ABC");
    fetchMock.mockResolvedValue(jsonResponse({ access: "A2" }));

    await refresh();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.body).toBe("{}");
    const headers = new Headers(init.headers);
    expect(headers.get("X-CSRFToken")).toBe("ABC");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("refresh resolves to {access} only (no refresh field)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ access: "A2", refresh: "ignored" }),
    );

    const result = await refresh();
    expect(result).toEqual({ access: "A2" });
    expect((result as { refresh?: string }).refresh).toBeUndefined();
  });

  it("refresh 401 throws ApiError", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    await expect(refresh()).rejects.toBeInstanceOf(ApiError);
    await expect(refresh()).rejects.toMatchObject({ status: 401 });
  });

  it("refresh 403 (CSRF) throws ApiError", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));
    await expect(refresh()).rejects.toMatchObject({ status: 403 });
  });

  it("logout sends credentials + CSRF + empty body + keepalive", async () => {
    setCookie("csrftoken=ZZZ");
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await logout();

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.body).toBe("{}");
    // keepalive lets the request survive Header.handleLogout's hard-redirect
    // (window.location.assign) — without it the browser aborts the in-flight
    // fetch and the backend never clears the refresh cookie.
    expect(init.keepalive).toBe(true);
    const headers = new Headers(init.headers);
    expect(headers.get("X-CSRFToken")).toBe("ZZZ");
  });

  it("logout swallows network error (best-effort)", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(logout()).resolves.toBeUndefined();
  });

  it("verifyOtp sends credentials: 'include'", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access: "A1",
        user: {
          id: 1,
          phone: "+77001234567",
          role: "client",
          language: "ru",
          company: null,
          first_name: "T",
          email: "",
        },
      }),
    );
    await verifyOtp("+77001234567", "1234");

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.credentials).toBe("include");
  });

  it("verifyOtp ignores `refresh` field in body, no localStorage write", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access: "A1",
        refresh: "R1",
        user: {
          id: 1,
          phone: "+77001234567",
          role: "client",
          language: "ru",
          company: null,
          first_name: "T",
          email: "",
        },
      }),
    );
    const result = await verifyOtp("+77001234567", "1234");

    expect(result.access).toBe("A1");
    expect(result.user.id).toBe(1);
    expect((result as { refresh?: string }).refresh).toBeUndefined();
    // No localStorage writes from verifyOtp itself.
    expect(localStorageSetItem).not.toHaveBeenCalled();
  });

  it("getCsrfToken reads cookie", () => {
    setCookie("csrftoken=abc");
    expect(getCsrfToken()).toBe("abc");
  });

  it("getCsrfToken returns empty string when cookie missing", () => {
    setCookie("");
    expect(getCsrfToken()).toBe("");
  });

  it("getCsrfToken decodes URI-encoded values", () => {
    setCookie("csrftoken=abc%3Ddef");
    expect(getCsrfToken()).toBe("abc=def");
  });
});
