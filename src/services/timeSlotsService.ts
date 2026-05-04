export type TimeSlotDTO = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  order: number;
  is_active: boolean;
};

const cache = new Map<string, Promise<TimeSlotDTO[]>>();
let warnedAboutMissingSlug = false;

const EMPTY: TimeSlotDTO[] = [];

function resolveBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
}

function resolveSlug(): string {
  return (
    (import.meta.env.VITE_LANDING_COMPANY_SLUG as string | undefined) ?? ""
  );
}

export function fetchPublicTimeSlots(
  signal?: AbortSignal,
): Promise<TimeSlotDTO[]> {
  const slug = resolveSlug();
  if (!slug) {
    if (!warnedAboutMissingSlug) {
      console.warn(
        "VITE_LANDING_COMPANY_SLUG is not set — time-slots disabled.",
      );
      warnedAboutMissingSlug = true;
    }
    return Promise.resolve(EMPTY);
  }

  const key = slug;
  const existing = cache.get(key);
  const promise = existing ?? buildPromise(key);
  if (!existing) cache.set(key, promise);

  if (!signal) return promise;
  return wrapSignal(promise, signal);
}

function buildPromise(key: string): Promise<TimeSlotDTO[]> {
  const baseUrl = resolveBaseUrl().replace(/\/$/, "");
  const url =
    `${baseUrl}/public/time-slots/` +
    `?company=${encodeURIComponent(key)}`;
  return (async () => {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`fetchPublicTimeSlots: HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as TimeSlotDTO[];
    const arr = Array.isArray(json) ? json : [];
    if (arr.length === 0) {
      // F-016: don't cache empty results. A transient race (slow seed,
      // service worker hiccup) returning [] would otherwise leave every
      // future consumer with an empty dropdown until full page reload.
      cache.delete(key);
    }
    return arr;
  })().catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });
}

// FE-DT-006: shared cache must NOT cancel for everyone when one consumer
// aborts. Wrap the cached promise in a per-call signal-aware shell —
// matches the pattern in zonesService.fetchPublicZones.
function wrapSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => {
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      },
    );
  });
}

export function __resetTimeSlotsCacheForTests(): void {
  cache.clear();
  warnedAboutMissingSlug = false;
}
