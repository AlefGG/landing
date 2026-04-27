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

export function fetchPublicTimeSlots(): Promise<TimeSlotDTO[]> {
  const slug = resolveSlug();
  if (!slug) {
    if (!warnedAboutMissingSlug) {
      // eslint-disable-next-line no-console
      console.warn(
        "VITE_LANDING_COMPANY_SLUG is not set — time-slots disabled.",
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
    `${baseUrl}/public/time-slots/` +
    `?company=${encodeURIComponent(slug)}`;

  const promise = (async () => {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`fetchPublicTimeSlots: HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as TimeSlotDTO[];
    return Array.isArray(json) ? json : [];
  })().catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });

  cache.set(key, promise);
  return promise;
}

export function __resetTimeSlotsCacheForTests(): void {
  cache.clear();
  warnedAboutMissingSlug = false;
}
