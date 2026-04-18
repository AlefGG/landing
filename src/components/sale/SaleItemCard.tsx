import { useTranslation } from "react-i18next";
import type { SaleItem } from "../../services/catalogService";

export default function SaleItemCard({ item }: { item: SaleItem }) {
  const { t } = useTranslation();

  const formattedPrice = item.price.toLocaleString("ru-RU");

  return (
    <article className="flex flex-col gap-4 bg-white rounded-3xl p-6 transition-shadow hover:shadow-md h-full">
      <div className="flex items-center justify-center">
        <img
          src={item.image}
          alt={t(item.nameKey)}
          className="h-[200px] w-auto object-contain"
        />
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-2xl font-extrabold leading-7 text-neutral-900">
            {t(item.nameKey)}
          </h2>
          <span
            className={`shrink-0 rounded-full px-3 py-1 font-body text-xs ${
              item.inStock
                ? "bg-cta-main/10 text-cta-main"
                : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {item.inStock ? t("catalog.sale.inStock") : t("catalog.sale.outOfStock")}
          </span>
        </div>

        <p className="font-body text-sm leading-5 text-neutral-600">
          {t(item.descriptionKey)}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="font-body text-base text-neutral-500">
            {t("catalog.sale.priceFrom", { price: formattedPrice })}
          </span>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-4 bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base rounded-[40px] pl-10 pr-8 py-3 w-full"
      >
        <span>{t("catalog.sale.buyButton")}</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9.51 4.23l8.56 4.28c3.84 1.92 3.84 5.06 0 6.98l-8.56 4.28c-5.76 2.88-8.11.52-5.23-5.23l.87-1.73a1.88 1.88 0 000-1.63l-.87-1.74C1.4 3.71 3.76 1.35 9.51 4.23z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.44 12h5.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </article>
  );
}
