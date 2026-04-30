import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StrictMode, useEffect } from "react";
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

function Capture({ onReady }: { onReady: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  useEffect(() => {
    onReady(auth);
  });
  return <div data-testid="status">{auth.status}</div>;
}

describe("AuthContext", () => {
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

  it("StrictMode mount stability — latest configuration wins", async () => {
    // No stored refresh → bootstrap flips to anonymous synchronously.
    const { findByTestId } = render(
      <StrictMode>
        <MemoryRouter>
          <AuthProvider>
            <Capture onReady={() => {}} />
          </AuthProvider>
        </MemoryRouter>
      </StrictMode>,
    );
    const status = await findByTestId("status");
    expect(status.textContent).toBe("anonymous");

    // After mount the apiClient slot has been configured; fetchJson should
    // hit the real fetch with no Bearer (no access token yet).
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await fetchJson("/x");
    const headers = new Headers(fetchMock.mock.calls[0]![1]!.headers);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("bootstrap with stored refresh → authenticated", async () => {
    localStorage.setItem("auth.refresh", "R1");
    const refreshSpy = vi
      .spyOn(authService, "refresh")
      .mockResolvedValue({ access: "A1" });
    const fetchMeSpy = vi
      .spyOn(authService, "fetchMe")
      .mockResolvedValue(FAKE_USER);

    const { findByTestId } = render(
      <MemoryRouter>
        <AuthProvider>
          <Capture onReady={() => {}} />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(refreshSpy).toHaveBeenCalledWith("R1");
    });
    await waitFor(() => {
      expect(fetchMeSpy).toHaveBeenCalled();
    });
    const status = await findByTestId("status");
    await waitFor(() => expect(status.textContent).toBe("authenticated"));
  });

  it("bootstrap with stored refresh that fails → anonymous + localStorage cleared", async () => {
    localStorage.setItem("auth.refresh", "R1");
    vi.spyOn(authService, "refresh").mockRejectedValue(new Error("boom"));

    const { findByTestId } = render(
      <MemoryRouter>
        <AuthProvider>
          <Capture onReady={() => {}} />
        </AuthProvider>
      </MemoryRouter>,
    );

    const status = await findByTestId("status");
    await waitFor(() => expect(status.textContent).toBe("anonymous"));
    expect(localStorage.getItem("auth.refresh")).toBeNull();
  });

  it("login → updates refs; subsequent fetchJson includes new Bearer", async () => {
    vi.spyOn(authService, "verifyOtp").mockResolvedValue({
      access: "A1",
      refresh: "R1",
      user: FAKE_USER,
    });

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
    expect(localStorage.getItem("auth.refresh")).toBe("R1");

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await fetchJson("/x");
    const headers = new Headers(fetchMock.mock.calls[0]![1]!.headers);
    expect(headers.get("Authorization")).toBe("Bearer A1");
  });

  it("logout-during-refresh: post-await guard prevents resurrection", async () => {
    // Bootstrap into authenticated state.
    localStorage.setItem("auth.refresh", "R1");
    vi.spyOn(authService, "refresh").mockResolvedValueOnce({
      access: "A1",
      refresh: "R1",
    });
    vi.spyOn(authService, "fetchMe").mockResolvedValue(FAKE_USER);

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

    // Now mount the second refresh call — paused via a gate. AuthContext's
    // handleRefresh will await this when the factory mutex hits 401.
    const refreshGate = withResolvers<{ access: string; refresh?: string }>();
    (authService.refresh as ReturnType<typeof vi.fn>).mockImplementation(
      () => refreshGate.promise,
    );

    // Trigger 401 on a business request.
    fetchMock.mockResolvedValueOnce(unauthorized());
    const inflight = fetchJson("/protected");

    // Allow microtasks to flush so handleRefresh has captured `current` and
    // is awaiting the gated refresh promise.
    await Promise.resolve();
    await Promise.resolve();

    // Logout mid-flight — clears refs.
    act(() => {
      captured!.logout();
    });
    expect(localStorage.getItem("auth.refresh")).toBeNull();

    // Refresh resolves AFTER logout — guard must drop the result.
    refreshGate.resolve({ access: "A2", refresh: "R2" });

    await expect(inflight).rejects.toBeInstanceOf(AuthExpiredError);
    expect(localStorage.getItem("auth.refresh")).toBeNull();

    // logout() clears refs synchronously (no navigate from logout path
    // itself). When the inflight 401 path then hits onAuthError, hadSession
    // is already false → handleAuthError suppresses navigate. Per spec §5.5
    // this is the "idempotent / no resurrection / no spurious navigate"
    // outcome.
    expect(mockNavigate).not.toHaveBeenCalled();

    // Subsequent fetchJson is unauth (no Bearer).
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await fetchJson("/another");
    const headers = new Headers(fetchMock.mock.calls.at(-1)![1]!.headers);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("external fetchJson before AuthProvider mounts uses default unauth client", async () => {
    __resetApiClient();
    fetchMock.mockResolvedValueOnce(unauthorized());

    await expect(fetchJson("/x")).rejects.toBeInstanceOf(AuthExpiredError);
    // No Bearer header on the single fetch call (no retry — default onRefresh returns null).
    const headers = new Headers(fetchMock.mock.calls[0]![1]!.headers);
    expect(headers.get("Authorization")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
