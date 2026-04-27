import type { PreviewResponse } from "../services/orderService";

export type DiscountDisplay = {
  priceBefore: number;
  percent: number;
};

// Maps PR-4 backend preview fields to a UI-shape suitable for the
// strikethrough total + percent badge. Returns null whenever the badge
// must stay hidden: no preview yet, fields absent (older backend),
// zero discount, or defensive guards (NaN, before <= total).
export function computeDiscountDisplay(
  preview: PreviewResponse | null,
): DiscountDisplay | null {
  if (!preview) return null;
  const { total, total_before_discount, discount_amount, discount_percent } = preview;
  if (total_before_discount == null || discount_amount == null || discount_percent == null) {
    return null;
  }
  const before = Number(total_before_discount);
  const after = Number(total);
  const amount = Number(discount_amount);
  const percent = Number(discount_percent);
  if (
    !Number.isFinite(before) ||
    !Number.isFinite(after) ||
    !Number.isFinite(amount) ||
    !Number.isFinite(percent)
  ) {
    return null;
  }
  if (amount <= 0) return null;
  if (before <= after) return null;
  return { priceBefore: before, percent: Math.round(percent) };
}
