import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { OrderListItem } from "../../services/ordersService";
import { formatRelativeDate } from "../../utils/date";
import OrderStatusBadge from "./OrderStatusBadge";

type Props = {
  order: OrderListItem;
};

export default function OrderCard({ order }: Props) {
  const { t, i18n } = useTranslation();
  const amountFmt = order.amount.toLocaleString("ru-RU");

  return (
    <Link
      to={`/account/orders/${order.id}`}
      className="block rounded-[12px] border border-neutral-200 bg-white p-5 hover:border-cta-main hover:shadow-sm transition-all"
      data-testid={`order-card-${order.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-body text-xs text-neutral-500">#{order.id}</span>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="font-body text-sm font-semibold text-neutral-900 mb-1">
        {t(`auth.orders.service.${order.service}`)}
      </div>
      <div className="font-body text-sm text-neutral-700 mb-3">
        {t(`auth.orders.summary.${order.summaryKey}`)}
      </div>
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
