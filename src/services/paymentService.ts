/**
 * Payment service (real backend, phase 5).
 *
 * ТЗ §4.1 — ручной процесс оплаты. Один upload endpoint для физ/юр,
 * бэк различает по order.payment_channel.
 *
 * Endpoints:
 *   POST /api/orders/<order_number>/pay/upload/    (multipart file) → 200 {detail, status}
 *   GET  /api/orders/<order_number>/pay/kaspi-qr/  → 200 {order_number, amount, qr_image_url, instruction}
 */

import { ApiError, fetchBlob, fetchJson } from "./apiClient";

export const ALLOWED_PAYMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_PAYMENT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export type PaymentValidationError = "invalidType" | "tooLarge";

export type PaymentUploadResponse = { detail: string; status: string };

export type KaspiQrResponse = {
  order_number: string;
  amount: string;
  qr_image_url: string;
  instruction: string;
};

export class PaymentUploadError extends Error {
  readonly code: PaymentValidationError | "uploadFailed" | "notConfigured";
  override readonly cause?: unknown;
  constructor(
    code: PaymentValidationError | "uploadFailed" | "notConfigured",
    cause?: unknown,
  ) {
    super(code);
    this.name = "PaymentUploadError";
    this.code = code;
    this.cause = cause;
  }
}

export function validatePaymentFile(file: File): PaymentValidationError | null {
  const allowed: readonly string[] = ALLOWED_PAYMENT_MIME;
  if (!allowed.includes(file.type)) return "invalidType";
  if (file.size > MAX_PAYMENT_FILE_BYTES) return "tooLarge";
  return null;
}

export async function uploadPaymentFile(
  orderNumber: string,
  file: File,
): Promise<PaymentUploadResponse> {
  const err = validatePaymentFile(file);
  if (err) throw new PaymentUploadError(err);

  const form = new FormData();
  form.append("file", file);

  try {
    return await fetchJson<PaymentUploadResponse>(
      `/orders/${encodeURIComponent(orderNumber)}/pay/upload/`,
      { method: "POST", body: form },
    );
  } catch (e) {
    if (e instanceof ApiError) {
      throw new PaymentUploadError("uploadFailed", e);
    }
    throw e;
  }
}

export async function getKaspiQr(orderNumber: string): Promise<KaspiQrResponse> {
  try {
    return await fetchJson<KaspiQrResponse>(
      `/orders/${encodeURIComponent(orderNumber)}/pay/kaspi-qr/`,
      { method: "GET" },
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      throw new PaymentUploadError("notConfigured", e);
    }
    throw e;
  }
}

/**
 * `qr_image_url` из бэка указывает на защищённый /media/ — `<img src>` без
 * Authorization. Качаем байты через apiClient (с Bearer + refresh) и отдаём
 * blob: URL. Caller обязан revoke URL при unmount.
 */
export async function fetchKaspiQrImage(
  orderNumber: string,
): Promise<{ meta: KaspiQrResponse; objectUrl: string }> {
  const meta = await getKaspiQr(orderNumber);
  const blob = await fetchBlob(meta.qr_image_url, { method: "GET" });
  return { meta, objectUrl: URL.createObjectURL(blob) };
}
