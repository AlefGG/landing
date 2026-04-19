import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Seo from "../Seo";
import type { SaleItem } from "../../services/catalogService";

export default function SaleItemDetail({ item }: { item: SaleItem }) {
  const { t } = useTranslation();
  const name = item.name;

  const formattedPrice = item.price.toLocaleString("ru-RU");
  const buyClass =
    "flex items-center justify-between gap-4 bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base rounded-[40px] pl-10 pr-8 py-3 w-full lg:w-[272px]";

  return (
    <div className="bg-white overflow-x-clip">
      <Seo
        pageKey="sale"
        titleOverride={`${name} — ${t("meta.brandName")}`}
        descriptionOverride={item.description}
      />

      {/* Hero with extended breadcrumb */}
      <section className="relative h-[104px] lg:h-[176px]">
        <div
          className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[1216px] h-[712px] pointer-events-none"
          style={{ top: "-64px" }}
          aria-hidden="true"
        >
          <img src="/assets/images/wizard-hero-shape.svg" alt="" className="w-full h-full" />
        </div>
        <div
          className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#f1f1f1] to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-2 lg:mb-8">
            <Link to="/" className="text-[#2d84c1] underline leading-4 text-xs px-[10px] py-[8px]">
              {t("wizard.rental.breadcrumbHome")}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link to="/sale" className="text-[#2d84c1] underline leading-4 text-xs px-[10px] py-[8px]">
              {t("catalog.sale.backToCatalog")}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">{name}</span>
          </nav>

          <h1 className="font-heading text-[32px] lg:text-[56px] font-extrabold leading-[32px] lg:leading-[56px] text-cta-main">
            {name}
          </h1>
        </div>

        <p
          className="hidden lg:block absolute right-[230px] top-[100px] font-heading text-[144px] font-extrabold leading-[56px] pointer-events-none select-none"
          style={{
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(89, 176, 2, 0.15)",
          }}
          aria-hidden="true"
        >
          {name}
        </p>
      </section>

      {/* Content */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="flex items-center justify-center bg-white rounded-3xl p-6">
            <img
              src={item.image}
              alt={name}
              className="h-[300px] lg:h-[480px] w-auto object-contain"
            />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 font-body text-xs ${
                  item.inStock
                    ? "bg-cta-main/10 text-cta-main"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {item.inStock ? t("catalog.sale.inStock") : t("catalog.sale.outOfStock")}
              </span>
            </div>

            <p className="font-body text-base lg:text-xl leading-6 lg:leading-7 text-neutral-700">
              {item.description}
            </p>

            <div className="flex items-center gap-2">
              <span className="font-body text-xl text-neutral-900">
                {t("catalog.sale.priceFrom", { price: formattedPrice })}
              </span>
            </div>

            {item.inStock ? (
              <Link to={`/sale/${item.id}/checkout`} className={buyClass}>
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
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={`${buyClass} opacity-60 cursor-not-allowed`}
              >
                <span>{t("catalog.sale.outOfStock")}</span>
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
