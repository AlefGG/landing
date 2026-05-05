import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type ServiceKey = "rental" | "sanitation" | "sale";

function CheckBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div
        className="absolute inset-0 rounded-full blur-[16px] lg:blur-[24px]"
        style={{ background: "radial-gradient(circle, rgba(89,176,2,0.45) 0%, rgba(89,176,2,0) 70%)" }}
      />
      <div className="relative size-full rounded-full border-[3px] border-cta-main bg-white flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-1/2 h-1/2 text-cta-main"
          aria-hidden="true"
        >
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full py-4 lg:py-6 border-b border-neutral-200 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <span className="font-body text-base leading-6 text-neutral-600">{label}</span>
        <div className="font-body font-semibold text-base leading-6 text-neutral-700 text-right">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SuccessScreen() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const { status } = useAuth();

  const orderNumber = params.get("order");
  const serviceParam = (params.get("service") ?? "rental") as ServiceKey;
  const amountParam = params.get("amount");
  const dateParam = params.get("date");
  const typeParam = params.get("type") as "individual" | "legal" | null;
  const noteKey =
    typeParam === "legal"
      ? "success.noteLegal"
      : typeParam === "individual"
        ? "success.noteIndividual"
        : "success.note";

  const serviceLabel = useMemo(() => {
    const map: Record<ServiceKey, string> = {
      rental: t("wizard.rental.title"),
      sanitation: t("wizard.service.title"),
      sale: t("success.services.sale"),
    };
    return map[serviceParam] ?? map.rental;
  }, [serviceParam, t]);

  const formattedDate = useMemo(() => {
    const d = dateParam ? new Date(dateParam) : new Date();
    if (isNaN(d.getTime())) return dateParam ?? "";
    return d.toLocaleDateString(i18n.language === "kk" ? "kk-KZ" : "ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [dateParam, i18n.language]);

  const amount = amountParam ?? "125 000";

  if (!orderNumber) {
    // Direct hit (back button, refresh, stale share link). Redirect — never
    // render a placeholder confirmation that erodes trust right after the
    // conversion event.
    return (
      <Navigate
        to={status === "authenticated" ? "/account/orders" : "/"}
        replace
      />
    );
  }

  return (
    <div className="bg-white overflow-x-clip">
      {/* Hero */}
      <section className="relative h-[220px] lg:h-[336px]">
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
          <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-xs font-body mb-3 lg:mb-8">
            <Link to="/" className="text-link underline leading-4 text-xs px-[10px] py-[8px]">
              {t("success.breadcrumbHome")}
            </Link>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0 text-neutral-500"
              aria-hidden="true"
            >
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">
              {t("success.breadcrumb")}
            </span>
          </nav>

          <div className="flex flex-col items-center gap-4 lg:gap-10 mt-2 lg:mt-4">
            <CheckBadge className="size-[80px] lg:size-[136px]" />
            <h1 className="font-heading text-[24px] lg:text-[56px] font-extrabold leading-[24px] lg:leading-[56px] text-cta-main text-center">
              {t("success.title")}
            </h1>
          </div>
        </div>
      </section>

      {/* Subtitle */}
      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6 pb-6 lg:pb-12">
        <p className="font-body text-base lg:text-xl leading-6 text-neutral-900 text-center">
          {t("success.subtitle")}
        </p>
      </section>

      {/* Details */}
      <section className="max-w-[832px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col border-t border-neutral-200">
          <Row label={t("success.orderNumber")}>{`#${orderNumber}`}</Row>
          <Row label={t("success.service")}>{serviceLabel}</Row>
          <Row label={t("success.date")}>{formattedDate}</Row>
          <Row label={t("success.amount")}>
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <span className="font-body font-semibold text-base leading-6 text-neutral-700">
                {t("success.price")}
              </span>
              <span className="font-body font-semibold text-xl leading-6 text-cta-main">
                {amount}
              </span>
              <span className="font-body font-semibold text-base leading-6 text-neutral-700">
                {t("success.currency")}
              </span>
            </span>
          </Row>
          <Row label={t("success.status")}>
            <span className="text-cta-main">{t("success.statusProcessing")}</span>
          </Row>

          <div className="w-full py-4 lg:py-6">
            <p className="font-body text-sm leading-4 text-neutral-500">{t(noteKey)}</p>
          </div>

          {/* CTA */}
          <div className="flex justify-center pt-8 lg:pt-12 pb-16 lg:pb-[104px]">
            <Link
              to="/"
              className="flex items-center justify-between gap-4 bg-gradient-to-b from-[#3c4449] to-[#21272b] text-white font-body font-semibold text-base leading-6 rounded-[40px] pl-10 pr-8 py-3 w-full lg:w-[272px] max-w-[360px]"
            >
              <span>{t("success.toHome")}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 14L4 9l5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 9h10a6 6 0 016 6v2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
