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

import { z } from "zod";
import {
  ApiError,
  fetchJson,
  fetchValidated,
  reportSchemaMismatch,
} from "./apiClient";
import { getCsrfToken } from "./csrf";

// FE-TS-002 — pairs with backend/apps/accounts/serializers.py::UserSerializer
export const AuthUserSchema = z
  .object({
    id: z.number(),
    phone: z.string(),
    role: z.string(),
    language: z.string(),
    company: z.number().nullable(),
    first_name: z.string(),
    email: z.string(),
  })
  .describe("AuthUserSchema");

export type AuthUser = z.infer<typeof AuthUserSchema>;

const VerifyOtpResponseSchema = z
  .object({
    access: z.string(),
    user: AuthUserSchema,
    refresh: z.string().optional(), // legacy body field — backend SEC-001 step 3 will drop
  })
  .describe("VerifyOtpResponseSchema");

const RefreshResponseSchema = z
  .object({ access: z.string() })
  .describe("RefreshResponseSchema");

export type ProfilePatch = {
  first_name?: string;
  email?: string;
  language?: string;
};

export type InvalidOtpReason = "invalid" | "expired" | "too_many_attempts";

export class InvalidOtpError extends Error {
  reason: InvalidOtpReason;
  constructor(reason: InvalidOtpReason = "invalid") {
    super(`Invalid OTP code (${reason})`);
    this.name = "InvalidOtpError";
    this.reason = reason;
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
      if (response.status === 400) {
        // F-006: backend distinguishes invalid / expired / too_many_attempts
        // via a `code` field on the 400 body. Default to "invalid" if the
        // body is missing/unparseable so we never lose the legacy behaviour.
        let reason: InvalidOtpReason = "invalid";
        try {
          const body = (await response.json()) as { code?: string };
          if (body?.code === "expired" || body?.code === "too_many_attempts") {
            reason = body.code;
          }
        } catch {
          // ignore — fall through to default 'invalid'
        }
        throw new InvalidOtpError(reason);
      }
      throw new ApiError(response.status, "verify failed");
    }
    const raw = (await response.json()) as unknown;
    const parsed = VerifyOtpResponseSchema.safeParse(raw);
    const body = parsed.success
      ? parsed.data
      : (reportSchemaMismatch(
          "/auth/verify-otp/",
          VerifyOtpResponseSchema,
          parsed.error.issues,
          raw,
        ) as z.infer<typeof VerifyOtpResponseSchema>);
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
  const raw = (await response.json()) as unknown;
  const parsed = RefreshResponseSchema.safeParse(raw);
  const body = parsed.success
    ? parsed.data
    : (reportSchemaMismatch(
        "/auth/refresh/",
        RefreshResponseSchema,
        parsed.error.issues,
        raw,
      ) as z.infer<typeof RefreshResponseSchema>);
  return { access: body.access };
}

export async function fetchMe(): Promise<AuthUser> {
  return fetchValidated("/auth/me/", AuthUserSchema);
}

export async function updateProfile(patch: ProfilePatch): Promise<AuthUser> {
  return fetchValidated("/auth/me/", AuthUserSchema, {
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
