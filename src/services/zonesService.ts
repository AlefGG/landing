import i18n from "../i18n";

export type ZoneServiceType =
  | "rental_event"
  | "rental_emergency"
  | "rental_construction"
  | "sanitation"
  | "sale";

export type ZoneFeatureProperties = {
  id: number;
  name: string;
  price: string;
  priority: number;
};

export type ZoneFeature = {
  type: "Feature";
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: ZoneFeatureProperties;
};

export type ZonesFeatureCollection = {
  type: "FeatureCollection";
  features: ZoneFeature[];
};

const cache = new Map<string, Promise<ZonesFeatureCollection>>();
let warnedAboutMissingSlug = false;

const EMPTY_FC: ZonesFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function resolveBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
}

function resolveSlug(): string {
  return (import.meta.env.VITE_LANDING_COMPANY_SLUG as string | undefined) ?? "";
}

// FE-DT-004: read i18n.language at call time. i18n is initialised at app
// bootstrap (src/main.tsx imports ./i18n eagerly), so by the time any
// service call fires, `i18n.language` is populated. SSR / test paths fall
// back to "ru" via the static import's `lng` config.
function resolveLocale(): string {
  return i18n?.language || "ru";
}

export function fetchPublicZones(
  serviceType: ZoneServiceType,
  signal?: AbortSignal,
): Promise<ZonesFeatureCollection> {
  const slug = resolveSlug();
  if (!slug) {
    if (!warnedAboutMissingSlug) {
      console.warn(
        "VITE_LANDING_COMPANY_SLUG is not set — zones overlay disabled.",
      );
      warnedAboutMissingSlug = true;
    }
    return Promise.resolve(EMPTY_FC);
  }

  const locale = resolveLocale();
  const key = `${slug}:${serviceType}:${locale}`;
  const existing = cache.get(key);
  if (existing) return signal ? wrapSignal(existing, signal) : existing;

  const baseUrl = resolveBaseUrl().replace(/\/$/, "");
  const url =
    `${baseUrl}/public/zones/` +
    `?company=${encodeURIComponent(slug)}` +
    `&service_type=${encodeURIComponent(serviceType)}`;

  // The cache entry is shared across consumers; we must NOT use the per-call
  // signal for the underlying fetch (StrictMode/HMR aborts would poison the
  // cache for everyone). Each consumer wraps the shared promise in its own
  // signal-aware wrapper and resolves to EMPTY_FC on abort.
  const promise = (async () => {
    const resp = await fetch(url, {
      headers: { "Accept-Language": locale },
    });
    if (!resp.ok) {
      throw new Error(`fetchPublicZones: HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as ZonesFeatureCollection;
    return json;
  })().catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });

  cache.set(key, promise);
  return signal ? wrapSignal(promise, signal) : promise;
}

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

// Test-only — do not import from app code.
export function __resetZonesCacheForTests(): void {
  cache.clear();
  warnedAboutMissingSlug = false;
}
