// BE-4: MONTHLY ("помесячное обслуживание") is hidden from the customer flow.
// Only ONE_TIME remains. The backend keeps MONTHLY models/admin, gated behind
// SANITATION_MONTHLY_ENABLED — re-widen this type to restore the customer path.
export type ServiceSubtype = "ONE_TIME";

export type SanitationSubtypeInput = {
  subtype: ServiceSubtype;
  hasPumping: boolean;
  hasWashing: boolean;
  // ONE_TIME inputs
  oneTimeDate: Date | null;
  oneTimeSlotId: number | null;
};

export type SanitationSubtypeReason =
  | "noOptionSelected"
  | "noDateSelected"
  | "noSlotSelected";

type CommonPayload = {
  has_pumping: boolean;
  has_washing: boolean;
};

export type SanitationSubtypePayload = CommonPayload & {
  service_type: "ONE_TIME";
  one_time_date: string;
  one_time_slot: number;
};

export type SanitationSubtypeResult =
  | { ok: true; payload: SanitationSubtypePayload }
  | { ok: false; reason: SanitationSubtypeReason };

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function validateServiceSubtype(
  input: SanitationSubtypeInput,
): SanitationSubtypeResult {
  if (!input.hasPumping && !input.hasWashing) {
    return { ok: false, reason: "noOptionSelected" };
  }

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
