/**
 * OTP authentication service (real backend).
 *
 * Endpoints:
 *   POST /api/auth/send-otp/     { phone } → 200 | 400 | 429
 *   POST /api/auth/verify-otp/   { phone, code } → 200 {access, user} (Set-Cookie: refresh_token)
 *   POST /api/auth/refresh/      {} (cookie auth + X-CSRFToken) → 200 {access}
 *   GET  /api/auth/me/           → 200 user
 *   PATCH /api/auth/me/          { first_name?, email?, language? } → 200 user
 *   POST /api/auth/logout/       {} (cookie auth + X-CSRFToken) → 204
 *
 * FE-SEC-001 step 2: refresh token lives in HttpOnly cookie; access stays
 * in-memory only. No localStorage refresh writes. CSRF header required for
 * /refresh/ and /logout/ (Django middleware enforces).
 */

import { ApiError, fetchJson } from "./apiClient";
import { getCsrfToken } from "./csrf";

export type AuthUser = {
  id: number;
  phone: string;
  role: string;
  language: string;
  company: number | null;
  first_name: string;
  email: string;
};

export type ProfilePatch = {
  first_name?: string;
  email?: string;
  language?: string;
};

export class InvalidOtpError extends Error {
  constructor() {
    super("Invalid OTP code");
    this.name = "InvalidOtpError";
  }
}

export class OtpSendError extends Error {
  constructor(message = "Failed to send OTP") {
    super(message);
    this.name = "OtpSendError";
  }
}

const DEFAULT_RESEND_SECONDS = 60;

/** Convert a UI phone (digits-only or "8..." / "+7...") to E.164 "+7..." */
export function toE164(value: string): string {
  const raw = value.trim();
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  const normalized = !hasPlus && digits.startsWith("8") ? "7" + digits.slice(1) : digits;
  return `+${normalized}`;
}

function authBaseUrl(): string {
  const env = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
  return env.replace(/\/$/, "");
}

export async function sendOtp(phone: string): Promise<{ expiresIn: number }> {
  try {
    await fetchJson("/auth/send-otp/", {
      method: "POST",
      body: JSON.stringify({ phone: toE164(phone) }),
    });
    return { expiresIn: DEFAULT_RESEND_SECONDS };
  } catch (err) {
    if (err instanceof ApiError) {
      throw new OtpSendError();
    }
    throw err;
  }
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<{ access: string; user: AuthUser }> {
  try {
    const url = `${authBaseUrl()}/auth/verify-otp/`;
    // credentials: 'include' so the Set-Cookie (refresh_token) is honoured
    // by the browser. Bypass apiClient because verify-otp is the bootstrap
    // call that issues the access token — there's no Bearer to attach yet.
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: toE164(phone), code }),
    });
    if (!response.ok) {
      if (response.status === 400) throw new InvalidOtpError();
      throw new ApiError(response.status, "verify failed");
    }
    const body = (await response.json()) as {
      access: string;
      user: AuthUser;
      refresh?: string;
    };
    // Step 1+2: backend may still echo `refresh` in body; ignore it — the
    // cookie is the source of truth. Step 3 will drop the field entirely.
    return { access: body.access, user: body.user };
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      throw new InvalidOtpError();
    }
    throw err;
  }
}

/**
 * POST /api/auth/refresh/ — refresh_token cookie sent automatically;
 * X-CSRFToken header validated by Django CSRF middleware.
 */
export async function refresh(): Promise<{ access: string }> {
  const url = `${authBaseUrl()}/auth/refresh/`;
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: "{}",
  });
  if (!response.ok) {
    throw new ApiError(response.status, "refresh failed");
  }
  const body = (await response.json()) as { access: string };
  return { access: body.access };
}

export async function fetchMe(): Promise<AuthUser> {
  return fetchJson<AuthUser>("/auth/me/");
}

export async function updateProfile(patch: ProfilePatch): Promise<AuthUser> {
  return fetchJson<AuthUser>("/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function logout(): Promise<void> {
  try {
    const url = `${authBaseUrl()}/auth/logout/`;
    await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
      },
      body: "{}",
    });
  } catch {
    // logout is best-effort; local state cleared regardless
  }
}
