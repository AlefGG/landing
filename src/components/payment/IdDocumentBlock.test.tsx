// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import IdDocumentBlock from "./IdDocumentBlock";
import * as svc from "../../services/idDocumentService";

vi.mock("../../services/idDocumentService", () => ({
  uploadIdDocuments: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
}));

const ORDER = "ORD-1";

function makeFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("IdDocumentBlock", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders idle drop zones when nothing uploaded", () => {
    const onChange = vi.fn();
    render(
      <IdDocumentBlock
        orderId={ORDER}
        hasFront={false}
        hasBack={false}
        onFrontUploadedChange={onChange}
      />,
    );
    expect(screen.getByTestId("payment-id-document-block")).toBeTruthy();
    expect(screen.queryByTestId("payment-id-doc-front-uploaded")).toBeNull();
    expect(screen.queryByTestId("payment-id-doc-back-uploaded")).toBeNull();
    // FE-RX-003: callback fires only on actual transitions, not on mount.
    // Parent already knows the initial state via the `hasFront` prop.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders uploaded state when hasFront=true initial", () => {
    const onChange = vi.fn();
    render(
      <IdDocumentBlock
        orderId={ORDER}
        hasFront={true}
        hasBack={false}
        onFrontUploadedChange={onChange}
      />,
    );
    expect(screen.getByTestId("payment-id-doc-front-uploaded")).toBeTruthy();
    expect(screen.getByTestId("payment-id-doc-front-replace")).toBeTruthy();
    // FE-RX-003: callback fires only on transitions, not on mount. Parent
    // already passed `hasFront=true` so it knows; mount call would be a
    // redundant re-render trigger.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uploads valid front file and flips callback to true", async () => {
    (svc.uploadIdDocuments as ReturnType<typeof vi.fn>).mockResolvedValue({
      has_id_document_front: true,
      has_id_document_back: false,
    });
    const onChange = vi.fn();
    render(
      <IdDocumentBlock
        orderId={ORDER}
        hasFront={false}
        hasBack={false}
        onFrontUploadedChange={onChange}
      />,
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const file = makeFile("id.jpg", "image/jpeg");
    fireEvent.change(inputs[0]!, { target: { files: [file] } });
    await waitFor(() =>
      expect(svc.uploadIdDocuments).toHaveBeenCalledWith(ORDER, { front: file }),
    );
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(true));
    expect(screen.getByTestId("payment-id-doc-front-uploaded")).toBeTruthy();
  });

  it("rejects invalid mime, does not call upload, callback stays false", async () => {
    const onChange = vi.fn();
    render(
      <IdDocumentBlock
        orderId={ORDER}
        hasFront={false}
        hasBack={false}
        onFrontUploadedChange={onChange}
      />,
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const bad = makeFile("doc.docx", "application/msword");
    fireEvent.change(inputs[0]!, { target: { files: [bad] } });
    await waitFor(() =>
      expect(
        screen.getByText("payment.kaspi.idDocument.validationBadMime"),
      ).toBeTruthy(),
    );
    expect(svc.uploadIdDocuments).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalledWith(true);
  });

  it("rejects too-large file", async () => {
    const onChange = vi.fn();
    render(
      <IdDocumentBlock
        orderId={ORDER}
        hasFront={false}
        hasBack={false}
        onFrontUploadedChange={onChange}
      />,
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const big = makeFile("big.jpg", "image/jpeg", 6 * 1024 * 1024);
    fireEvent.change(inputs[0]!, { target: { files: [big] } });
    await waitFor(() =>
      expect(
        screen.getByText("payment.kaspi.idDocument.validationTooLarge"),
      ).toBeTruthy(),
    );
    expect(svc.uploadIdDocuments).not.toHaveBeenCalled();
  });

  it("shows uploadFailed when network errors", async () => {
    (svc.uploadIdDocuments as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
    const onChange = vi.fn();
    render(
      <IdDocumentBlock
        orderId={ORDER}
        hasFront={false}
        hasBack={false}
        onFrontUploadedChange={onChange}
      />,
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    fireEvent.change(inputs[0]!, { target: { files: [makeFile("id.jpg", "image/jpeg")] } });
    await waitFor(() =>
      expect(
        screen.getByText("payment.kaspi.idDocument.uploadFailed"),
      ).toBeTruthy(),
    );
    expect(onChange).not.toHaveBeenCalledWith(true);
  });

  it("uploads back without flipping front callback to true", async () => {
    (svc.uploadIdDocuments as ReturnType<typeof vi.fn>).mockResolvedValue({
      has_id_document_front: false,
      has_id_document_back: true,
    });
    const onChange = vi.fn();
    render(
      <IdDocumentBlock
        orderId={ORDER}
        hasFront={false}
        hasBack={false}
        onFrontUploadedChange={onChange}
      />,
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const file = makeFile("id-back.jpg", "image/jpeg");
    fireEvent.change(inputs[1]!, { target: { files: [file] } });
    await waitFor(() =>
      expect(svc.uploadIdDocuments).toHaveBeenCalledWith(ORDER, { back: file }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("payment-id-doc-back-uploaded")).toBeTruthy(),
    );
    expect(onChange).not.toHaveBeenCalledWith(true);
  });

  it("replace flow: clicking replace returns to drop zone", () => {
    const onChange = vi.fn();
    render(
      <IdDocumentBlock
        orderId={ORDER}
        hasFront={true}
        hasBack={false}
        onFrontUploadedChange={onChange}
      />,
    );
    expect(screen.getByTestId("payment-id-doc-front-uploaded")).toBeTruthy();
    fireEvent.click(screen.getByTestId("payment-id-doc-front-replace"));
    expect(screen.queryByTestId("payment-id-doc-front-uploaded")).toBeNull();
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
