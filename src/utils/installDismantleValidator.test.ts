import { describe, expect, it } from "vitest";
import {
  validateInstallDismantle,
  type InstallDismantleValue,
} from "./installDismantleValidator";
import type { TimeSlotDTO } from "../services/timeSlotsService";

const slots: TimeSlotDTO[] = [
  { id: 1, name: "Утро", start_time: "08:00:00", end_time: "12:00:00", order: 1, is_active: true },
  { id: 2, name: "День", start_time: "12:00:00", end_time: "16:00:00", order: 2, is_active: true },
  { id: 3, name: "Вечер", start_time: "16:00:00", end_time: "20:00:00", order: 3, is_active: true },
];

const NOW = new Date(2026, 4, 1, 10, 0, 0);

function mkValue(overrides: Partial<InstallDismantleValue>): InstallDismantleValue {
  return {
    installDate: overrides.installDate ?? null,
    installSlotId: overrides.installSlotId ?? null,
    dismantleDate: overrides.dismantleDate ?? null,
    dismantleSlotId: overrides.dismantleSlotId ?? null,
  };
}

describe("validateInstallDismantle", () => {
  it("rejects incomplete state", () => {
    const r = validateInstallDismantle(mkValue({}), slots, "rental_event", NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("incomplete");
  });

  it("rejects install_date in the past for event (must be ≥ today + 1)", () => {
    const r = validateInstallDismantle(
      mkValue({
        installDate: new Date(2026, 4, 1),
        installSlotId: 1,
        dismantleDate: new Date(2026, 4, 3),
        dismantleSlotId: 2,
      }),
      slots, "rental_event", NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("installInPast");
  });

  it("accepts install_date == today for emergency", () => {
    const r = validateInstallDismantle(
      mkValue({
        installDate: new Date(2026, 4, 1),
        installSlotId: 1,
        dismantleDate: new Date(2026, 4, 1),
        dismantleSlotId: 3,
      }),
      slots, "rental_emergency", NOW,
    );
    expect(r.ok).toBe(true);
  });

  it("rejects dismantle_date before install_date", () => {
    const r = validateInstallDismantle(
      mkValue({
        installDate: new Date(2026, 4, 5),
        installSlotId: 1,
        dismantleDate: new Date(2026, 4, 4),
        dismantleSlotId: 2,
      }),
      slots, "rental_event", NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("dismantleBeforeInstall");
  });

  it("rejects window > 90 days", () => {
    const r = validateInstallDismantle(
      mkValue({
        installDate: new Date(2026, 4, 2),
        installSlotId: 1,
        dismantleDate: new Date(2026, 7, 5),
        dismantleSlotId: 2,
      }),
      slots, "rental_event", NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("windowExceeds90");
  });

  it("rejects same-day overlap (dismantle slot starts before install slot ends)", () => {
    const r = validateInstallDismantle(
      mkValue({
        installDate: new Date(2026, 4, 2),
        installSlotId: 2,
        dismantleDate: new Date(2026, 4, 2),
        dismantleSlotId: 1,
      }),
      slots, "rental_event", NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("sameDaySlotOverlap");
  });

  it("accepts same-day non-overlap", () => {
    const r = validateInstallDismantle(
      mkValue({
        installDate: new Date(2026, 4, 2),
        installSlotId: 1,
        dismantleDate: new Date(2026, 4, 2),
        dismantleSlotId: 3,
      }),
      slots, "rental_event", NOW,
    );
    expect(r.ok).toBe(true);
  });

  it("returns YYYY-MM-DD strings in payload", () => {
    const r = validateInstallDismantle(
      mkValue({
        installDate: new Date(2026, 4, 2),
        installSlotId: 1,
        dismantleDate: new Date(2026, 4, 4),
        dismantleSlotId: 3,
      }),
      slots, "rental_event", NOW,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.install_date).toBe("2026-05-02");
      expect(r.payload.dismantle_date).toBe("2026-05-04");
      expect(r.payload.install_slot).toBe(1);
      expect(r.payload.dismantle_slot).toBe(3);
    }
  });
});
