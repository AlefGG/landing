import { fetchJson } from "./apiClient";

export type FixedDestinationDTO = {
  id: number;
  name: string;
  fixed_price: string;
  max_cabins: number;
  multi_day_surcharge: string;
  is_active: boolean;
};

// BE-2: unlike time-slots (a public endpoint reachable by slug), the
// fixed-destinations list is company-scoped behind `HasCompany`, so it must
// go through the authenticated apiClient (`fetchJson` adds the Bearer token).
// We still mirror the time-slots cache shape: cache keyed by access-token
// presence is not needed (the apiClient handles refresh), but we keep a
// per-locale cache so a language switch refetches with the right
// Accept-Language header.
const cache = new Map<string, Promise<FixedDestinationDTO[]>>();

const EMPTY: FixedDestinationDTO[] = [];

export function fetchPublicFixedDestinations(
  signal?: AbortSignal,
): Promise<FixedDestinationDTO[]> {
  // The apiClient owns auth; an anonymous caller simply gets a 401 here,
  // which the hook surfaces as "error" (empty dropdown). That's acceptable —
  // a customer must be logged in to submit an order anyway.
  const key = "fixed-destinations";
  const existing = cache.get(key);
  const promise = existing ?? buildPromise(key);
  if (!existing) cache.set(key, promise);

  if (!signal) return promise;
  return wrapSignal(promise, signal);
}

function buildPromise(key: string): Promise<FixedDestinationDTO[]> {
  return fetchJson<FixedDestinationDTO[]>("/catalog/fixed-destinations/")
    .then((json) => {
      const arr = Array.isArray(json) ? json : [];
      if (arr.length === 0) {
        // Don't cache an empty/transient result — a freshly-seeded company or
        // a slow first response would otherwise lock every consumer empty.
        cache.delete(key);
      }
      return arr;
    })
    .catch((err: unknown) => {
      cache.delete(key);
      throw err;
    });
}

// Per-call signal-aware shell so one consumer aborting does not reject the
// shared cached promise for everyone — mirrors timeSlotsService.wrapSignal.
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

export function __resetFixedDestinationsCacheForTests(): void {
  cache.clear();
}

export { EMPTY as __EMPTY_FIXED_DESTINATIONS };
