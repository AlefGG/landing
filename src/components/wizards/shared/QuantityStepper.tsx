import { useState } from "react";

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
}) {
  const [input, setInput] = useState<string>(String(value));
  // FE-CQ-001: sync the editable string mirror when the parent flips
  // `value` programmatically (e.g. clamp on validation). React-19 "adjust
  // state during render" pattern; cheaper than a useEffect that flagged
  // react-hooks/set-state-in-effect.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setInput(String(value));
  }

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const dec = () => {
    const next = clamp(value - 1);
    onChange(next);
    setInput(String(next));
  };
  const inc = () => {
    const next = clamp(value + 1);
    onChange(next);
    setInput(String(next));
  };

  return (
    <div className="flex items-center gap-2 w-[160px]" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={dec}
        className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white disabled:opacity-50"
        disabled={value <= min}
        aria-label="Уменьшить"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <input
        type="number"
        value={input}
        min={min}
        max={max}
        aria-label={ariaLabel ?? "Количество"}
        onChange={(e) => {
          const raw = e.target.value;
          setInput(raw);
          if (raw === "") return;
          const n = parseInt(raw, 10);
          if (!isNaN(n) && n >= min && n <= max) onChange(n);
        }}
        onBlur={() => {
          const n = parseInt(input, 10);
          if (isNaN(n)) {
            onChange(min);
            setInput(String(min));
          } else {
            const c = clamp(n);
            onChange(c);
            setInput(String(c));
          }
        }}
        className="h-10 flex-1 min-w-0 rounded-[8px] border border-neutral-400 bg-white px-2 text-center font-body text-xl text-neutral-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={inc}
        className="shrink-0 size-8 rounded-full bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to flex items-center justify-center text-white disabled:opacity-50"
        disabled={value >= max}
        aria-label="Увеличить"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
