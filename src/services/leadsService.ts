/**
 * Lead submission service.
 *
 * Mock implementation: logs to console and resolves after a short delay.
 * Replace the body of `createLead` with a real `fetch` to the Django backend
 * (e.g. `${import.meta.env.VITE_API_URL}/leads/`) once the endpoint is ready.
 */

export type ServiceKind = "rental" | "sanitation" | "sale";

export type ContactTypeKind = "individual" | "legal";

export type LeadPayload = {
  name: string;
  phone: string;
  service: ServiceKind;
  locale: string;
  source?: string;
  // TODO(backend): extend /leads/ endpoint to accept fields below
  email?: string;
  itemId?: string;
  count?: number;
  contactType?: ContactTypeKind;
  amount?: number;
};

export type OrderSummary = {
  orderId: string;
  service: ServiceKind;
  amount: number;
  contactType: ContactTypeKind;
  source?: string;
};

export type LeadResponse = {
  id: string;
  redirectTo: string;
  summary: OrderSummary;
};

export class LeadSubmissionError extends Error {
  override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LeadSubmissionError";
    this.cause = cause;
  }
}

const MOCK_DELAY_MS = 500;
const ORDER_STORAGE_PREFIX = "order-";

function storeOrderSummary(summary: OrderSummary): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `${ORDER_STORAGE_PREFIX}${summary.orderId}`,
      JSON.stringify(summary),
    );
  } catch {
    // sessionStorage may be unavailable (private mode, quota) — ignore silently
  }
}

export async function createLead(payload: LeadPayload): Promise<LeadResponse> {
  if (import.meta.env.DEV) {
    console.info("[leadsService:mock] createLead", payload);
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const orderId = `mock-${Date.now()}`;
  const summary: OrderSummary = {
    orderId,
    service: payload.service,
    amount: payload.amount ?? 125000,
    contactType: payload.contactType ?? "individual",
    source: payload.source,
  };
  storeOrderSummary(summary);

  return {
    id: orderId,
    redirectTo: `/orders/${orderId}/pay`,
    summary,
  };
}

// TODO(backend): replace with `GET /api/orders/{id}/` once endpoint lands.
export async function getOrderSummary(
  orderId: string,
): Promise<OrderSummary | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(
      `${ORDER_STORAGE_PREFIX}${orderId}`,
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrderSummary;
    if (parsed.orderId !== orderId) return null;
    return parsed;
  } catch {
    return null;
  }
}
