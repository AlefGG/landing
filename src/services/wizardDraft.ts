import type { z } from "zod";

export type WizardSlug =
  | "service"
  | "event"
  | "construction"
  | "emergency"
  | "sale-checkout";

const STORAGE_KEY_PREFIX = "biotoilets:wizardDraft:";
const TTL_MS = 24 * 60 * 60 * 1000;

function key(slug: WizardSlug): string {
  return `${STORAGE_KEY_PREFIX}${slug}`;
}

export function saveDraft<T>(slug: WizardSlug, payload: T): void {
  if (typeof window === "undefined") return;
  const envelope = { savedAt: Date.now(), payload };
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(envelope));
  } catch {
    // QuotaExceededError / private mode — silent fail
  }
}

/**
 * FE-TS-003: validate the stored payload against a caller-supplied zod
 * schema. On envelope-fail (corrupt JSON / shape mismatch / missing
 * payload), clear the localStorage entry and return null — defensive
 * cleanup so the next visit hydrates from defaults instead of crashing
 * on a stale schema.
 *
 * Failure mode is always strict (corrupt-state worse than reset). No
 * SCHEMA_VALIDATION_MODE flag — wizardDraft is local user data, no
 * Sentry signal needed.
 *
 * Overload: `loadDraft<T>(slug)` (no schema) preserves the legacy
 * un-validated path for callers that haven't migrated yet. The new
 * `loadDraft<S extends z.ZodType>(slug, schema)` form is preferred
 * for new callers; mass migration to per-wizard schemas happens in
 * the wizard files themselves.
 */
export function loadDraft<T>(slug: WizardSlug): T | null;
export function loadDraft<S extends z.ZodType<unknown>>(
  slug: WizardSlug,
  schema: S,
): z.infer<S> | null;
export function loadDraft<T>(
  slug: WizardSlug,
  schema?: z.ZodType<unknown>,
): T | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key(slug));
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { savedAt?: unknown }).savedAt !== "number" ||
    !("payload" in (parsed as object))
  ) {
    // Corrupt envelope — clear and reset so next mount won't loop on it.
    clearDraft(slug);
    return null;
  }
  const envelope = parsed as { savedAt: number; payload: unknown };
  if (Date.now() - envelope.savedAt > TTL_MS) return null;
  if (!schema) return envelope.payload as T;
  const result = schema.safeParse(envelope.payload);
  if (!result.success) {
    // Payload shape mismatch — clear so the user starts fresh on next mount.
    clearDraft(slug);
    return null;
  }
  return result.data as T;
}

export function clearDraft(slug: WizardSlug): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(slug));
  } catch {
    // ignore
  }
}
