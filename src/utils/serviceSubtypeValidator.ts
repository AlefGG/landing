export type ServiceSubtype = "ONE_TIME" | "MONTHLY";

export type SanitationSubtypeInput = {
  subtype: ServiceSubtype;
  hasPumping: boolean;
  hasWashing: boolean;
  // ONE_TIME inputs
  oneTimeDate: Date | null;
  oneTimeSlotId: number | null;
  // MONTHLY inputs
  servicePackageId: number | null;
  periodStart: Date | null;
  periodEnd: Date | null;
};

export type SanitationSubtypeReason =
  | "noOptionSelected"
  | "noDateSelected"
  | "noSlotSelected"
  | "noPackageSelected"
  | "noStart"
  | "noEnd"
  | "endBeforeStart"
  | "periodTooShort"
  | "periodTooLong";

type CommonPayload = {
  has_pumping: boolean;
  has_washing: boolean;
};

export type SanitationSubtypePayload =
  | (CommonPayload & {
      service_type: "ONE_TIME";
      one_time_date: string;
      one_time_slot: number;
    })
  | (CommonPayload & {
      service_type: "MONTHLY";
      service_package: number;
      period_start: string;
      period_end: string;
    });

export type SanitationSubtypeResult =
  | { ok: true; payload: SanitationSubtypePayload }
  | { ok: false; reason: SanitationSubtypeReason };

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function diffDays(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function validateServiceSubtype(
  input: SanitationSubtypeInput,
): SanitationSubtypeResult {
  if (!input.hasPumping && !input.hasWashing) {
    return { ok: false, reason: "noOptionSelected" };
  }

  if (input.subtype === "ONE_TIME") {
    if (!input.oneTimeDate) return { ok: false, reason: "noDateSelected" };
    if (input.oneTimeSlotId == null)
      return { ok: false, reason: "noSlotSelected" };
    return {
      ok: true,
      payload: {
        service_type: "ONE_TIME",
        has_pumping: input.hasPumping,
        has_washing: input.hasWashing,
        one_time_date: isoDate(input.oneTimeDate),
        one_time_slot: input.oneTimeSlotId,
      },
    };
  }

  // MONTHLY
  if (input.servicePackageId == null)
    return { ok: false, reason: "noPackageSelected" };
  if (!input.periodStart) return { ok: false, reason: "noStart" };
  if (!input.periodEnd) return { ok: false, reason: "noEnd" };
  const span = diffDays(input.periodStart, input.periodEnd);
  if (span < 0) return { ok: false, reason: "endBeforeStart" };
  if (span < 7) return { ok: false, reason: "periodTooShort" };
  if (span > 365) return { ok: false, reason: "periodTooLong" };
  return {
    ok: true,
    payload: {
      service_type: "MONTHLY",
      has_pumping: input.hasPumping,
      has_washing: input.hasWashing,
      service_package: input.servicePackageId,
      period_start: isoDate(input.periodStart),
      period_end: isoDate(input.periodEnd),
    },
  };
}

