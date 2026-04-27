import { describe, expect, it } from "vitest";
import {
  validateSanitationSubtype,
  type SanitationSubtypeInput,
} from "./sanitationSubtypeValidator";

const base: SanitationSubtypeInput = {
  subtype: "ONE_TIME",
  hasPumping: true,
  hasWashing: false,
  oneTimeDate: new Date(2030, 0, 5),
  oneTimeSlotId: 7,
  servicePackageId: null,
  periodStart: null,
  periodEnd: null,
};

describe("validateSanitationSubtype", () => {
  it("returns noOptionSelected when neither pumping nor washing", () => {
    const r = validateSanitationSubtype({ ...base, hasPumping: false, hasWashing: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noOptionSelected");
  });

  it("ONE_TIME ok with date + slot + pumping", () => {
    const r = validateSanitationSubtype(base);
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
    const r = validateSanitationSubtype({ ...base, oneTimeDate: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noDateSelected");
  });

  it("ONE_TIME requires one_time_slot", () => {
    const r = validateSanitationSubtype({ ...base, oneTimeSlotId: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noSlotSelected");
  });

  it("MONTHLY requires servicePackageId", () => {
    const r = validateSanitationSubtype({
      ...base,
      subtype: "MONTHLY",
      oneTimeDate: null,
      oneTimeSlotId: null,
      servicePackageId: null,
      periodStart: new Date(2030, 0, 1),
      periodEnd: new Date(2030, 0, 31),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("noPackageSelected");
  });

  it("MONTHLY ok with package + period in [7..365]", () => {
    const r = validateSanitationSubtype({
      ...base,
      subtype: "MONTHLY",
      oneTimeDate: null,
      oneTimeSlotId: null,
      servicePackageId: 42,
      periodStart: new Date(2030, 0, 1),
      periodEnd: new Date(2030, 0, 31),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload).toMatchObject({
        service_type: "MONTHLY",
        service_package: 42,
        period_start: "2030-01-01",
        period_end: "2030-01-31",
        has_pumping: true,
        has_washing: false,
      });
      expect(r.payload).not.toHaveProperty("one_time_date");
      expect(r.payload).not.toHaveProperty("one_time_slot");
    }
  });

  it("MONTHLY rejects period < 7 days", () => {
    const r = validateSanitationSubtype({
      ...base,
      subtype: "MONTHLY",
      oneTimeDate: null,
      oneTimeSlotId: null,
      servicePackageId: 1,
      periodStart: new Date(2030, 0, 1),
      periodEnd: new Date(2030, 0, 5),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("periodTooShort");
  });

  it("MONTHLY rejects period > 365 days", () => {
    const r = validateSanitationSubtype({
      ...base,
      subtype: "MONTHLY",
      oneTimeDate: null,
      oneTimeSlotId: null,
      servicePackageId: 1,
      periodStart: new Date(2030, 0, 1),
      periodEnd: new Date(2031, 1, 1),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("periodTooLong");
  });

  it("MONTHLY rejects end before start", () => {
    const r = validateSanitationSubtype({
      ...base,
      subtype: "MONTHLY",
      oneTimeDate: null,
      oneTimeSlotId: null,
      servicePackageId: 1,
      periodStart: new Date(2030, 0, 31),
      periodEnd: new Date(2030, 0, 1),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("endBeforeStart");
  });

  it("MONTHLY noStart / noEnd reasons", () => {
    const noStart = validateSanitationSubtype({
      ...base,
      subtype: "MONTHLY",
      servicePackageId: 1,
      periodStart: null,
      periodEnd: new Date(2030, 0, 31),
    });
    expect(noStart.ok).toBe(false);
    if (!noStart.ok) expect(noStart.reason).toBe("noStart");

    const noEnd = validateSanitationSubtype({
      ...base,
      subtype: "MONTHLY",
      servicePackageId: 1,
      periodStart: new Date(2030, 0, 1),
      periodEnd: null,
    });
    expect(noEnd.ok).toBe(false);
    if (!noEnd.ok) expect(noEnd.reason).toBe("noEnd");
  });
});
