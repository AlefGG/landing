import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui";
import OrderStatusBadge from "../components/account/OrderStatusBadge";
import {
  cancelOrder,
  getOrderDetail,
  type BackendServiceType,
  type OrderDetail,
} from "../services/ordersService";
import { formatAbsoluteDate } from "../utils/date";

type LoadState =
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "ok"; order: OrderDetail };

function serviceLabelKey(t: BackendServiceType): string {
  switch (t) {
    case "rental_event":
      return "auth.orders.serviceType.rental_event";
    case "rental_emergency":
      return "auth.orders.serviceType.rental_emergency";
    case "rental_construction":
      return "auth.orders.serviceType.rental_construction";
    case "sanitation":
      return "auth.orders.serviceType.sanitation";
    case "sale":
      return "auth.orders.serviceType.sale";
  }
}

export default function OrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = "" } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const reload = async () => {
    const o = await getOrderDetail(id);
    setState(o ? { kind: "ok", order: o } : { kind: "notFound" });
  };

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    getOrderDetail(id).then((o) => {
      if (cancelled) return;
      setState(o ? { kind: "ok", order: o } : { kind: "notFound" });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onCancel = async () => {
    const confirmed = window.confirm(
      t("auth.orders.detail.cancelConfirm", {
        defaultValue: "Отменить заявку? Действие нельзя отменить.",
      }),
    );
    if (!confirmed) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(id);
      await reload();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : String(err));
    } finally {
      setCancelling(false);
    }
  };

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
  const amountFmt = order.amount.toLocaleString("ru-RU");
  const canPay = order.status === "pending_payment" && !order.hasPaymentReceipt;

  return (
    <div data-testid={`order-detail-${order.orderNumber}`}>
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
            #{order.orderNumber}
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="font-body text-sm text-neutral-500">
          {t(serviceLabelKey(order.serviceType) as "auth.orders.serviceType.rental_event")}
        </div>
      </div>

      <Section title={t("auth.orders.detail.section.details")}>
        <Row label={t("auth.orders.detail.date")}>
          {formatAbsoluteDate(order.createdAt, i18n.language)}
        </Row>
        {order.dateStart && (
          <Row label={t("auth.orders.detail.dateStart")}>
            {formatAbsoluteDate(order.dateStart, i18n.language)}
          </Row>
        )}
        {order.dateEnd && (
          <Row label={t("auth.orders.detail.dateEnd")}>
            {formatAbsoluteDate(order.dateEnd, i18n.language)}
          </Row>
        )}
        {order.addressText && (
          <Row label={t("auth.orders.detail.address")}>{order.addressText}</Row>
        )}
        {order.items.length > 0 && (
          <Row label={t("auth.orders.detail.items")}>
            <ul className="flex flex-col gap-1">
              {order.items.map((item, idx) => (
                <li key={idx} className="font-body text-sm text-neutral-900">
                  {(item.cabin_type_name ?? item.equipment_name ?? "—") +
                    " × " +
                    item.quantity}
                </li>
              ))}
            </ul>
          </Row>
        )}
        {order.addresses.length > 0 && (
          <Row label={t("auth.orders.detail.addresses")}>
            <ul className="flex flex-col gap-1">
              {order.addresses.map((a, idx) => (
                <li key={idx} className="font-body text-sm text-neutral-900">
                  {a.address_text} · {a.quantity} шт
                </li>
              ))}
            </ul>
          </Row>
        )}
        {order.sanitation && (
          <Row label={t("auth.orders.detail.sanitation")}>
            {order.sanitation.num_toilets} шт ·{" "}
            {order.sanitation.pump_frequency ?? 1}/нед откачка ·{" "}
            {order.sanitation.cleaning_frequency ?? 1}/нед уборка
          </Row>
        )}
        <Row label={t("auth.orders.detail.amount")}>
          {t("auth.orders.card.amount", { amount: amountFmt })}
        </Row>
      </Section>

      <Section title={t("auth.orders.detail.section.payment")}>
        {order.hasPaymentReceipt ? (
          <span className="font-body text-sm text-neutral-600">
            {t("auth.orders.detail.payReceipted")}
          </span>
        ) : canPay ? (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-body text-sm text-neutral-600">
              {t("auth.orders.detail.payPending")}
            </span>
            <Button
              variant="cta"
              size="md"
              href={`/orders/${order.orderNumber}/pay`}
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

      {order.assignedExecutor && (
        <Section
          title={t("auth.orders.detail.section.executor", {
            defaultValue: "Исполнитель",
          })}
        >
          <Row label={t("auth.orders.detail.executorName", { defaultValue: "ФИО" })}>
            {order.assignedExecutor.full_name}
          </Row>
          <Row label={t("auth.orders.detail.executorPhone", { defaultValue: "Телефон" })}>
            <a
              href={`tel:${order.assignedExecutor.phone}`}
              className="text-cta-main hover:underline"
            >
              {order.assignedExecutor.phone}
            </a>
          </Row>
        </Section>
      )}

      {order.attachments.length > 0 && (
        <Section
          title={t("auth.orders.detail.section.attachments", {
            defaultValue: "Файлы",
          })}
        >
          <ul className="flex flex-col gap-2">
            {order.attachments.map((a, idx) => (
              <li key={idx} className="font-body text-sm text-neutral-900">
                {a.url ? (
                  <a href={a.url} className="text-cta-main hover:underline" target="_blank" rel="noreferrer">
                    {a.label}
                  </a>
                ) : (
                  <span>{a.label}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title={t("auth.orders.detail.section.timeline", {
          defaultValue: "История статусов",
        })}
      >
        <ul className="flex flex-col gap-2" data-testid="order-timeline">
          {order.statusHistory.map((ev, idx) => (
            <li key={idx} className="flex flex-col lg:flex-row lg:gap-4 lg:items-baseline">
              <span className="font-body text-xs text-neutral-500 lg:w-40">
                {ev.at ? formatAbsoluteDate(ev.at, i18n.language) : "—"}
              </span>
              <span className="font-body text-sm text-neutral-900">
                {t(`auth.orders.status.${ev.status}`, { defaultValue: ev.status })}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {order.canCancel && (
        <Section
          title={t("auth.orders.detail.section.cancel", { defaultValue: "Отмена" })}
        >
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="md"
              onClick={onCancel}
              disabled={cancelling}
              data-testid="order-cancel-action"
            >
              {cancelling
                ? t("auth.orders.detail.cancelLoading", { defaultValue: "Отменяем…" })
                : t("auth.orders.detail.cancelAction", { defaultValue: "Отменить заявку" })}
            </Button>
            {cancelError && (
              <span className="font-body text-sm text-red-600">{cancelError}</span>
            )}
          </div>
        </Section>
      )}
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
