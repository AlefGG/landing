/**
 * F-010: pull construction-discount tiers from the backend so the admin can
 * adjust pricing from the admin panel without a frontend release. Endpoints:
 *   GET /api/public/pricing/construction-discounts/?company=<slug>
 *   GET /api/public/pricing/config/?company=<slug>
 *
 * Mirrors the company-slug guard pattern used by `timeSlotsService.ts`: if
 * the slug isn't set we resolve to an empty payload so the wizards fall back
 * to their static defaults instead of throwing.
 */

export type ConstructionDiscountRow = { months: number; discount: number };

const discountsCache = new Map<string, Promise<ConstructionDiscountRow[]>>();
const configCache = new Map<string, Promise<Record<string, string>>>();
let warnedAboutMissingSlug = false;

const EMPTY_DISCOUNTS: ConstructionDiscountRow[] = [];
const EMPTY_CONFIG: Record<string, string> = {};

function resolveBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
}

function resolveSlug(): string {
  return (
    (import.meta.env.VITE_LANDING_COMPANY_SLUG as string | undefined) ?? ""
  );
}

function warnSlugOnce(): void {
  if (warnedAboutMissingSlug) return;
  console.warn(
    "VITE_LANDING_COMPANY_SLUG is not set — pricing endpoints disabled.",
  );
  warnedAboutMissingSlug = true;
}

export function fetchConstructionDiscounts(): Promise<ConstructionDiscountRow[]> {
  const slug = resolveSlug();
  if (!slug) {
    warnSlugOnce();
    return Promise.resolve(EMPTY_DISCOUNTS);
  }

  const existing = discountsCache.get(slug);
  if (existing) return existing;

  const baseUrl = resolveBaseUrl().replace(/\/$/, "");
  const url =
    `${baseUrl}/public/pricing/construction-discounts/` +
    `?company=${encodeURIComponent(slug)}`;

  const promise = (async () => {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`fetchConstructionDiscounts: HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as ConstructionDiscountRow[];
    return Array.isArray(json) ? json : [];
  })().catch((err: unknown) => {
    discountsCache.delete(slug);
    throw err;
  });

  discountsCache.set(slug, promise);
  return promise;
}

export function fetchPricingConfig(): Promise<Record<string, string>> {
  const slug = resolveSlug();
  if (!slug) {
    warnSlugOnce();
    return Promise.resolve(EMPTY_CONFIG);
  }

  const existing = configCache.get(slug);
  if (existing) return existing;

  const baseUrl = resolveBaseUrl().replace(/\/$/, "");
  const url =
    `${baseUrl}/public/pricing/config/` +
    `?company=${encodeURIComponent(slug)}`;

  const promise = (async () => {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`fetchPricingConfig: HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as Record<string, string>;
    return json && typeof json === "object" ? json : {};
  })().catch((err: unknown) => {
    configCache.delete(slug);
    throw err;
  });

  configCache.set(slug, promise);
  return promise;
}

export function __resetPricingCacheForTests(): void {
  discountsCache.clear();
  configCache.clear();
  warnedAboutMissingSlug = false;
}
