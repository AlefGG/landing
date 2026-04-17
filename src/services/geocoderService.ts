const NOMINATIM = "https://nominatim.openstreetmap.org";
const ALMATY_VIEWBOX = "76.75,43.35,77.10,43.15";
const CONTACT_EMAIL = "info@eko-resurs.kz";

export type GeocodeResult = {
  displayName: string;
  lat: number;
  lng: number;
};

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  if (query.trim().length < 3) return [];
  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "7");
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
  return data.map((d) => ({
    displayName: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
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
