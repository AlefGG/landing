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

  const key = `${slug}:${serviceType}`;
  const existing = cache.get(key);
  if (existing) return existing;

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
    const resp = await fetch(url);
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

  if (!signal) return promise;
  return new Promise<ZonesFeatureCollection>((resolve, reject) => {
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
