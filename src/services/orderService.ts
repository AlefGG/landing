import { fetchJson, ApiError } from "./apiClient";

export type PaymentChannel = "individual" | "legal";
export type LogisticsType = "standard" | "express";
export type RentalServiceType = "rental_event" | "rental_emergency";

export type OrderItemInput = { cabin_type: number; quantity: number };
export type SaleItemInput = { equipment_id: number; quantity: number };
export type OrderAddressInput = {
  address_text: string;
  lat: number;
  lon: number;
  quantity: number;
};

export type RentalOrderPayload = {
  service_type: RentalServiceType;
  // Legacy: kept optional for emergency rollback. New wizard payloads
  // omit these and use install/dismantle instead — backend (PR-2)
  // mirrors them into date_start/date_end via Order.save().
  date_start?: string;
  date_end?: string;
  install_date?: string;
  install_slot?: number;
  dismantle_date?: string;
  dismantle_slot?: number;
  install_consent?: boolean;
  address_lat: number;
  address_lon: number;
  address_text?: string;
  logistics_type: LogisticsType;
  payment_channel: PaymentChannel;
  items: OrderItemInput[];
};

export type ConstructionOrderPayload = {
  months: number;
  start_date: string;
  logistics_type: LogisticsType;
  payment_channel: PaymentChannel;
  addresses: OrderAddressInput[];
};

export type SanitationOrderPayload = {
  address_lat: number;
  address_lon: number;
  address_text?: string;
  num_toilets: number;
  payment_channel: PaymentChannel;
  service_type: "ONE_TIME" | "MONTHLY";
  has_pumping: boolean;
  has_washing: boolean;
  // ONE_TIME-only:
  one_time_date?: string;
  one_time_slot?: number;
  // MONTHLY-only:
  service_package?: number;
  period_start?: string;
  period_end?: string;
};

export type SaleOrderPayload = {
  address_lat: number;
  address_lon: number;
  address_text?: string;
  payment_channel: PaymentChannel;
  items: SaleItemInput[];
};

export type OrderResponse = {
  order_number: string;
  service_type: string;
  status: string;
  total_price: string;
  payment_channel: PaymentChannel;
  created_at: string;
  pricing_snapshot: Record<string, unknown>;
};

export type PreviewResponse = {
  total: string;
  pricing_snapshot: Record<string, unknown>;
  total_before_discount?: string;
  discount_amount?: string;
  discount_percent?: string;
};

export type PreviewKind = "rental" | "construction" | "sanitation" | "sale";

export class OrderValidationError extends Error {
  readonly body: unknown;
  constructor(message: string, body: unknown) {
    super(message);
    this.name = "OrderValidationError";
    this.body = body;
  }
}

function post<TPayload, TResponse>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  return fetchJson<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch((err) => {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
      const message =
        (err.body && typeof err.body === "object" && "detail" in err.body
          ? String((err.body as { detail: unknown }).detail)
          : undefined) ?? "Order validation failed";
      throw new OrderValidationError(message, err.body);
    }
    throw err;
  });
}

export function createRentalOrder(
  payload: RentalOrderPayload,
): Promise<OrderResponse> {
  return post("/orders/rental/", payload);
}

export function createConstructionOrder(
  payload: ConstructionOrderPayload,
): Promise<OrderResponse> {
  return post("/orders/construction/", payload);
}

export function createSanitationOrder(
  payload: SanitationOrderPayload,
): Promise<OrderResponse> {
  return post("/orders/sanitation/", payload);
}

export function createSaleOrder(
  payload: SaleOrderPayload,
): Promise<OrderResponse> {
  return post("/orders/sale/", payload);
}

export function previewRentalOrder(
  payload: RentalOrderPayload,
): Promise<PreviewResponse> {
  return post("/orders/rental/preview/", payload);
}

export function previewConstructionOrder(
  payload: ConstructionOrderPayload,
): Promise<PreviewResponse> {
  return post("/orders/construction/preview/", payload);
}

export function previewSanitationOrder(
  payload: SanitationOrderPayload,
): Promise<PreviewResponse> {
  return post("/orders/sanitation/preview/", payload);
}

export function previewSaleOrder(
  payload: SaleOrderPayload,
): Promise<PreviewResponse> {
  return post("/orders/sale/preview/", payload);
}
