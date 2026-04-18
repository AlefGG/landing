/**
 * OTP authentication service.
 *
 * Mock implementation: accepts code "1234" for any phone.
 * Real Django endpoints:
 *   POST /api/auth/send-otp/    — send OTP via WhatsApp
 *   POST /api/auth/verify-otp/  — exchange phone+code for JWT pair
 *   POST /api/auth/refresh/     — refresh access token
 *
 * Real implementation is wired in P1 when the backend is reachable.
 */

export type AuthUser = {
  id: string;
  phone: string;
  name?: string;
  email?: string;
};

export type ProfilePatch = {
  name?: string;
  email?: string;
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

const MOCK_DELAY_MS = 300;
const MOCK_OTP_CODE = "123456";
const DEFAULT_EXPIRES_IN_SECONDS = 60;

function mockToken(kind: "access" | "refresh"): string {
  return `mock-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendOtp(
  phone: string,
): Promise<{ expiresIn: number }> {
  if (import.meta.env.DEV) {
    console.info("[authService:mock] sendOtp", phone);
  }
  await wait(MOCK_DELAY_MS);
  return { expiresIn: DEFAULT_EXPIRES_IN_SECONDS };
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<VerifyResult> {
  if (import.meta.env.DEV) {
    console.info("[authService:mock] verifyOtp", phone, code);
  }
  await wait(MOCK_DELAY_MS);
  if (code !== MOCK_OTP_CODE) {
    throw new InvalidOtpError();
  }
  return {
    access: mockToken("access"),
    refresh: mockToken("refresh"),
    user: { id: phone, phone },
  };
}

export async function refresh(
  refreshToken: string,
): Promise<{ access: string }> {
  if (import.meta.env.DEV) {
    console.info("[authService:mock] refresh", refreshToken.slice(0, 16));
  }
  await wait(MOCK_DELAY_MS);
  if (!refreshToken.startsWith("mock-refresh-")) {
    throw new OtpSendError("Invalid refresh token");
  }
  return { access: mockToken("access") };
}

export async function updateProfile(
  current: AuthUser,
  patch: ProfilePatch,
): Promise<AuthUser> {
  if (import.meta.env.DEV) {
    console.info("[authService:mock] updateProfile", patch);
  }
  await wait(MOCK_DELAY_MS);
  return {
    ...current,
    name: patch.name ?? current.name,
    email: patch.email ?? current.email,
  };
}
