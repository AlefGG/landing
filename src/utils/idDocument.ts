export const MAX_ID_DOCUMENT_SIZE = 5 * 1024 * 1024;

export const ALLOWED_ID_DOCUMENT_MIMES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

export type IdDocumentValidationReason = "too_large" | "bad_mime";

export type IdDocumentValidationResult =
  | { ok: true }
  | { ok: false; reason: IdDocumentValidationReason };

export function validateIdDocument(file: File): IdDocumentValidationResult {
  if (!ALLOWED_ID_DOCUMENT_MIMES.has(file.type)) {
    return { ok: false, reason: "bad_mime" };
  }
  if (file.size > MAX_ID_DOCUMENT_SIZE) {
    return { ok: false, reason: "too_large" };
  }
  return { ok: true };
}
