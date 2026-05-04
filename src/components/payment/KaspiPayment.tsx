import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  getKaspiQr,
  uploadPaymentFile,
  PaymentUploadError,
} from "../../services/paymentService";
import {
  errorMessage,
  normalizeError,
  type NormalizedError,
} from "../../services/errors";
import FileUploader from "./FileUploader";
import IdDocumentBlock from "./IdDocumentBlock";

type QrState =
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "missing" }
  | { status: "error"; error: NormalizedError };

function deriveServiceSlug(serviceType?: string): string {
  if (!serviceType) return "rental";
  if (serviceType === "sale") return "sale";
  if (serviceType === "sanitation") return "sanitation";
  return "rental";
}

export default function KaspiPayment({
  orderId,
  amount,
  serviceType,
  hasIdDocumentFront,
  hasIdDocumentBack,
  requireIdDocument,
}: {
  orderId: string;
  amount: number;
  serviceType?: string;
  hasIdDocumentFront: boolean;
  hasIdDocumentBack: boolean;
  requireIdDocument: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [qr, setQr] = useState<QrState>({ status: "loading" });
  const [frontUploaded, setFrontUploaded] = useState(hasIdDocumentFront);

  const formattedAmount = amount.toLocaleString("ru-RU");
  const idGateBlocked = requireIdDocument && !frontUploaded;

  // F-009: Kaspi QR is a PUBLIC company asset (sits under /media/, not
  // /private_media/), so we render it via plain <img src> instead of fetching
  // bytes through the Bearer-attached apiClient. The previous fetchBlob
  // approach triggered a CORS preflight on api.biotualeti.com/media/, which
  // has no Access-Control-* headers — every customer saw "Не найдено" on
  // /pay even though the QR was uploaded. The endpoint itself still requires
  // auth so we keep the order-ownership check; only the image bytes go
  // through a regular browser <img> request.
  const loadQr = useCallback(() => {
    let cancelled = false;
    setQr({ status: "loading" });
    getKaspiQr(orderId)
      .then(({ qr_image_url }) => {
        if (cancelled) return;
        setQr({ status: "ready", url: qr_image_url });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof PaymentUploadError && err.code === "notConfigured") {
          setQr({ status: "missing" });
        } else {
          setQr({ status: "error", error: normalizeError(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    const cleanup = loadQr();
    return cleanup;
  }, [loadQr]);

  const handleUpload = async (file: File) => {
    await uploadPaymentFile(orderId, file);
    const service = deriveServiceSlug(serviceType);
    navigate(
      `/success?type=individual&order=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(formattedAmount)}&service=${service}`,
    );
  };

  return (
    <div className="flex flex-col gap-8" data-testid="kaspi-payment">
      <div>
        <h2 className="font-heading text-[24px] lg:text-[32px] font-extrabold leading-[28px] lg:leading-[36px] text-neutral-900">
          {t("payment.kaspi.title")}
        </h2>
        <p className="mt-2 font-body text-base lg:text-xl leading-6 text-neutral-600">
          {t("payment.kaspi.instruction", { amount: formattedAmount })}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        <div className="w-full lg:w-[320px] shrink-0">
          {qr.status === "ready" ? (
            <img
              src={qr.url}
              alt={t("payment.kaspi.qrAlt")}
              className="w-full h-auto rounded-2xl border border-neutral-200 bg-white"
              data-testid="kaspi-qr"
            />
          ) : (
            <div
              className="w-full aspect-square rounded-2xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center p-4 text-center gap-2"
              data-testid="kaspi-qr-fallback"
            >
              <p className="font-body text-sm leading-4 text-neutral-500">
                {qr.status === "loading"
                  ? t("payment.kaspi.qrLoading")
                  : qr.status === "missing"
                    ? t("payment.kaspi.qrMissing")
                    : errorMessage(qr.error, t, undefined, "short")}
              </p>
              {qr.status === "error" && (
                <button
                  type="button"
                  onClick={() => loadQr()}
                  data-testid="kaspi-qr-retry"
                  className="font-body text-sm text-cta-main underline"
                >
                  {t("errors.retry")}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4 w-full">
          {requireIdDocument && (
            <IdDocumentBlock
              orderId={orderId}
              hasFront={hasIdDocumentFront}
              hasBack={hasIdDocumentBack}
              onFrontUploadedChange={setFrontUploaded}
            />
          )}

          {!receiptOpen ? (
            <button
              type="button"
              onClick={() => setReceiptOpen(true)}
              disabled={idGateBlocked}
              className="self-start bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base leading-6 rounded-[40px] px-10 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="kaspi-paid-button"
            >
              {t("payment.kaspi.paidButton")}
            </button>
          ) : (
            <FileUploader
              title={t("payment.kaspi.receiptTitle")}
              hint={t("payment.kaspi.receiptHint")}
              onUpload={handleUpload}
              testId="kaspi-receipt-uploader"
            />
          )}

          {idGateBlocked && (
            <p
              className="font-body text-sm leading-5 text-neutral-600"
              data-testid="kaspi-id-required-hint"
            >
              {t("payment.kaspi.idDocument.required")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
