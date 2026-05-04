import { useTranslation } from "react-i18next";
import { CONSTRUCTION_DISCOUNTS } from "./pricingConstants";
import type { ConstructionDiscountRow } from "../../../services/pricingService";

export default function ConstructionDiscountTable({
  selectedMonths,
  onSelect,
  // F-010: callers pass the live tier list from useConstructionDiscounts;
  // when omitted we fall back to the hardcoded constants so existing
  // call-sites (and tests) keep working without a wider refactor.
  rows = CONSTRUCTION_DISCOUNTS,
}: {
  selectedMonths: number;
  onSelect?: (months: number) => void;
  rows?: readonly ConstructionDiscountRow[];
}) {
  const { t } = useTranslation();
  const ck = "wizard.construction" as const;

  return (
    <div
      className="mt-4 rounded-2xl bg-white border border-neutral-200 overflow-hidden"
      data-testid="construction-discount-table"
    >
      <div className="grid grid-cols-2 px-4 py-3 bg-neutral-50 font-body text-sm leading-4 text-neutral-500">
        <span>{t(`${ck}.discountTable.headerPeriod`)}</span>
        <span className="text-right">{t(`${ck}.discountTable.headerDiscount`)}</span>
      </div>
      <ul className="divide-y divide-neutral-100">
        {rows.map(({ months, discount }) => {
          const selected = months === selectedMonths;
          const percent = Math.round(discount * 100);
          return (
            <li key={months}>
              <button
                type="button"
                onClick={() => onSelect?.(months)}
                aria-pressed={selected}
                data-testid={`discount-row-${months}`}
                className={`grid grid-cols-2 w-full px-4 py-3 text-left transition-colors ${
                  selected
                    ? "bg-cta-main/10 text-neutral-900"
                    : "hover:bg-neutral-50 text-neutral-700"
                }`}
              >
                <span className="font-body text-base leading-6">
                  {t(`${ck}.monthsValue`, { count: months })}
                </span>
                <span
                  className={`font-body text-base leading-6 text-right ${
                    selected ? "font-semibold text-cta-main" : ""
                  }`}
                >
                  {percent === 0 ? "—" : `−${percent}%`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
