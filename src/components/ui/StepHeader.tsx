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
  return (
    <div className={`flex flex-col gap-[8px] ${className}`}>
      <span
        style={{ fontFamily: "'Geologica', sans-serif" }}
        className="text-[18px] font-normal leading-[24px] tracking-[3.6px] uppercase text-cta-main"
      >
        ШАГ {step}
      </span>
      <h2 className="font-heading text-[32px] font-extrabold leading-[32px] text-neutral-900">
        {title}
      </h2>
    </div>
  );
}
