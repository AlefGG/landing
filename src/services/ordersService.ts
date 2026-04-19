import { fetchJson, ApiError } from "./apiClient";

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "awaiting_accountant_review"
  | "processing"
  | "assigned"
  | "completed"
  | "cancelled"
  // legacy frontend statuses kept for Phase 4 mock compatibility:
  | "pending";

export type BackendServiceType =
  | "rental_event"
  | "rental_emergency"
  | "rental_construction"
  | "sanitation"
  | "sale";

export type PaymentChannel = "individual" | "legal";

export type OrderService = "rental" | "sanitation" | "sale";

export type OrderDTO = {
  order_number: string;
  service_type: BackendServiceType;
  status: OrderStatus;
  total_price: string;
  payment_channel: PaymentChannel;
  created_at: string;
  pricing_snapshot: Record<string, unknown> | null;
};

export async function getOrder(orderNumber: string): Promise<OrderDTO | null> {
  try {
    return await fetchJson<OrderDTO>(`/orders/${orderNumber}/`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Phase 4 — list + detail. Kept as mocks until that phase lands.
// ---------------------------------------------------------------------------

export type OrderListItem = {
  id: string;
  service: OrderService;
  status: OrderStatus;
  createdAt: string;
  amount: number;
  summaryKey: string;
};

export type OrderDetail = OrderListItem & {
  contactType: PaymentChannel;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  paymentReceiptUrl?: string;
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const MOCK_ORDERS: OrderDetail[] = [
  {
    id: "ord-1",
    service: "rental",
    status: "pending",
    createdAt: daysAgo(1),
    amount: 185000,
    summaryKey: "rentalEvent",
    contactType: "individual",
    contactName: "Асель Нурланова",
    contactPhone: "+77011112233",
    contactEmail: "asel@example.com",
    address: "Алматы, пр. Достык 132",
  },
];

export async function listMyOrders(): Promise<OrderListItem[]> {
  return MOCK_ORDERS.map((o) => ({
    id: o.id,
    service: o.service,
    status: o.status,
    createdAt: o.createdAt,
    amount: o.amount,
    summaryKey: o.summaryKey,
  }));
}

export async function getOrderDetailMock(id: string): Promise<OrderDetail | null> {
  const found = MOCK_ORDERS.find((o) => o.id === id);
  return found ? { ...found } : null;
}
