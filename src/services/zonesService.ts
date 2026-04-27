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
      // eslint-disable-next-line no-console
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

  const promise = (async () => {
    const resp = await fetch(url, { signal });
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
  return promise;
}

// Test-only — do not import from app code.
export function __resetZonesCacheForTests(): void {
  cache.clear();
  warnedAboutMissingSlug = false;
}
