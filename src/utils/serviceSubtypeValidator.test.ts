import { describe, expect, it } from "vitest";
import {
  validateServiceSubtype,
  type SanitationSubtypeInput,
} from "./serviceSubtypeValidator";

// BE-4: MONTHLY is hidden from the customer flow — only ONE_TIME validates here.
const base: SanitationSubtypeInput = {
  subtype: "ONE_TIME",
  hasPumping: true,
  hasWashing: false,
  oneTimeDate: new Date(2030, 0, 5),
  oneTimeSlotId: 7,
};

describe("validateServiceSubtype", () => {
  it("returns noOptionSelected when neither pumping nor washing", () => {
    const r = validateServiceSubtype({ ...base, hasPumping: false, hasWashing: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noOptionSelected");
  });

  it("ONE_TIME ok with date + slot + pumping", () => {
    const r = validateServiceSubtype(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload).toMatchObject({
        service_type: "ONE_TIME",
        has_pumping: true,
        has_washing: false,
        one_time_date: "2030-01-05",
        one_time_slot: 7,
      });
      expect(r.payload).not.toHaveProperty("period_start");
      expect(r.payload).not.toHaveProperty("service_package");
    }
  });

  it("ONE_TIME requires one_time_date", () => {
    const r = validateServiceSubtype({ ...base, oneTimeDate: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noDateSelected");
  });

  it("ONE_TIME requires one_time_slot", () => {
    const r = validateServiceSubtype({ ...base, oneTimeSlotId: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noSlotSelected");
  });
});
