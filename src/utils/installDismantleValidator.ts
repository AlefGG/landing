import type { TimeSlotDTO } from "../services/timeSlotsService";

export type InstallDismantleValue = {
  installDate: Date | null;
  installSlotId: number | null;
  dismantleDate: Date | null;
  dismantleSlotId: number | null;
};

export type InstallDismantlePayload = {
  install_date: string;
  install_slot: number;
  dismantle_date: string;
  dismantle_slot: number;
};

export type ValidationReasonKey =
  | "incomplete"
  | "installInPast"
  | "dismantleBeforeInstall"
  | "windowExceeds90"
  | "sameDaySlotOverlap";

export type ValidatorResult =
  | { ok: true; payload: InstallDismantlePayload }
  | { ok: false; reason: ValidationReasonKey };

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_WINDOW_DAYS = 90;

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function timeToMinutes(hms: string): number {
  const [h, m] = hms.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function validateInstallDismantle(
  value: InstallDismantleValue,
  slots: TimeSlotDTO[],
  serviceType: "rental_event" | "rental_emergency",
  now: Date = new Date(),
): ValidatorResult {
  const { installDate, installSlotId, dismantleDate, dismantleSlotId } = value;
  if (
    !installDate ||
    !dismantleDate ||
    installSlotId == null ||
    dismantleSlotId == null
  ) {
    return { ok: false, reason: "incomplete" };
  }
  const installSlot = slots.find((s) => s.id === installSlotId);
  const dismantleSlot = slots.find((s) => s.id === dismantleSlotId);
  if (!installSlot || !dismantleSlot) {
    return { ok: false, reason: "incomplete" };
  }

  const today = startOfLocalDay(now);
  const minInstall = new Date(today);
  if (serviceType === "rental_event") {
    minInstall.setDate(minInstall.getDate() + 1);
  }
  const installDay = startOfLocalDay(installDate);
  if (installDay.getTime() < minInstall.getTime()) {
    return { ok: false, reason: "installInPast" };
  }

  const dismantleDay = startOfLocalDay(dismantleDate);
  if (dismantleDay.getTime() < installDay.getTime()) {
    return { ok: false, reason: "dismantleBeforeInstall" };
  }

  const windowDays = Math.round(
    (dismantleDay.getTime() - installDay.getTime()) / MS_PER_DAY,
  );
  if (windowDays > MAX_WINDOW_DAYS) {
    return { ok: false, reason: "windowExceeds90" };
  }

  if (installDay.getTime() === dismantleDay.getTime()) {
    if (
      timeToMinutes(dismantleSlot.start_time) <=
      timeToMinutes(installSlot.end_time)
    ) {
      return { ok: false, reason: "sameDaySlotOverlap" };
    }
  }

  return {
    ok: true,
    payload: {
      install_date: toYmd(installDate),
      install_slot: installSlot.id,
      dismantle_date: toYmd(dismantleDate),
      dismantle_slot: dismantleSlot.id,
    },
  };
}
