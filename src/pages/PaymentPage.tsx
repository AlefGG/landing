import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import KaspiPayment from "../components/payment/KaspiPayment";
import LegalPayment from "../components/payment/LegalPayment";
import { PageError } from "../components/ui";
import { normalizeError, type NormalizedError } from "../services/errors";
import { getOrder, type OrderDTO } from "../services/ordersService";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; order: OrderDTO }
  | { status: "missing" }
  | { status: "error"; error: NormalizedError };

function deriveServiceLabelKey(serviceType: OrderDTO["service_type"]): string {
  switch (serviceType) {
    case "sale":
      return "payment.serviceLabels.sale";
    case "sanitation":
      return "payment.serviceLabels.sanitation";
    default:
      return "payment.serviceLabels.rental";
  }
}

export default function PaymentPage() {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setState({ status: "missing" });
      return;
    }
    setState({ status: "loading" });
    try {
      const order = await getOrder(orderId);
      setState(order ? { status: "ready", order } : { status: "missing" });
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.kind === "notFound") {
        setState({ status: "missing" });
        return;
      }
      if (normalized.kind === "auth") {
        const redirect = encodeURIComponent(location.pathname);
        navigate(`/login?redirect=${redirect}`);
        return;
      }
      setState({ status: "error", error: normalized });
    }
  }, [orderId, location.pathname, navigate]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  if (state.status === "loading") {
    return <div className="min-h-[50vh]" aria-hidden="true" />;
  }

  if (state.status === "missing") {
    return <Navigate to="/" replace />;
  }

  if (state.status === "error") {
    return (
      <div className="max-w-[1216px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <PageError
          error={state.error}
          overrideKey="errors.payment.loadFail"
          onRetry={loadOrder}
          backHref="/account/orders"
        />
      </div>
    );
  }

  const { order } = state;
  const title = t("payment.title");
  const serviceLabel = t(deriveServiceLabelKey(order.service_type) as "payment.serviceLabels.sale");
  const amount = Number(order.total_price);
  const formattedAmount = amount.toLocaleString("ru-RU");

  return (
    <div className="bg-white overflow-x-clip">
      <Seo
        pageKey="sale"
        titleOverride={`${title} — ${t("meta.brandName")}`}
        descriptionOverride={title}
      />

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
            <Link to="/" className="text-[#1F5F8F] underline leading-4 text-xs px-[10px] py-[8px]">
              {t("success.breadcrumbHome")}
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-500" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-neutral-500 leading-4 text-xs px-[10px] py-[8px]">
              {t("payment.breadcrumb")}
            </span>
          </nav>

          <h1 className="font-heading text-[28px] lg:text-[56px] font-extrabold leading-[32px] lg:leading-[56px] text-cta-main">
            {title}
          </h1>
        </div>
      </section>

      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-8 font-body text-base lg:text-xl leading-6 text-neutral-700">
          <span>
            {t("payment.orderNumber")}{" "}
            <strong className="text-neutral-900">#{order.order_number}</strong>
          </span>
          <span>
            {t("payment.service")}:{" "}
            <strong className="text-neutral-900">{serviceLabel}</strong>
          </span>
          <span>
            {t("payment.amount")}:{" "}
            <strong className="text-cta-main">{formattedAmount} ₸</strong>
          </span>
        </div>
      </section>

      <section className="max-w-[1216px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {order.payment_channel === "legal" ? (
          <LegalPayment
            orderId={order.order_number}
            serviceType={order.service_type}
          />
        ) : (
          <KaspiPayment
            orderId={order.order_number}
            amount={amount}
            serviceType={order.service_type}
          />
        )}
      </section>
    </div>
  );
}
