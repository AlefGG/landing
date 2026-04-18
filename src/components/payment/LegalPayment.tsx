import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { uploadLegalRequisites } from "../../services/paymentService";
import FileUploader from "./FileUploader";

export default function LegalPayment({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpload = async (file: File) => {
    await uploadLegalRequisites(orderId, file);
    navigate(`/success?type=legal&order=${encodeURIComponent(orderId)}`);
  };

  return (
    <div className="flex flex-col gap-6" data-testid="legal-payment">
      <div>
        <h2 className="font-heading text-[24px] lg:text-[32px] font-extrabold leading-[28px] lg:leading-[36px] text-neutral-900">
          {t("payment.legal.title")}
        </h2>
        <p className="mt-2 font-body text-base lg:text-xl leading-6 text-neutral-600">
          {t("payment.legal.instruction")}
        </p>
      </div>

      <FileUploader
        title={t("payment.legal.title")}
        hint={t("payment.legal.hint")}
        onUpload={handleUpload}
        testId="legal-uploader"
      />
    </div>
  );
}
