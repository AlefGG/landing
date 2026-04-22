import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  fetchKaspiQrImage,
  uploadPaymentFile,
  PaymentUploadError,
} from "../../services/paymentService";
import FileUploader from "./FileUploader";

type QrState =
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "missing" }
  | { status: "error" };

function deriveServiceSlug(serviceType?: string): string {
  if (!serviceType) return "rental";
  if (serviceType === "sale") return "sale";
  if (serviceType === "sanitation") return "sanitation";
  return "rental"; // rental_event / rental_emergency / rental_construction
}

export default function KaspiPayment({
  orderId,
  amount,
  serviceType,
}: {
  orderId: string;
  amount: number;
  serviceType?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [qr, setQr] = useState<QrState>({ status: "loading" });

  const formattedAmount = amount.toLocaleString("ru-RU");

  useEffect(() => {
    let cancelled = false;
    let revokeUrl: string | null = null;
    fetchKaspiQrImage(orderId)
      .then(({ objectUrl }) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        revokeUrl = objectUrl;
        setQr({ status: "ready", url: objectUrl });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof PaymentUploadError && err.code === "notConfigured") {
          setQr({ status: "missing" });
        } else {
          setQr({ status: "error" });
        }
      });
    return () => {
      cancelled = true;
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [orderId]);

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
              className="w-full aspect-square rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-center p-4 text-center"
              data-testid="kaspi-qr-fallback"
            >
              <p className="font-body text-sm leading-4 text-neutral-500">
                {qr.status === "loading"
                  ? t("payment.kaspi.qrLoading")
                  : qr.status === "missing"
                    ? t("payment.kaspi.qrMissing")
                    : t("payment.kaspi.qrError")}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4 w-full">
          {!receiptOpen ? (
            <button
              type="button"
              onClick={() => setReceiptOpen(true)}
              className="self-start bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base leading-6 rounded-[40px] px-10 py-3"
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
        </div>
      </div>
    </div>
  );
}
