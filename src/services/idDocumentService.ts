import { fetchJson } from "./apiClient";

export type UploadIdDocumentsInput = {
  front?: File | null;
  back?: File | null;
};

export type UploadIdDocumentsResponse = {
  detail?: string;
  has_id_document_front: boolean;
  has_id_document_back: boolean;
};

export async function uploadIdDocuments(
  orderNumber: string,
  input: UploadIdDocumentsInput,
): Promise<UploadIdDocumentsResponse> {
  const fd = new FormData();
  if (input.front) fd.append("id_document_front", input.front);
  if (input.back) fd.append("id_document_back", input.back);
  if (![...fd.keys()].length) {
    return { has_id_document_front: false, has_id_document_back: false };
  }
  return fetchJson<UploadIdDocumentsResponse>(
    `/orders/${encodeURIComponent(orderNumber)}/id-documents/`,
    { method: "POST", body: fd },
  );
}
