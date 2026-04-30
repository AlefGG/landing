/**
 * Authenticated fetch wrapper with automatic token refresh on 401.
 *
 * Owner of access/refresh state stays in AuthContext; this client just asks for
 * the current access token, and on 401 asks the owner to refresh and retries
 * the request once. A second 401 triggers onAuthError (logout + redirect).
 */

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class AuthExpiredError extends Error {
  constructor() {
    super("Authentication expired");
    this.name = "AuthExpiredError";
  }
}

type ApiClientConfig = {
  baseUrl?: string;
  getAccessToken: () => string | null;
  onRefresh: () => Promise<string | null>;
  onAuthError: () => void;
};

export type ApiClient = {
  request: <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
  requestBlob: (path: string, init?: RequestInit) => Promise<Blob>;
};

function buildUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function withAuth(init: RequestInit | undefined, token: string | null): RequestInit {
  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init?.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return { ...init, headers };
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    return await response.text();
  } catch {
    return null;
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  // Closure-scoped mutex — collapses concurrent 401s into a single onRefresh()
  // call. Cleared on a macrotask boundary (setTimeout 0) so all microtask
  // awaiters of THIS refresh observe the resolved value before the slot wipes.
  let inflightRefresh: Promise<string | null> | null = null;

  async function refreshOnce(): Promise<string | null> {
    if (inflightRefresh) return inflightRefresh;
    inflightRefresh = (async () => {
      try {
        return await config.onRefresh();
      } catch {
        // Defence-in-depth: normalise reject → null so all awaiters see the
        // same "auth expired" outcome, regardless of how onRefresh fails.
        return null;
      } finally {
        setTimeout(() => {
          inflightRefresh = null;
        }, 0);
      }
    })();
    return inflightRefresh;
  }

  async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
    const baseUrl = path.startsWith("/media/")
      ? (config.baseUrl ?? "").replace(/\/api\/?$/, "")
      : config.baseUrl;
    const url = buildUrl(baseUrl, path);
    const accessToken = config.getAccessToken();
    const firstResponse = await fetch(url, withAuth(init, accessToken));

    if (firstResponse.status !== 401) return firstResponse;

    const refreshedToken = await refreshOnce();
    if (!refreshedToken) {
      config.onAuthError();
      throw new AuthExpiredError();
    }

    const retryResponse = await fetch(url, withAuth(init, refreshedToken));
    if (retryResponse.status === 401) {
      config.onAuthError();
      throw new AuthExpiredError();
    }
    return retryResponse;
  }

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    return handleResponse<T>(await rawFetch(path, init));
  }

  async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
    const res = await rawFetch(path, init);
    if (!res.ok) {
      const body = await parseBody(res);
      throw new ApiError(res.status, `Request failed with status ${res.status}`, body);
    }
    return res.blob();
  }

  return { request, requestBlob };
}

// ---------------------------------------------------------------------------
// Module-level singleton wiring
// ---------------------------------------------------------------------------
// AuthProvider configures this on mount via `configureApiClient`; services
// then import `fetchJson` without plumbing the client through every call.
// Before configuration (SSR, tests without AuthProvider), `fetchJson` falls
// back to an unauthenticated client that points at VITE_API_URL and never
// refreshes. This keeps unit tests that hit public endpoints trivial.

function resolveBaseUrl(): string {
  const env = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
  return env;
}

let activeClient: ApiClient = createApiClient({
  baseUrl: resolveBaseUrl(),
  getAccessToken: () => null,
  onRefresh: async () => null,
  onAuthError: () => {},
});

export function configureApiClient(
  config: Omit<ApiClientConfig, "baseUrl"> & { baseUrl?: string },
): void {
  activeClient = createApiClient({
    baseUrl: config.baseUrl ?? resolveBaseUrl(),
    getAccessToken: config.getAccessToken,
    onRefresh: config.onRefresh,
    onAuthError: config.onAuthError,
  });
}

export function getApiClient(): ApiClient {
  return activeClient;
}

export function fetchJson<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return activeClient.request<T>(path, init);
}

export function fetchBlob(path: string, init?: RequestInit): Promise<Blob> {
  return activeClient.requestBlob(path, init);
}

// Test-only: reset the slot back to the unauth default. Used by Vitest
// teardown to keep tests isolated from each other.
export function __resetApiClient(): void {
  activeClient = createApiClient({
    baseUrl: resolveBaseUrl(),
    getAccessToken: () => null,
    onRefresh: async () => null,
    onAuthError: () => {},
  });
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await parseBody(response);
    throw new ApiError(
      response.status,
      `Request failed with status ${response.status}`,
      body,
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const body = await parseBody(response);
  return body as T;
}
