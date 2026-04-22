import type { TFunction } from "i18next";
import { ApiError, AuthExpiredError } from "./apiClient";
import { OrderValidationError } from "./orderService";

export type ErrorKind =
  | "network"
  | "auth"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "rateLimit"
  | "validation"
  | "server"
  | "unknown";

export type NormalizedError = {
  kind: ErrorKind;
  status: number | null;
  fieldErrors?: Record<string, string>;
  detail?: string;
};

function extractFieldErrors(
  body: unknown,
): { fieldErrors?: Record<string, string>; detail?: string } {
  if (body == null) return {};
  if (Array.isArray(body)) {
    const first = body[0];
    return typeof first === "string" ? { detail: first } : {};
  }
  if (typeof body !== "object") return {};
  const dict = body as Record<string, unknown>;

  let detail: string | undefined;
  const rawDetail = dict["detail"];
  if (typeof rawDetail === "string") detail = rawDetail;
  const nonField = dict["non_field_errors"];
  if (!detail && Array.isArray(nonField) && typeof nonField[0] === "string") {
    detail = nonField[0];
  }

  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(dict)) {
    if (key === "detail" || key === "non_field_errors") continue;
    if (Array.isArray(value) && typeof value[0] === "string") {
      fieldErrors[key] = value[0];
    } else if (typeof value === "string") {
      fieldErrors[key] = value;
    }
  }
  const result: { fieldErrors?: Record<string, string>; detail?: string } = {};
  if (Object.keys(fieldErrors).length > 0) result.fieldErrors = fieldErrors;
  if (detail) result.detail = detail;
  return result;
}

function fromApiError(err: ApiError): NormalizedError {
  const status = err.status;
  if (status === 401) return { kind: "auth", status };
  if (status === 403) {
    const { detail } = extractFieldErrors(err.body);
    return { kind: "forbidden", status, detail };
  }
  if (status === 404) return { kind: "notFound", status };
  if (status === 409) {
    const { detail } = extractFieldErrors(err.body);
    return { kind: "conflict", status, detail };
  }
  if (status === 429) return { kind: "rateLimit", status };
  if (status === 400 || status === 422) {
    const parts = extractFieldErrors(err.body);
    if (!parts.fieldErrors && !parts.detail && err.body && typeof err.body === "object") {
      parts.detail = JSON.stringify(err.body);
    }
    return { kind: "validation", status, ...parts };
  }
  if (status >= 500) return { kind: "server", status };
  return { kind: "unknown", status: null };
}

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AuthExpiredError) return { kind: "auth", status: 401 };
  if (err instanceof OrderValidationError) {
    const parts = extractFieldErrors(err.body);
    if (!parts.detail && err.message && err.message !== "Order validation failed") {
      parts.detail = err.message;
    }
    return { kind: "validation", status: 400, ...parts };
  }
  if (err instanceof ApiError) return fromApiError(err);
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
      return { kind: "network", status: null };
    }
  }
  if (err instanceof Error && err.name === "AbortError") {
    return { kind: "network", status: null };
  }
  return {
    kind: "unknown",
    status: null,
    detail: import.meta.env.DEV ? String(err) : undefined,
  };
}

export type MessageVariant = "short" | "title" | "hint";

export function errorMessage(
  err: NormalizedError,
  t: TFunction,
  overrideKey?: string,
  variant: MessageVariant = "short",
): string {
  const candidates: string[] = [];
  if (overrideKey) {
    candidates.push(`${overrideKey}.${err.kind}`);
    candidates.push(`${overrideKey}.${variant}`);
  }
  candidates.push(`errors.${err.kind}.${variant}`);
  candidates.push(`errors.unknown.${variant}`);
  for (const key of candidates) {
    const value = t(key, { defaultValue: "" });
    if (value) return value;
  }
  return t("errors.unknown.short", { defaultValue: "Error" });
}
