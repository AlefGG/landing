import { describe, expect, it } from "vitest";
import { deliveryLabel } from "./deliveryLabel";
import type { DeliveryPreview } from "../services/deliveryService";

const tFake = (key: string, params?: Record<string, unknown>): string => {
  if (key === "delivery.zone") return `ZONE:${params?.name}`;
  if (key === "delivery.routing") return `ROUTE:${params?.km}`;
  return key;
};

function preview(overrides: Partial<DeliveryPreview>): DeliveryPreview {
  return {
    warehouse: { id: 1, name: "W", lat: 0, lon: 0 },
    distanceKm: 0,
    durationMin: 0,
    deliveryFee: 0,
    routeGeometry: null,
    deliverySource: "routing",
    deliveryZone: null,
    ...overrides,
  };
}

describe("deliveryLabel", () => {
  it("returns empty string when preview is null", () => {
    expect(deliveryLabel(null, tFake)).toBe("");
  });

  it("returns the zone label when source is zone and zone is present", () => {
    const p = preview({
      deliverySource: "zone",
      deliveryZone: { id: 1, name: "Центр", price: 5000 },
    });
    expect(deliveryLabel(p, tFake)).toBe("ZONE:Центр");
  });

  it("falls back to routing when source is zone but zone object is missing", () => {
    const p = preview({ deliverySource: "zone", deliveryZone: null, distanceKm: 12.34 });
    expect(deliveryLabel(p, tFake)).toBe("ROUTE:12.3");
  });

  it("formats distance with one decimal in routing branch", () => {
    const p = preview({ deliverySource: "routing", distanceKm: 7.0 });
    expect(deliveryLabel(p, tFake)).toBe("ROUTE:7.0");
  });
});
