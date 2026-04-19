import { fetchJson, ApiError } from "./apiClient";

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "awaiting_accountant_review"
  | "processing"
  | "assigned"
  | "completed"
  | "cancelled";

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
// Phase 4 — list + detail, real API.
// ---------------------------------------------------------------------------

type RawListItem = {
  order_number: string;
  service_type: BackendServiceType;
  status: OrderStatus;
  total_price: string;
  payment_channel: PaymentChannel;
  created_at: string;
  date_start: string | null;
  date_end: string | null;
  address_text: string;
};

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

export async function listMyOrders(params?: {
  status?: OrderStatus;
}): Promise<OrderListItem[]> {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
  const raw = await fetchJson<RawListItem[]>(`/orders/my/${qs}`);
  return raw.map(mapListItem);
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
  pump_frequency: number | null;
  cleaning_frequency: number | null;
  trucks_required: number | null;
  cleaners_required: number | null;
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
};

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
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
