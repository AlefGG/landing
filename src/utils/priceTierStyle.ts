import type { ZoneFeature, ZonesFeatureCollection } from "../services/zonesService";

export type PolygonStyle = {
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
};

const BRAND_GREEN = "#59b002";
const TIER_CHEAP = "#22c55e";
const TIER_MID = "#f59e0b";
const TIER_PREMIUM = "#ef4444";

export function priceTierStyle(
  collection: ZonesFeatureCollection,
  feature: ZoneFeature,
): PolygonStyle {
  const prices = collection.features
    .map((f) => Number(f.properties.price))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  if (prices.length <= 1) {
    return { color: BRAND_GREEN, fillColor: BRAND_GREEN, fillOpacity: 0.18, weight: 1 };
  }

  const p = Number(feature.properties.price);
  if (prices.length === 2) {
    const color = p <= prices[0]! ? TIER_CHEAP : TIER_PREMIUM;
    return { color, fillColor: color, fillOpacity: 0.18, weight: 1 };
  }

  const t1 = prices[Math.floor(prices.length / 3)]!;
  const t2 = prices[Math.floor((prices.length * 2) / 3)]!;
  const color = p <= t1 ? TIER_CHEAP : p <= t2 ? TIER_MID : TIER_PREMIUM;
  return { color, fillColor: color, fillOpacity: 0.18, weight: 1 };
}
