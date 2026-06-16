import { describe, expect, it } from "vitest";
import { deriveInstallDate } from "./eventDate";
import {
  validateInstallDismantle,
  type InstallDismantleValue,
} from "./installDismantleValidator";
import type { TimeSlotDTO } from "../services/timeSlotsService";

function ymd(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

describe("deriveInstallDate", () => {
  it("returns null when no event date", () => {
    expect(deriveInstallDate(null)).toBeNull();
  });

  it("derives install = event − 1 day (mid-month)", () => {
    expect(ymd(deriveInstallDate(new Date(2026, 6, 10)))).toBe("2026-07-09");
  });

  it("rolls back across a month boundary (event 2026-03-01 → install 2026-02-28)", () => {
    expect(ymd(deriveInstallDate(new Date(2026, 2, 1)))).toBe("2026-02-28");
  });

  it("rolls back across a year boundary (event 2026-01-01 → install 2025-12-31)", () => {
    expect(ymd(deriveInstallDate(new Date(2026, 0, 1)))).toBe("2025-12-31");
  });

  it("handles a leap-year February (event 2028-03-01 → install 2028-02-29)", () => {
    expect(ymd(deriveInstallDate(new Date(2028, 2, 1)))).toBe("2028-02-29");
  });

  it("normalises to local midnight regardless of input time", () => {
    const d = deriveInstallDate(new Date(2026, 6, 10, 23, 59, 30));
    expect(d?.getHours()).toBe(0);
    expect(d?.getMinutes()).toBe(0);
    expect(ymd(d)).toBe("2026-07-09");
  });
});

describe("derived install date feeds validateInstallDismantle", () => {
  const slots: TimeSlotDTO[] = [
    { id: 1, name: "Утро", start_time: "08:00:00", end_time: "12:00:00", order: 1, is_active: true },
    { id: 2, name: "День", start_time: "12:00:00", end_time: "16:00:00", order: 2, is_active: true },
    { id: 3, name: "Вечер", start_time: "16:00:00", end_time: "20:00:00", order: 3, is_active: true },
  ];
  const NOW = new Date(2026, 4, 1, 10, 0, 0); // today = 2026-05-01

  function mkValue(o: Partial<InstallDismantleValue>): InstallDismantleValue {
    return {
      installDate: o.installDate ?? null,
      installSlotId: o.installSlotId ?? null,
      dismantleDate: o.dismantleDate ?? null,
      dismantleSlotId: o.dismantleSlotId ?? null,
    };
  }

  it("earliest pickable event (today+2) → derived install = today+1 → validator accepts", () => {
    // The unchanged validator's EVENT branch requires install ≥ today+1, so
    // the earliest event the UI may offer is today+2 (install = event−1 =
    // today+1). The UI enforces min = today+2 on the event-date picker.
    const eventDate = new Date(2026, 4, 3); // today + 2
    const installDate = deriveInstallDate(eventDate);
    expect(ymd(installDate)).toBe("2026-05-02"); // == today + 1 (validator min)

    const r = validateInstallDismantle(
      mkValue({
        installDate,
        installSlotId: 1,
        dismantleDate: new Date(2026, 4, 3),
        dismantleSlotId: 3,
      }),
      slots,
      "rental_event",
      NOW,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      // The contract is unchanged: payload still carries install_date as the
      // derived (event − 1) date, in YYYY-MM-DD.
      expect(r.payload.install_date).toBe("2026-05-02");
    }
  });

  it("event further out → derived install carried into payload as event−1", () => {
    const eventDate = new Date(2026, 6, 10);
    const installDate = deriveInstallDate(eventDate);
    const r = validateInstallDismantle(
      mkValue({
        installDate,
        installSlotId: 1,
        dismantleDate: new Date(2026, 6, 12),
        dismantleSlotId: 2,
      }),
      slots,
      "rental_event",
      NOW,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.install_date).toBe("2026-07-09");
  });
});
