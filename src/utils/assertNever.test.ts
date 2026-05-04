import { describe, it, expect } from "vitest";
import { assertNever } from "./assertNever";

describe("assertNever", () => {
  it("throws with discriminant value + context in the message", () => {
    expect(() => assertNever("rental_corporate" as never, "serviceLabelKey")).toThrow(
      /serviceLabelKey/,
    );
    expect(() => assertNever("rental_corporate" as never, "serviceLabelKey")).toThrow(
      /rental_corporate/,
    );
  });

  it("throws without context when none provided", () => {
    expect(() => assertNever("X" as never)).toThrow(/Unhandled discriminant/);
  });
});
