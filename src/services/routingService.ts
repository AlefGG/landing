const OSRM = "https://router.project-osrm.org";

export type LatLng = { lat: number; lng: number };

export type TripResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: Array<[number, number]>;
  waypointOrder: number[];
};

export async function getTrip(
  start: LatLng,
  points: LatLng[],
  signal?: AbortSignal,
): Promise<TripResult | null> {
  if (points.length === 0) return null;
  const coords = [start, ...points].map((p) => `${p.lng},${p.lat}`).join(";");
  const url = new URL(`${OSRM}/trip/v1/driving/${coords}`);
  url.searchParams.set("source", "first");
  url.searchParams.set("destination", "last");
  url.searchParams.set("roundtrip", "false");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.code !== "Ok" || !data.trips?.[0]) return null;

  const trip = data.trips[0];
  const geometry = (trip.geometry.coordinates as Array<[number, number]>).map(
    ([lng, lat]) => [lat, lng] as [number, number],
  );
  const waypointOrder = (data.waypoints as Array<{ waypoint_index: number }>)
    .map((w, i) => ({ input: i, order: w.waypoint_index }))
    .sort((a, b) => a.order - b.order)
    .map((x) => x.input);

  return {
    distanceMeters: trip.distance,
    durationSeconds: trip.duration,
    geometry,
    waypointOrder,
  };
}
