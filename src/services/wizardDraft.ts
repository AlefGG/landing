export type WizardSlug =
  | "service"
  | "event"
  | "construction"
  | "emergency"
  | "sale-checkout";

const STORAGE_KEY_PREFIX = "biotoilets:wizardDraft:";
const TTL_MS = 24 * 60 * 60 * 1000;

type DraftEnvelope<T> = { savedAt: number; payload: T };

function key(slug: WizardSlug): string {
  return `${STORAGE_KEY_PREFIX}${slug}`;
}

export function saveDraft<T>(slug: WizardSlug, payload: T): void {
  if (typeof window === "undefined") return;
  const envelope: DraftEnvelope<T> = { savedAt: Date.now(), payload };
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(envelope));
  } catch {
    // QuotaExceededError / private mode — silent fail
  }
}

export function loadDraft<T>(slug: WizardSlug): T | null {
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
    return null;
  }
  const envelope = parsed as DraftEnvelope<T>;
  if (Date.now() - envelope.savedAt > TTL_MS) return null;
  return envelope.payload;
}

export function clearDraft(slug: WizardSlug): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(slug));
  } catch {
    // ignore
  }
}
