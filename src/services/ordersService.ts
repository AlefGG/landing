/**
 * Orders service.
 *
 * Mock implementation: returns a fixed list of 4 orders covering all statuses.
 * Replace both functions with real fetch calls once these endpoints land:
 *   GET /api/orders/my/      — list current user's orders
 *   GET /api/orders/{id}/    — detail
 */

export type OrderStatus =
  | "pending"
  | "processing"
  | "assigned"
  | "completed"
  | "cancelled";

export type OrderService = "rental" | "sanitation" | "sale";

export type OrderListItem = {
  id: string;
  service: OrderService;
  status: OrderStatus;
  createdAt: string;
  amount: number;
  summaryKey: string;
};

export type OrderDetail = OrderListItem & {
  contactType: "individual" | "legal";
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  paymentReceiptUrl?: string;
};

const MOCK_DELAY_MS = 200;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  {
    id: "ord-2",
    service: "sanitation",
    status: "processing",
    createdAt: daysAgo(3),
    amount: 420000,
    summaryKey: "sanitation",
    contactType: "legal",
    contactName: "ТОО Строймаркет",
    contactPhone: "+77272501212",
    contactEmail: "office@stroymarket.kz",
    address: "Алматы, Тажибаева 155",
  },
  {
    id: "ord-3",
    service: "rental",
    status: "completed",
    createdAt: daysAgo(45),
    amount: 2250000,
    summaryKey: "rentalConstruction",
    contactType: "legal",
    contactName: "ТОО BI Group",
    contactPhone: "+77017778899",
    contactEmail: "projects@bi.kz",
    address: "Алматы, ЖК Акбулак",
    paymentReceiptUrl: "/assets/mocks/receipt.pdf",
  },
  {
    id: "ord-4",
    service: "sale",
    status: "cancelled",
    createdAt: daysAgo(10),
    amount: 1100000,
    summaryKey: "saleLux2",
    contactType: "individual",
    contactName: "Мурат Ержанов",
    contactPhone: "+77079990011",
  },
];

export async function listMyOrders(): Promise<OrderListItem[]> {
  await wait(MOCK_DELAY_MS);
  return MOCK_ORDERS.map((o) => ({
    id: o.id,
    service: o.service,
    status: o.status,
    createdAt: o.createdAt,
    amount: o.amount,
    summaryKey: o.summaryKey,
  }));
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  await wait(MOCK_DELAY_MS);
  const found = MOCK_ORDERS.find((o) => o.id === id);
  return found ? { ...found } : null;
}
