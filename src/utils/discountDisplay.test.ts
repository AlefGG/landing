import { describe, it, expect } from "vitest";
import { computeDiscountDisplay } from "./discountDisplay";
import type { PreviewResponse } from "../services/orderService";

const make = (over: Partial<PreviewResponse>): PreviewResponse => ({
  total: "100000",
  pricing_snapshot: {},
  ...over,
});

describe("computeDiscountDisplay", () => {
  it("returns null when preview is null", () => {
    expect(computeDiscountDisplay(null)).toBeNull();
  });

  it("returns null when discount fields are missing", () => {
    expect(computeDiscountDisplay(make({ total: "100000" }))).toBeNull();
  });

  it("returns null when discount_amount is zero", () => {
    expect(
      computeDiscountDisplay(
        make({
          total: "100000",
          total_before_discount: "100000",
          discount_amount: "0.00",
          discount_percent: "0.00",
        }),
      ),
    ).toBeNull();
  });

  it("returns null when total_before_discount equals total", () => {
    expect(
      computeDiscountDisplay(
        make({
          total: "100000",
          total_before_discount: "100000",
          discount_amount: "5",
          discount_percent: "5.00",
        }),
      ),
    ).toBeNull();
  });

  it("returns display data when discount > 0", () => {
    expect(
      computeDiscountDisplay(
        make({
          total: "106250",
          total_before_discount: "125000",
          discount_amount: "18750",
          discount_percent: "15.00",
        }),
      ),
    ).toEqual({ priceBefore: 125000, percent: 15 });
  });

  it("rounds discount_percent to nearest integer", () => {
    expect(
      computeDiscountDisplay(
        make({
          total: "950",
          total_before_discount: "1000",
          discount_amount: "50",
          discount_percent: "5.49",
        }),
      ),
    ).toEqual({ priceBefore: 1000, percent: 5 });
  });

  it("returns null on malformed numbers", () => {
    expect(
      computeDiscountDisplay(
        make({
          total: "100000",
          total_before_discount: "abc",
          discount_amount: "1",
          discount_percent: "5",
        }),
      ),
    ).toBeNull();
  });

  it("returns null when before <= total (defensive)", () => {
    expect(
      computeDiscountDisplay(
        make({
          total: "100000",
          total_before_discount: "99999",
          discount_amount: "1",
          discount_percent: "1",
        }),
      ),
    ).toBeNull();
  });
});
