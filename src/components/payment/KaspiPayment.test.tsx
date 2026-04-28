// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import KaspiPayment from "./KaspiPayment";

vi.mock("../../services/paymentService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/paymentService")>();
  return {
    ...actual,
    fetchKaspiQrImage: vi.fn().mockResolvedValue({ objectUrl: "blob:test" }),
    uploadPaymentFile: vi.fn(),
  };
});

vi.mock("../../services/idDocumentService", () => ({
  uploadIdDocuments: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { amount?: string; defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}));

function renderKaspi(props: Partial<React.ComponentProps<typeof KaspiPayment>> = {}) {
  return render(
    <MemoryRouter>
      <KaspiPayment
        orderId="ORD-1"
        amount={1000}
        serviceType="rental_event"
        hasIdDocumentFront={false}
        hasIdDocumentBack={false}
        requireIdDocument={true}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("KaspiPayment ID-document gating", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    if (!URL.revokeObjectURL) {
      // jsdom: polyfill the no-op URL.revokeObjectURL used by the QR loader cleanup
      URL.revokeObjectURL = () => {};
    }
  });

  it("disables paid button when require=true and no front", async () => {
    renderKaspi();
    const btn = (await screen.findByTestId("kaspi-paid-button")) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByTestId("kaspi-id-required-hint")).toBeTruthy();
    expect(screen.getByTestId("payment-id-document-block")).toBeTruthy();
  });

  it("enables paid button when require=true and hasIdDocumentFront=true", async () => {
    renderKaspi({ hasIdDocumentFront: true });
    const btn = (await screen.findByTestId("kaspi-paid-button")) as HTMLButtonElement;
    await waitFor(() => expect(btn.disabled).toBe(false));
    expect(screen.queryByTestId("kaspi-id-required-hint")).toBeNull();
  });

  it("does not render IdDocumentBlock when requireIdDocument=false", async () => {
    renderKaspi({ requireIdDocument: false });
    const btn = (await screen.findByTestId("kaspi-paid-button")) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(screen.queryByTestId("payment-id-document-block")).toBeNull();
    expect(screen.queryByTestId("kaspi-id-required-hint")).toBeNull();
  });
});
