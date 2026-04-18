import { useTranslation } from "react-i18next";
import type { OrderStatus } from "../../services/ordersService";

const CLASSES: Record<OrderStatus, string> = {
  pending: "bg-neutral-100 text-neutral-700",
  processing: "bg-blue-50 text-blue-700",
  assigned: "bg-yellow-50 text-yellow-800",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

type Props = {
  status: OrderStatus;
};

export default function OrderStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  return (
    <span
      data-testid={`order-status-${status}`}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-body ${CLASSES[status]}`}
    >
      {t(`auth.orders.status.${status}`)}
    </span>
  );
}
