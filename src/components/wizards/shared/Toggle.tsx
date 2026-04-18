export default function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${
          checked ? "bg-cta-main" : "bg-[#c5d3dd]"
        }`}
      >
        <span
          className={`absolute left-0 top-[2px] size-6 rounded-full bg-white shadow-md transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
      <span
        className={`font-body text-xl leading-6 ${
          checked ? "text-neutral-900" : "text-neutral-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
