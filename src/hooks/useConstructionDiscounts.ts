/**
 * F-010: load construction discount tiers from /api/public/pricing/. Falls
 * back to the static CONSTRUCTION_DISCOUNTS table if the fetch fails or the
 * backend isn't seeded yet, so the wizard remains usable in either case.
 */
import { useEffect, useState } from "react";
import {
  fetchConstructionDiscounts,
  type ConstructionDiscountRow,
} from "../services/pricingService";
import { CONSTRUCTION_DISCOUNTS } from "../components/wizards/shared/pricingConstants";

const FALLBACK: ConstructionDiscountRow[] = CONSTRUCTION_DISCOUNTS.map((r) => ({
  months: r.months,
  discount: r.discount,
}));

type Result = {
  discounts: ConstructionDiscountRow[];
  loading: boolean;
};

export function useConstructionDiscounts(): Result {
  const [state, setState] = useState<Result>({
    discounts: FALLBACK,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    fetchConstructionDiscounts()
      .then((rows) => {
        if (cancelled) return;
        // Backend returned no rows (slug not configured / empty seed) → keep
        // the static fallback so the wizard still renders something.
        const discounts = rows.length > 0 ? rows : FALLBACK;
        setState({ discounts, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ discounts: FALLBACK, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
