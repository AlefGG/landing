export default function StepLabel({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        style={{ fontFamily: "'Geologica', sans-serif" }}
        className="font-normal text-xs lg:text-[18px] leading-4 lg:leading-6 tracking-[2.4px] lg:tracking-[3.6px] uppercase text-cta-main"
      >
        ШАГ {step}
      </span>
      <h2 className="font-heading text-2xl lg:text-[32px] font-extrabold leading-6 lg:leading-8 text-neutral-900">
        {title}
      </h2>
    </div>
  );
}