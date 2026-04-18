import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { uploadPaymentReceipt } from "../../services/paymentService";
import FileUploader from "./FileUploader";

export default function KaspiPayment({
  orderId,
  amount,
}: {
  orderId: string;
  amount: number;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [receiptOpen, setReceiptOpen] = useState(false);

  const formattedAmount = amount.toLocaleString("ru-RU");

  const handleUpload = async (file: File) => {
    await uploadPaymentReceipt(orderId, file);
    navigate(`/success?type=individual&order=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(formattedAmount)}`);
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
          <img
            src="/assets/images/kaspi-qr-placeholder.svg"
            alt={t("payment.kaspi.qrAlt")}
            className="w-full h-auto rounded-2xl border border-neutral-200 bg-white"
            data-testid="kaspi-qr"
          />
          <p className="mt-2 font-body text-sm leading-4 text-neutral-400 text-center">
            {t("payment.kaspi.qrPlaceholder")}
          </p>
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
