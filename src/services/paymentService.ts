/**
 * Payment service (P0-4).
 *
 * Ручной процесс оплаты (ТЗ п.4.1, редакция 2026-04-18):
 * - Физлицо: статичный Kaspi QR, клиент оплачивает вручную, загружает чек.
 * - Юрлицо: клиент загружает реквизиты компании.
 *
 * Mock: валидирует MIME/размер, логирует в консоль, резолвит `{status: "pending"}`.
 * TODO(backend): заменить на реальные multipart POST:
 *   - POST /api/orders/{id}/pay/receipt/  (individual)
 *   - POST /api/orders/{id}/pay/legal/    (legal)
 */

export type PaymentUploadResponse = { status: "pending" };

export const ALLOWED_PAYMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const MAX_PAYMENT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export type PaymentValidationError =
  | "invalidType"
  | "tooLarge";

export class PaymentUploadError extends Error {
  readonly code: PaymentValidationError | "uploadFailed";
  override readonly cause?: unknown;
  constructor(code: PaymentValidationError | "uploadFailed", cause?: unknown) {
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

const MOCK_DELAY_MS = 500;

async function mockUpload(
  kind: "receipt" | "legal",
  orderId: string,
  file: File,
): Promise<PaymentUploadResponse> {
  const err = validatePaymentFile(file);
  if (err) throw new PaymentUploadError(err);

  if (import.meta.env.DEV) {
    console.info(`[paymentService:mock] upload ${kind}`, {
      orderId,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return { status: "pending" };
}

export function uploadPaymentReceipt(
  orderId: string,
  file: File,
): Promise<PaymentUploadResponse> {
  return mockUpload("receipt", orderId, file);
}

export function uploadLegalRequisites(
  orderId: string,
  file: File,
): Promise<PaymentUploadResponse> {
  return mockUpload("legal", orderId, file);
}
