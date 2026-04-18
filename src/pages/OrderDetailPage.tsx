import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui";
import OrderStatusBadge from "../components/account/OrderStatusBadge";
import {
  getOrder,
  type OrderDetail,
} from "../services/ordersService";
import { formatAbsoluteDate } from "../utils/date";
import { formatPhone } from "../components/wizards/shared/phoneFormat";

type LoadState =
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "ok"; order: OrderDetail };

export default function OrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = "" } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    getOrder(id).then((o) => {
      if (cancelled) return;
      setState(o ? { kind: "ok", order: o } : { kind: "notFound" });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === "loading") {
    return (
      <div className="font-body text-sm text-neutral-500" data-testid="order-loading">
        …
      </div>
    );
  }

  if (state.kind === "notFound") {
    return (
      <div
        className="rounded-[12px] border border-neutral-200 bg-white p-10 text-center"
        data-testid="order-not-found"
      >
        <p className="font-body text-base text-neutral-700 mb-4">
          {t("auth.orders.detail.notFound")}
        </p>
        <Link
          to="/account/orders"
          className="font-body text-sm font-semibold text-cta-main hover:underline"
        >
          {t("auth.orders.detail.notFoundBack")}
        </Link>
      </div>
    );
  }

  const { order } = state;
  const amountFmt = new Intl.NumberFormat(i18n.language).format(order.amount);
  const canPay = order.status === "pending" && !order.paymentReceiptUrl;

  return (
    <div data-testid={`order-detail-${order.id}`}>
      <Link
        to="/account/orders"
        className="inline-flex font-body text-sm text-neutral-600 hover:text-neutral-900 mb-4"
        data-testid="order-detail-back"
      >
        {t("auth.orders.detail.back")}
      </Link>

      <div className="rounded-[12px] border border-neutral-200 bg-white p-6 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg lg:text-xl font-semibold text-neutral-900">
            #{order.id}
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="font-body text-sm text-neutral-500">
          {t(`auth.orders.service.${order.service}`)}
        </div>
      </div>

      <Section title={t("auth.orders.detail.section.details")}>
        <Row label={t("auth.orders.detail.date")}>
          {formatAbsoluteDate(order.createdAt, i18n.language)}
        </Row>
        <Row label={t("auth.orders.detail.summary")}>
          {t(`auth.orders.summary.${order.summaryKey}`)}
        </Row>
        {order.address && (
          <Row label={t("auth.orders.detail.address")}>{order.address}</Row>
        )}
        <Row label={t("auth.orders.detail.amount")}>
          {t("auth.orders.card.amount", { amount: amountFmt })}
        </Row>
      </Section>

      <Section title={t("auth.orders.detail.section.contacts")}>
        <Row label={t("auth.orders.detail.contactType." + order.contactType)}>
          {order.contactName}
        </Row>
        <Row label={t("auth.profile.phone")}>{formatPhone(order.contactPhone)}</Row>
        {order.contactEmail && (
          <Row label={t("auth.profile.email")}>{order.contactEmail}</Row>
        )}
      </Section>

      <Section title={t("auth.orders.detail.section.payment")}>
        {order.paymentReceiptUrl ? (
          <a
            href={order.paymentReceiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm font-semibold text-cta-main hover:underline"
            data-testid="order-receipt-link"
          >
            {t("auth.orders.detail.payReceipt")}
          </a>
        ) : canPay ? (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-body text-sm text-neutral-600">
              {t("auth.orders.detail.payPending")}
            </span>
            <Button
              variant="cta"
              size="md"
              href={`/orders/${order.id}/pay`}
              data-testid="order-pay-action"
            >
              {t("auth.orders.detail.payAction")}
            </Button>
          </div>
        ) : (
          <span className="font-body text-sm text-neutral-500">
            {t("auth.orders.detail.payPending")}
          </span>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-neutral-200 bg-white p-6 mb-4">
      <h3 className="font-display text-base font-semibold text-neutral-900 mb-4">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 lg:flex-row lg:gap-4 lg:items-baseline">
      <span className="font-body text-xs text-neutral-500 lg:w-40">{label}</span>
      <span className="font-body text-sm text-neutral-900">{children}</span>
    </div>
  );
}
