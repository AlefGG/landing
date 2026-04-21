import { useTranslation } from "react-i18next";

export default function PriceSubmit({
  price,
  disabled = false,
  disabledReason,
  onSubmit,
}: {
  price: number;
  disabled?: boolean;
  disabledReason?: string;
  onSubmit?: () => void;
}) {
  const { t } = useTranslation();
  const k = "wizard.rental" as const;

  return (
    <section className="max-w-[1216px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-16 lg:pb-[104px]">
      <div className="lg:px-[104px] flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
        <div className="flex items-center gap-2 whitespace-nowrap justify-end lg:justify-start">
          <span className="font-body text-xl leading-6 text-neutral-900">
            {t(`${k}.price`)}
          </span>
          <span className="font-body font-semibold text-2xl leading-8 text-cta-main">
            {price.toLocaleString("ru-RU")}
          </span>
          <span className="font-body text-xl leading-6 text-neutral-900">
            {t(`${k}.currency`)}
          </span>
        </div>
        <div className="flex flex-col gap-2 w-full lg:w-[272px]">
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className="flex items-center justify-between gap-4 bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white font-body font-semibold text-base leading-6 rounded-[40px] pl-10 pr-8 py-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{t(`${k}.submit`)}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9.51 4.23l8.56 4.28c3.84 1.92 3.84 5.06 0 6.98l-8.56 4.28c-5.76 2.88-8.11.52-5.23-5.23l.87-1.73a1.88 1.88 0 000-1.63l-.87-1.74C1.4 3.71 3.76 1.35 9.51 4.23z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M5.44 12h5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {disabledReason && (
            <p className="font-body text-sm leading-4 text-red-600">{disabledReason}</p>
          )}
        </div>
      </div>
    </section>
  );
}
