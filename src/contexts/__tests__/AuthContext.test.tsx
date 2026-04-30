import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../AuthContext";
import * as authService from "../../services/authService";
import {
  __resetApiClient,
  AuthExpiredError,
  fetchJson,
} from "../../services/apiClient";

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

function unauthorized(): Response {
  return new Response(null, { status: 401 });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const FAKE_USER: authService.AuthUser = {
  id: 1,
  phone: "+77001234567",
  role: "client",
  language: "ru",
  company: null,
  first_name: "T",
  email: "",
};

function Capture({
  onReady,
}: {
  onReady: (auth: ReturnType<typeof useAuth>) => void;
}) {
  const auth = useAuth();
  useEffect(() => {
    onReady(auth);
  });
  return <div data-testid="status">{auth.status}</div>;
}

describe("AuthContext — cookie-mode (FE-SEC-001 step 2)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    __resetApiClient();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    __resetApiClient();
  });

  it("bootstrap with valid cookie → authenticated; no localStorage refresh write", async () => {
    const refreshSpy = vi
      .spyOn(authService, "refresh")
      .mockResolvedValue({ access: "A1" });
    vi.spyOn(authService, "fetchMe").mockResolvedValue(FAKE_USER);
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    const { findByTestId } = render(
      <MemoryRouter>
        <AuthProvider>
          <Capture onReady={() => {}} />
        </AuthProvider>
      </MemoryRouter>,
    );

    const status = await findByTestId("status");
    await waitFor(() => expect(status.textContent).toBe("authenticated"));
    expect(refreshSpy).toHaveBeenCalledWith();
    // No "auth.refresh" write — refresh lives in HttpOnly cookie.
    const refreshWrites = setItemSpy.mock.calls.filter(
      ([k]) => k === "auth.refresh",
    );
    expect(refreshWrites).toHaveLength(0);
  });

  it("bootstrap without cookie → anonymous", async () => {
    vi.spyOn(authService, "refresh").mockRejectedValue(new Error("401"));

    const { findByTestId } = render(
      <MemoryRouter>
        <AuthProvider>
          <Capture onReady={() => {}} />
        </AuthProvider>
      </MemoryRouter>,
    );

    const status = await findByTestId("status");
    await waitFor(() => expect(status.textContent).toBe("anonymous"));
  });

  it("legacy localStorage purge on first mount", async () => {
    localStorage.setItem("auth.refresh", "stale");
    localStorage.setItem("auth.access", "stale2");
    vi.spyOn(authService, "refresh").mockRejectedValue(new Error("401"));

    render(
      <MemoryRouter>
        <AuthProvider>
          <Capture onReady={() => {}} />
        </AuthProvider>
      </MemoryRouter>,
    );

    // Bootstrap effect runs the purge synchronously before the async IIFE.
    await waitFor(() => {
      expect(localStorage.getItem("auth.refresh")).toBeNull();
      expect(localStorage.getItem("auth.access")).toBeNull();
    });
  });

  it("login no longer writes auth.refresh to localStorage", async () => {
    vi.spyOn(authService, "refresh").mockRejectedValue(new Error("401"));
    vi.spyOn(authService, "verifyOtp").mockResolvedValue({
      access: "A1",
      user: FAKE_USER,
    });
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    let captured: ReturnType<typeof useAuth> | null = null;
    render(
      <MemoryRouter>
        <AuthProvider>
          <Capture onReady={(a) => (captured = a)} />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(captured).not.toBeNull());

    await act(async () => {
      await captured!.login("+77001234567", "1234");
    });

    expect(captured!.status).toBe("authenticated");
    expect(localStorage.getItem("auth.refresh")).toBeNull();
    const refreshWrites = setItemSpy.mock.calls.filter(
      ([k]) => k === "auth.refresh",
    );
    expect(refreshWrites).toHaveLength(0);
  });

  it("logout no longer reads auth.refresh from localStorage", async () => {
    vi.spyOn(authService, "refresh").mockResolvedValue({ access: "A1" });
    vi.spyOn(authService, "fetchMe").mockResolvedValue(FAKE_USER);
    vi.spyOn(authService, "logout").mockResolvedValue();
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");

    let captured: ReturnType<typeof useAuth> | null = null;
    const { findByTestId } = render(
      <MemoryRouter>
        <AuthProvider>
          <Capture onReady={(a) => (captured = a)} />
        </AuthProvider>
      </MemoryRouter>,
    );
    const status = await findByTestId("status");
    await waitFor(() => expect(status.textContent).toBe("authenticated"));

    getItemSpy.mockClear();
    act(() => {
      captured!.logout();
    });

    const refreshReads = getItemSpy.mock.calls.filter(
      ([k]) => k === "auth.refresh",
    );
    expect(refreshReads).toHaveLength(0);
  });

  it("logout-mid-refresh: epoch guard prevents resurrection", async () => {
    // Bootstrap into authenticated state via the initial /refresh/ call.
    const bootstrapRefresh = vi
      .spyOn(authService, "refresh")
      .mockResolvedValueOnce({ access: "A1" });
    vi.spyOn(authService, "fetchMe").mockResolvedValue(FAKE_USER);
    vi.spyOn(authService, "logout").mockResolvedValue();

    let captured: ReturnType<typeof useAuth> | null = null;
    const { findByTestId } = render(
      <MemoryRouter>
        <AuthProvider>
          <Capture onReady={(a) => (captured = a)} />
        </AuthProvider>
      </MemoryRouter>,
    );
    const status = await findByTestId("status");
    await waitFor(() => expect(status.textContent).toBe("authenticated"));

    // Subsequent business request will 401, triggering factory mutex →
    // handleRefresh → authService.refresh(). Gate that second refresh.
    const refreshGate = withResolvers<{ access: string }>();
    bootstrapRefresh.mockImplementation(() => refreshGate.promise);

    fetchMock.mockResolvedValueOnce(unauthorized());
    const inflight = fetchJson("/protected");

    // Allow microtasks to flush so handleRefresh has captured the epoch and
    // is awaiting the gated refresh promise.
    await Promise.resolve();
    await Promise.resolve();

    // Logout mid-flight — bumps the epoch, clears accessTokenRef.
    act(() => {
      captured!.logout();
    });

    refreshGate.resolve({ access: "A2" });

    await expect(inflight).rejects.toBeInstanceOf(AuthExpiredError);

    // Epoch guard fired → accessTokenRef stayed null. Verify by issuing
    // another fetchJson and confirming no Bearer is attached.
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await fetchJson("/another");
    const lastCall = fetchMock.mock.calls.at(-1)!;
    const headers = new Headers((lastCall[1] as RequestInit).headers);
    expect(headers.get("Authorization")).toBeNull();

    // logout() itself doesn't navigate; the inflight 401 path's onAuthError
    // sees hadSession=false (logout already cleared it) → no spurious
    // /login navigate. Per SEC-001 spec the assertion is the no-resurrection
    // outcome above; navigate count is incidental.
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
