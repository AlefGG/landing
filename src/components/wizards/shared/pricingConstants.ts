// TODO(backend): заменить хардкоды на данные из админки:
//   GET /api/pricing/express-surcharge/   → { rate: 0.15 }
//   GET /api/pricing/emergency-surcharge/ → { rate: 0.30 }
//   GET /api/pricing/construction-discounts/ → [{ months, discount }]

export const BASE_DAY_PRICE = 125000;

export const EXPRESS_SURCHARGE_RATE = 0.15;
export const EMERGENCY_SURCHARGE_RATE = 0.3;

export type ConstructionDiscountRow = { months: number; discount: number };

export const CONSTRUCTION_DISCOUNTS: readonly ConstructionDiscountRow[] = [
  { months: 1, discount: 0 },
  { months: 2, discount: 0.05 },
  { months: 3, discount: 0.1 },
  { months: 4, discount: 0.15 },
  { months: 5, discount: 0.2 },
  { months: 6, discount: 0.25 },
] as const;

export function getConstructionDiscount(months: number): number {
  return CONSTRUCTION_DISCOUNTS.find((r) => r.months === months)?.discount ?? 0;
}