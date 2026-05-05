import { useTranslation } from "react-i18next";

export default function SurchargeNotice({
  title,
  rate,
  amount,
  total,
  tone = "warning",
}: {
  title: string;
  rate: number;
  amount: number;
  total: number;
  tone?: "warning" | "danger";
}) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;

  const toneClass =
    tone === "danger"
      ? "bg-status-error-light border-status-error"
      : "bg-status-alert-light border-status-alert";

  const percent = Math.round(rate * 100);

  return (
    <div
      className={`mt-4 rounded-[8px] border p-4 ${toneClass}`}
      data-testid="surcharge-notice"
    >
      <p className="font-body font-semibold text-base leading-6 text-neutral-900">
        {title} +{percent}%
      </p>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-body text-sm leading-5 text-neutral-700">
        <span>
          {t("wizard.surcharge.amountLabel")}:{" "}
          <span className="font-semibold">
            +{amount.toLocaleString("ru-RU")} {t(`${k}.currency`)}
          </span>
        </span>
        <span>
          {t("wizard.surcharge.totalLabel")}:{" "}
          <span className="font-semibold">
            {total.toLocaleString("ru-RU")} {t(`${k}.currency`)}
          </span>
        </span>
      </div>
    </div>
  );
}
