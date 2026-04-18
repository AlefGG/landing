/**
 * Authenticated fetch wrapper with automatic token refresh on 401.
 *
 * Owner of access/refresh state stays in AuthContext; this client just asks for
 * the current access token, and on 401 asks the owner to refresh and retries
 * the request once. A second 401 triggers onAuthError (logout + redirect).
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
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
  if (init?.body && !headers.has("Content-Type")) {
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
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = buildUrl(config.baseUrl, path);
    const accessToken = config.getAccessToken();
    const firstResponse = await fetch(url, withAuth(init, accessToken));

    if (firstResponse.status !== 401) {
      return handleResponse<T>(firstResponse);
    }

    const refreshedToken = await config.onRefresh();
    if (!refreshedToken) {
      config.onAuthError();
      throw new AuthExpiredError();
    }

    const retryResponse = await fetch(url, withAuth(init, refreshedToken));
    if (retryResponse.status === 401) {
      config.onAuthError();
      throw new AuthExpiredError();
    }
    return handleResponse<T>(retryResponse);
  }

  return { request };
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
