import { fetchJson, ApiError } from "./apiClient";

export type DeliveryServiceType = "rental" | "construction" | "sanitation" | "sale";

export type DeliveryPreview = {
  warehouse: { id: number; name: string; lat: number; lon: number };
  distanceKm: number;
  durationMin: number;
  deliveryFee: number;
  routeGeometry: Array<[number, number]> | null;
  deliverySource: "zone" | "routing";
  deliveryZone: { id: number; name: string; price: number } | null;
};

type RawDeliveryPreview = {
  warehouse: { id: number; name: string; lat: string; lon: string };
  distance_km: string;
  duration_min: number;
  delivery_fee: string;
  route_geometry: Array<[number, number]> | null;
  delivery_source?: "zone" | "routing";
  delivery_zone?: { id: number; name: string; price: string } | null;
};

export async function previewDelivery(
  serviceType: DeliveryServiceType,
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<DeliveryPreview | null> {
  try {
    const data = await fetchJson<RawDeliveryPreview>("/orders/delivery/preview/", {
      method: "POST",
      body: JSON.stringify({ service_type: serviceType, lat, lon }),
      signal,
    });
    return {
      warehouse: {
        id: data.warehouse.id,
        name: data.warehouse.name,
        lat: Number(data.warehouse.lat),
        lon: Number(data.warehouse.lon),
      },
      distanceKm: Number(data.distance_km),
      durationMin: data.duration_min,
      deliveryFee: Number(data.delivery_fee),
      routeGeometry: data.route_geometry,
      deliverySource: data.delivery_source ?? "routing",
      deliveryZone: data.delivery_zone
        ? {
            id: data.delivery_zone.id,
            name: data.delivery_zone.name,
            price: Number(data.delivery_zone.price),
          }
        : null,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}
