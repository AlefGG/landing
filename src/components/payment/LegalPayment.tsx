import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { uploadPaymentFile } from "../../services/paymentService";
import FileUploader from "./FileUploader";

function deriveServiceSlug(serviceType?: string): string {
  if (!serviceType) return "rental";
  if (serviceType === "sale") return "sale";
  if (serviceType === "sanitation") return "sanitation";
  return "rental";
}

type OperatorRequisites = {
  label: string;
  value: string;
};

// ТЗ §4.1 / BUG-030: legal flow requires that the client knows where to
// wire the money. Until Company has bank fields we surface a static
// operator block here so the UI is usable end-to-end; admin-driven data
// is a separate ticket.
const OPERATOR_REQUISITES: OperatorRequisites[] = [
  { label: "ТОО", value: "Эко-Ресурс" },
  { label: "БИН", value: "080740010203" },
  { label: "ИИК", value: "KZ968560000012345678" },
  { label: "БИК", value: "KCJBKZKX" },
  { label: "Банк", value: 'АО "Банк ЦентрКредит"' },
  { label: "Назначение платежа", value: "Оплата по счёту №{{order}} за услуги биотуалетов" },
];

export default function LegalPayment({
  orderId,
  serviceType,
}: {
  orderId: string;
  serviceType?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpload = async (file: File) => {
    await uploadPaymentFile(orderId, file);
    const service = deriveServiceSlug(serviceType);
    navigate(
      `/success?type=legal&order=${encodeURIComponent(orderId)}&service=${service}`,
    );
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

      {/* BUG-030: operator payment details so the client has somewhere to
          wire the money before uploading their own requisites. */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-5">
        <h3 className="font-heading font-semibold text-base leading-6 text-neutral-900 mb-3">
          {t("payment.legal.operatorRequisitesTitle", {
            defaultValue: "Реквизиты для перевода",
          })}
        </h3>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 font-body text-sm leading-4 text-neutral-800">
          {OPERATOR_REQUISITES.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-neutral-500">{row.label}</dt>
              <dd className="font-mono break-words">
                {row.value.replace("{{order}}", orderId)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <FileUploader
        title={t("payment.legal.uploaderTitle", {
          defaultValue: "Реквизиты компании",
        })}
        hint={t("payment.legal.hint")}
        onUpload={handleUpload}
        testId="legal-uploader"
      />
    </div>
  );
}
