import { useTranslation } from "react-i18next";

type StepHeaderProps = {
  step: number;
  title: string;
  className?: string;
};

export default function StepHeader({
  step,
  title,
  className = "",
}: StepHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-[8px] ${className}`}>
      <span
        style={{ fontFamily: "'Geologica', sans-serif" }}
        className="text-[12px] lg:text-[18px] font-normal leading-[16px] lg:leading-[24px] tracking-[1.68px] lg:tracking-[3.6px] uppercase text-cta-main"
      >
        {t("wizard.step")} {step}
      </span>
      <h2 className="font-heading text-[20px] lg:text-[32px] font-extrabold leading-[24px] lg:leading-[32px] text-neutral-900">
        {title}
      </h2>
    </div>
  );
}
