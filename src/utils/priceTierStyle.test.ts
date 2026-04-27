import { describe, expect, it } from "vitest";
import { priceTierStyle } from "./priceTierStyle";
import type { ZoneFeature, ZonesFeatureCollection } from "../services/zonesService";

function fc(prices: number[]): ZonesFeatureCollection {
  return {
    type: "FeatureCollection",
    features: prices.map((p, i) => ({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: { id: i + 1, name: `Z${i + 1}`, price: String(p), priority: 0 },
    })) as ZoneFeature[],
  };
}

describe("priceTierStyle", () => {
  it("returns brand green when there is a single zone", () => {
    const collection = fc([5000]);
    const style = priceTierStyle(collection, collection.features[0]!);
    expect(style.color).toBe("#59b002");
    expect(style.fillColor).toBe("#59b002");
    expect(style.fillOpacity).toBeCloseTo(0.18);
    expect(style.weight).toBe(1);
  });

  it("uses three-tier coloring with multiple zones", () => {
    const collection = fc([1000, 5000, 12000, 25000, 60000]);
    const cheap = priceTierStyle(collection, collection.features[0]!);
    const mid = priceTierStyle(collection, collection.features[2]!);
    const premium = priceTierStyle(collection, collection.features[4]!);
    expect(cheap.color).toBe("#22c55e");
    expect(mid.color).toBe("#f59e0b");
    expect(premium.color).toBe("#ef4444");
  });

  it("treats two zones as cheap-vs-premium", () => {
    const collection = fc([1000, 9000]);
    const a = priceTierStyle(collection, collection.features[0]!);
    const b = priceTierStyle(collection, collection.features[1]!);
    expect(a.color).toBe("#22c55e");
    expect(b.color).toBe("#ef4444");
  });
});
