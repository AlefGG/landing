const NOMINATIM = "https://nominatim.openstreetmap.org";
const ALMATY_VIEWBOX = "76.75,43.35,77.10,43.15";
const CONTACT_EMAIL = "info@eko-resurs.kz";

export type GeocodeResult = {
  displayName: string;
  lat: number;
  lng: number;
};

// F-006 — Nominatim ranks "улица X N" purely on token overlap, so
// "Алматы Абая 150" returns "150, улица Мамбетова" first because the
// numeric token wins. We post-filter results to keep only those whose
// `display_name` actually contains the user's longest alphabetic
// keyword. Real fix is to migrate to 2GIS/Yandex for KZ-aware ranking;
// this is a sub-30-line stopgap that drops the obvious nonsense from
// the dropdown without adding a third-party SDK.
function extractKeyword(query: string): string | null {
  const tokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
  // Drop common qualifiers the user typed but Nominatim does not need
  // (and which would over-match generic streets if we required them
  // in the result). Also drop the city itself — every result has
  // "Алматы" in display_name, so it carries no discriminative power.
  const STOPWORDS = new Set([
    "улица", "ул", "проспект", "пр", "пр-т", "проспекта",
    "дом", "д", "квартира", "кв", "корпус", "к",
    "алматы", "almaty", "город", "г",
  ]);
  const candidates = tokens.filter(
    (t) => !/^\d+$/.test(t) && !STOPWORDS.has(t) && t.length >= 3,
  );
  if (candidates.length === 0) return null;
  // The longest token is most likely the street name (e.g. "абая",
  // "сатпаева", "толе би" — first/last word). Multi-word streets
  // ("толе би") get re-ranked correctly because the first word still
  // bubbles up; we accept a small false-negative rate over false-
  // positives, since false-positives are what the audit caught.
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  if (query.trim().length < 3) return [];
  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "10");
  url.searchParams.set("countrycodes", "kz");
  url.searchParams.set("viewbox", ALMATY_VIEWBOX);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("accept-language", "ru");
  url.searchParams.set("email", CONTACT_EMAIL);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  const all = data.map((d) => ({
    displayName: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));

  // F-006: re-rank by keyword presence. If the user typed "Абая 150",
  // surface results whose displayName contains "абая" first; keep the
  // rest as fallback so we never collapse to an empty dropdown when
  // the keyword is misspelled or transliterated.
  const keyword = extractKeyword(query);
  if (!keyword) return all.slice(0, 5);
  const matching: GeocodeResult[] = [];
  const other: GeocodeResult[] = [];
  for (const r of all) {
    if (r.displayName.toLowerCase().includes(keyword)) {
      matching.push(r);
    } else {
      other.push(r);
    }
  }
  return [...matching, ...other].slice(0, 5);
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = new URL(`${NOMINATIM}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "ru");
  url.searchParams.set("email", CONTACT_EMAIL);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}
