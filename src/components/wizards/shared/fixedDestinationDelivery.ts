import { normalizeError, type NormalizedError } from "../../../services/errors";
import type { PreviewResponse } from "../../../services/orderService";
import type { FixedDeliveryLine } from "./AddressStep";

// BE-2: the backend's hard block for over-fleet orders is the exact string
// «Превышен доступный парк. Свяжитесь с менеджером.», raised as a non-field
// DRF ValidationError (top-level array) on BOTH preview and create. We match
// it by the stable «Превышен доступный парк» prefix so a localized/reworded
// tail doesn't break detection.
const FLEET_EXCEEDED_MARKER = "Превышен доступный парк";

function isNormalizedError(x: unknown): x is NormalizedError {
  return (
    typeof x === "object" &&
    x !== null &&
    "kind" in x &&
    "status" in x
  );
}

/**
 * True when an error is the fleet-exceeded block. Accepts both a raw error
 * (preview path → Error) and an already-NormalizedError (submit path →
 * useOrderSubmit.submitError). Used to raise the red banner and keep the
 * Next/submit button disabled.
 */
export function isFleetExceededError(
  err: unknown | NormalizedError | null,
): boolean {
  if (!err) return false;
  const normalized = isNormalizedError(err) ? err : normalizeError(err);
  return (
    normalized.kind === "validation" &&
    typeof normalized.detail === "string" &&
    normalized.detail.includes(FLEET_EXCEEDED_MARKER)
  );
}

/**
 * Derive the wizard-level flat-logistics line from a rental preview response,
 * or null when the preview did not price via a fixed destination.
 *
 * The fee comes from `pricing_snapshot.trace.delivery_fee` (the already-
 * computed logistics with multiplier + surcharge applied), per the BE-1
 * contract. `delivery_source === "fixed_destination"` gates it.
 */
export function fixedDeliveryFromPreview(
  preview: PreviewResponse | null,
  destinationName: string | null,
): FixedDeliveryLine | null {
  if (!preview || preview.delivery_source !== "fixed_destination") return null;
  const snap = preview.pricing_snapshot as
    | { trace?: { delivery_fee?: unknown } }
    | undefined;
  const raw = snap?.trace?.delivery_fee;
  const fee = typeof raw === "string" ? Number(raw) : Number(raw ?? NaN);
  if (!Number.isFinite(fee)) return null;
  return { fee, destinationName: destinationName ?? "" };
}
