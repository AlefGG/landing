import { z } from "zod";
import { fetchJson, fetchValidated, ApiError } from "./apiClient";

export const OrderStatusSchema = z.enum([
  "draft",
  "pending_payment",
  "awaiting_accountant_review",
  "processing",
  "assigned",
  "completed",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const BackendServiceTypeSchema = z.enum([
  "rental_event",
  "rental_emergency",
  "rental_construction",
  "sanitation",
  "sale",
]);
export type BackendServiceType = z.infer<typeof BackendServiceTypeSchema>;

export const PaymentChannelSchema = z.enum(["individual", "legal"]);
export type PaymentChannel = z.infer<typeof PaymentChannelSchema>;

export type OrderService = "rental" | "sanitation" | "sale";

// FE-TS-002 — pairs with backend/apps/orders/serializers.py::OrderSerializer
export const OrderDTOSchema = z
  .object({
    order_number: z.string(),
    service_type: BackendServiceTypeSchema,
    status: OrderStatusSchema,
    total_price: z.string(),
    payment_channel: PaymentChannelSchema,
    created_at: z.string(),
    pricing_snapshot: z.record(z.string(), z.unknown()).nullable(),
    has_id_document_front: z.boolean(),
    has_id_document_back: z.boolean(),
  })
  .describe("OrderDTOSchema");

export type OrderDTO = z.infer<typeof OrderDTOSchema>;

export async function getOrder(orderNumber: string): Promise<OrderDTO | null> {
  try {
    return await fetchValidated(`/orders/${orderNumber}/`, OrderDTOSchema);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Phase 4 — list + detail, real API.
// ---------------------------------------------------------------------------

const RawListItemSchema = z
  .object({
    order_number: z.string(),
    service_type: BackendServiceTypeSchema,
    status: OrderStatusSchema,
    total_price: z.string(),
    payment_channel: PaymentChannelSchema,
    created_at: z.string(),
    date_start: z.string().nullable(),
    date_end: z.string().nullable(),
    address_text: z.string(),
  })
  .describe("RawListItemSchema");
type RawListItem = z.infer<typeof RawListItemSchema>;

export type OrderListItem = {
  orderNumber: string;
  serviceType: BackendServiceType;
  service: OrderService;
  status: OrderStatus;
  paymentChannel: PaymentChannel;
  createdAt: string;
  dateStart: string | null;
  dateEnd: string | null;
  addressText: string;
  amount: number;
};

export function mapServiceType(t: BackendServiceType): OrderService {
  if (t === "sanitation") return "sanitation";
  if (t === "sale") return "sale";
  return "rental";
}

function mapListItem(raw: RawListItem): OrderListItem {
  return {
    orderNumber: raw.order_number,
    serviceType: raw.service_type,
    service: mapServiceType(raw.service_type),
    status: raw.status,
    paymentChannel: raw.payment_channel,
    createdAt: raw.created_at,
    dateStart: raw.date_start,
    dateEnd: raw.date_end,
    addressText: raw.address_text,
    amount: Number(raw.total_price),
  };
}

function PaginatedSchema<T extends z.ZodType<unknown>>(item: T) {
  return z
    .object({
      count: z.number(),
      next: z.string().nullable(),
      previous: z.string().nullable(),
      results: z.array(item),
    })
    .describe("PaginatedSchema");
}

const MyOrdersPageSchema = PaginatedSchema(RawListItemSchema).describe(
  "MyOrdersPageSchema",
);

export type MyOrdersPage = {
  count: number;
  hasMore: boolean;
  nextUrl: string | null;
  results: OrderListItem[];
};

export async function listMyOrders(
  params?: {
    status?: OrderStatus;
    page?: number;
    pageSize?: number;
  },
  opts?: { signal?: AbortSignal },
): Promise<MyOrdersPage> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.pageSize) search.set("page_size", String(params.pageSize));
  const qs = search.toString();
  const raw = await fetchValidated(
    `/orders/my/${qs ? `?${qs}` : ""}`,
    MyOrdersPageSchema,
    opts?.signal ? { signal: opts.signal } : undefined,
  );
  return {
    count: raw.count,
    hasMore: raw.next !== null,
    nextUrl: raw.next,
    results: raw.results.map(mapListItem),
  };
}

type RawDetailItem = {
  cabin_type_slug: string | null;
  cabin_type_name: string | null;
  equipment_id: number | null;
  equipment_name: string | null;
  quantity: number;
};

type RawDetailAddress = {
  address_text: string;
  lat: number;
  lon: number;
  quantity: number;
  distance_km: string | null;
  delivery_fee: string | null;
};

type RawDetailSanitation = {
  num_toilets: number;
  trucks_required: number | null;
  cleaners_required: number | null;
};

type RawAssignedExecutor = {
  full_name: string;
  phone: string;
};

type RawAttachment = {
  label: string;
  name: string;
  url: string | null;
};

type RawStatusEvent = {
  status: OrderStatus;
  at: string | null;
};

type RawDetail = {
  order_number: string;
  service_type: BackendServiceType;
  status: OrderStatus;
  total_price: string;
  payment_channel: PaymentChannel;
  created_at: string;
  date_start: string | null;
  date_end: string | null;
  address_text: string;
  address_lat: number | null;
  address_lon: number | null;
  distance_km: string | null;
  duration_min: number | null;
  delivery_fee: string | null;
  logistics_type: "standard" | "express";
  pricing_snapshot: Record<string, unknown> | null;
  items: RawDetailItem[];
  addresses: RawDetailAddress[];
  sanitation: RawDetailSanitation | null;
  has_payment_receipt: boolean;
  assigned_executor?: RawAssignedExecutor | null;
  attachments?: RawAttachment[];
  status_history?: RawStatusEvent[];
  can_cancel?: boolean;
};

export type OrderDetail = {
  orderNumber: string;
  serviceType: BackendServiceType;
  service: OrderService;
  status: OrderStatus;
  paymentChannel: PaymentChannel;
  createdAt: string;
  dateStart: string | null;
  dateEnd: string | null;
  addressText: string;
  amount: number;
  deliveryFee: number | null;
  logisticsType: "standard" | "express";
  items: RawDetailItem[];
  addresses: RawDetailAddress[];
  sanitation: RawDetailSanitation | null;
  hasPaymentReceipt: boolean;
  pricingSnapshot: Record<string, unknown> | null;
  assignedExecutor: RawAssignedExecutor | null;
  attachments: RawAttachment[];
  statusHistory: RawStatusEvent[];
  canCancel: boolean;
};

// TODO(FE-TS-002 wave-3b): migrate getOrderDetail to fetchValidated. The
// RawDetail shape is large (nested items / addresses / sanitation /
// assigned_executor / attachments / status_history); deferred to keep
// this PR's schema footprint focused on the high-blast list path.
export async function getOrderDetail(
  orderNumber: string,
): Promise<OrderDetail | null> {
  try {
    const raw = await fetchJson<RawDetail>(`/orders/${orderNumber}/`);
    return {
      orderNumber: raw.order_number,
      serviceType: raw.service_type,
      service: mapServiceType(raw.service_type),
      status: raw.status,
      paymentChannel: raw.payment_channel,
      createdAt: raw.created_at,
      dateStart: raw.date_start,
      dateEnd: raw.date_end,
      addressText: raw.address_text,
      amount: Number(raw.total_price),
      deliveryFee: raw.delivery_fee !== null ? Number(raw.delivery_fee) : null,
      logisticsType: raw.logistics_type,
      items: raw.items,
      addresses: raw.addresses,
      sanitation: raw.sanitation,
      hasPaymentReceipt: raw.has_payment_receipt,
      pricingSnapshot: raw.pricing_snapshot,
      assignedExecutor: raw.assigned_executor ?? null,
      attachments: raw.attachments ?? [],
      statusHistory: raw.status_history ?? [],
      canCancel: raw.can_cancel ?? false,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function cancelOrder(orderNumber: string): Promise<void> {
  await fetchJson(`/orders/${orderNumber}/cancel/`, { method: "POST" });
}
