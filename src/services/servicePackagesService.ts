export type ServicePackageDTO = {
  id: number;
  name: string;
  visits_per_week: number;
  is_active: boolean;
};

const cache = new Map<string, Promise<ServicePackageDTO[]>>();
let warnedAboutMissingSlug = false;

const EMPTY: ServicePackageDTO[] = [];

function resolveBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
}

function resolveSlug(): string {
  return (
    (import.meta.env.VITE_LANDING_COMPANY_SLUG as string | undefined) ?? ""
  );
}

export function fetchPublicServicePackages(): Promise<ServicePackageDTO[]> {
  const slug = resolveSlug();
  if (!slug) {
    if (!warnedAboutMissingSlug) {
      console.warn(
        "VITE_LANDING_COMPANY_SLUG is not set — service-packages disabled.",
      );
      warnedAboutMissingSlug = true;
    }
    return Promise.resolve(EMPTY);
  }

  const key = slug;
  const existing = cache.get(key);
  if (existing) return existing;

  const baseUrl = resolveBaseUrl().replace(/\/$/, "");
  const url =
    `${baseUrl}/public/service-packages/` +
    `?company=${encodeURIComponent(slug)}`;

  const promise = (async () => {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`fetchPublicServicePackages: HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as ServicePackageDTO[];
    return Array.isArray(json) ? json : [];
  })().catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });

  cache.set(key, promise);
  return promise;
}

export function __resetServicePackagesCacheForTests(): void {
  cache.clear();
  warnedAboutMissingSlug = false;
}
