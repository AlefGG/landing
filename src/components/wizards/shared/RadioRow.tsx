export default function RadioRow({
  selected,
  onClick,
  label,
  description,
  className = "",
  testId,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  className?: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={selected}
      className={`flex flex-col items-start gap-2 text-left ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`size-5 shrink-0 rounded-full overflow-hidden ${
            selected ? "bg-cta-main flex items-center justify-center" : "border border-neutral-500"
          }`}
        >
          {selected && <span className="size-[6px] rounded-full bg-white" />}
        </span>
        <span className="font-body text-xl leading-6 text-neutral-900">{label}</span>
      </div>
      {description && (
        <p className="font-body text-base leading-6 text-neutral-500">{description}</p>
      )}
    </button>
  );
}
