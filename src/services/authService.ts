/**
 * OTP authentication service (real backend).
 *
 * Endpoints:
 *   POST /api/auth/send-otp/     { phone } → 200 | 400 | 429
 *   POST /api/auth/verify-otp/   { phone, code } → 200 {access, refresh, user} | 400
 *   POST /api/auth/refresh/      { refresh } → 200 {access}
 *   GET  /api/auth/me/           → 200 user
 *   PATCH /api/auth/me/          { first_name?, email?, language? } → 200 user
 *   POST /api/auth/logout/       { refresh } → 204
 */

import { ApiError, fetchJson } from "./apiClient";

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

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type VerifyResult = AuthTokens & { user: AuthUser };

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
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  const normalized = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
  return `+${normalized}`;
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

export async function verifyOtp(phone: string, code: string): Promise<VerifyResult> {
  try {
    const res = await fetchJson<VerifyResult>("/auth/verify-otp/", {
      method: "POST",
      body: JSON.stringify({ phone: toE164(phone), code }),
    });
    return res;
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      throw new InvalidOtpError();
    }
    throw err;
  }
}

/**
 * POST /api/auth/refresh/ — SimpleJWT returns {access, refresh?}.
 * Called outside authenticated context (no Bearer on the request itself,
 * so we hit fetch directly — apiClient's 401-refresh loop is not relevant here).
 */
export async function refresh(refreshToken: string): Promise<{ access: string; refresh?: string }> {
  const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
  const url = `${baseUrl.replace(/\/$/, "")}/auth/refresh/`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!response.ok) {
    throw new ApiError(response.status, "refresh failed");
  }
  const body = (await response.json()) as { access: string; refresh?: string };
  return { access: body.access, refresh: body.refresh };
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

export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetchJson("/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch {
    // logout is best-effort; local state cleared regardless
  }
}
