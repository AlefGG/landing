import i18n from "../i18n";

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

// FE-DT-004: locale-aware cache + Accept-Language header.
function resolveLocale(): string {
  return i18n?.language || "ru";
}

export function fetchPublicServicePackages(
  signal?: AbortSignal,
): Promise<ServicePackageDTO[]> {
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

  const locale = resolveLocale();
  const key = `${slug}:${locale}`;
  const existing = cache.get(key);
  const promise = existing ?? buildPromise(key, slug, locale);
  if (!existing) cache.set(key, promise);

  if (!signal) return promise;
  return wrapSignal(promise, signal);
}

function buildPromise(
  key: string,
  slug: string,
  locale: string,
): Promise<ServicePackageDTO[]> {
  const baseUrl = resolveBaseUrl().replace(/\/$/, "");
  const url =
    `${baseUrl}/public/service-packages/` +
    `?company=${encodeURIComponent(slug)}`;
  return (async () => {
    const resp = await fetch(url, {
      headers: { "Accept-Language": locale },
    });
    if (!resp.ok) {
      throw new Error(`fetchPublicServicePackages: HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as ServicePackageDTO[];
    return Array.isArray(json) ? json : [];
  })().catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });
}

// FE-DT-006: per-call signal-aware shell around the shared cached promise;
// matches zonesService.fetchPublicZones pattern.
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

export function __resetServicePackagesCacheForTests(): void {
  cache.clear();
  warnedAboutMissingSlug = false;
}
