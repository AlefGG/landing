// FE-6: UI-only derivation for the EVENT rental date step.
//
// The customer picks the EVENT date; the install date is auto-derived as
// (event date − 1 day) and shown LOCKED. The derived install date is what
// flows into the existing InstallDismantleValue / validator / payload — the
// backend contract is unchanged (it still receives install_date as today).
//
// Pure + side-effect-free so it is trivially unit-testable. Uses Date
// arithmetic that correctly rolls over month/year boundaries (e.g. event
// 2026-03-01 → install 2026-02-28; event 2026-01-01 → install 2025-12-31).

/**
 * Derive the locked install date for an EVENT order: the day before the event.
 * Returns a fresh Date at local midnight, or null when no event date is set.
 */
export function deriveInstallDate(eventDate: Date | null): Date | null {
  if (!eventDate) return null;
  const d = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
  );
  d.setDate(d.getDate() - 1);
  return d;
}
