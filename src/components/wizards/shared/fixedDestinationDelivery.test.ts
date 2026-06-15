import { describe, expect, it } from "vitest";
import {
  isFleetExceededError,
  fixedDeliveryFromPreview,
} from "./fixedDestinationDelivery";
import { OrderValidationError } from "../../../services/orderService";
import type { PreviewResponse } from "../../../services/orderService";
import { ApiError } from "../../../services/apiClient";

const FLEET_MSG = "Превышен доступный парк. Свяжитесь с менеджером.";

describe("isFleetExceededError", () => {
  it("returns false for null/undefined", () => {
    expect(isFleetExceededError(null)).toBe(false);
    expect(isFleetExceededError(undefined)).toBe(false);
  });

  it("detects the fleet block from a preview OrderValidationError (array body)", () => {
    // Mirrors how orderService.post wraps a 400 whose body is a bare DRF
    // non-field error list: ["Превышен доступный парк. ..."].
    const err = new OrderValidationError("Order validation failed", [FLEET_MSG]);
    expect(isFleetExceededError(err)).toBe(true);
  });

  it("detects the fleet block from a raw ApiError with array body", () => {
    const err = new ApiError(400, "bad", [FLEET_MSG]);
    expect(isFleetExceededError(err)).toBe(true);
  });

  it("detects the fleet block from an already-NormalizedError (submit path)", () => {
    const normalized = {
      kind: "validation" as const,
      status: 400,
      detail: FLEET_MSG,
    };
    expect(isFleetExceededError(normalized)).toBe(true);
  });

  it("does NOT match an unrelated validation error", () => {
    const err = new OrderValidationError("nope", { items: ["Тип не найден"] });
    expect(isFleetExceededError(err)).toBe(false);
  });
});

function previewWith(overrides: Partial<PreviewResponse>): PreviewResponse {
  return {
    total: "300000.00",
    pricing_snapshot: {},
    ...overrides,
  };
}

describe("fixedDeliveryFromPreview", () => {
  it("returns null when preview is null", () => {
    expect(fixedDeliveryFromPreview(null, "X")).toBeNull();
  });

  it("returns null when delivery_source is not fixed_destination", () => {
    const p = previewWith({ delivery_source: "zone" });
    expect(fixedDeliveryFromPreview(p, "X")).toBeNull();
  });

  it("reads the flat fee from pricing_snapshot.trace.delivery_fee", () => {
    const p = previewWith({
      delivery_source: "fixed_destination",
      pricing_snapshot: { trace: { delivery_fee: "200000.00" } },
    });
    expect(fixedDeliveryFromPreview(p, "Алматы–Кольсай")).toEqual({
      fee: 200000,
      destinationName: "Алматы–Кольсай",
    });
  });

  it("returns null when the trace fee is missing/non-numeric", () => {
    const p = previewWith({
      delivery_source: "fixed_destination",
      pricing_snapshot: { trace: {} },
    });
    expect(fixedDeliveryFromPreview(p, "X")).toBeNull();
  });

  it("tolerates a null destination name", () => {
    const p = previewWith({
      delivery_source: "fixed_destination",
      pricing_snapshot: { trace: { delivery_fee: "100000.00" } },
    });
    expect(fixedDeliveryFromPreview(p, null)).toEqual({
      fee: 100000,
      destinationName: "",
    });
  });
});
