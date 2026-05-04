import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type {
  BackendServiceType,
  OrderListItem,
} from "../../services/ordersService";
import { formatRelativeDate } from "../../utils/date";
import { assertNever } from "../../utils/assertNever";
import OrderStatusBadge from "./OrderStatusBadge";

type Props = {
  order: OrderListItem;
};

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
    default:
      return assertNever(t, "OrderCard.serviceLabelKey");
  }
}

export default function OrderCard({ order }: Props) {
  const { t, i18n } = useTranslation();
  const amountFmt = order.amount.toLocaleString("ru-RU");

  return (
    <Link
      to={`/account/orders/${order.orderNumber}`}
      className="block rounded-[12px] border border-neutral-200 bg-white p-5 hover:border-cta-main hover:shadow-sm transition-all"
      data-testid={`order-card-${order.orderNumber}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-body text-xs text-neutral-500">
          #{order.orderNumber}
        </span>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="font-body text-sm font-semibold text-neutral-900 mb-1">
        {t(serviceLabelKey(order.serviceType) as "auth.orders.serviceType.rental_event")}
      </div>
      {order.addressText && (
        <div className="font-body text-sm text-neutral-700 mb-3 line-clamp-2">
          {order.addressText}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="font-body text-xs text-neutral-500">
          {formatRelativeDate(order.createdAt, i18n.language)}
        </span>
        <span className="font-body text-base font-semibold text-neutral-900">
          {t("auth.orders.card.amount", { amount: amountFmt })}
        </span>
      </div>
    </Link>
  );
}
