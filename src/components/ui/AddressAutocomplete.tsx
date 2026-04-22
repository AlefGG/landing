import { useEffect, useRef, useState } from "react";
import BasicInput from "./BasicInput";
import { searchAddress, type GeocodeResult } from "../../services/geocoderService";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
  className?: string;
};

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className = "",
}: Props) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAddress(value, ctrl.signal);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePick = (s: GeocodeResult) => {
    skipSearchRef.current = true;
    onChange(s.displayName);
    onSelect(s);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 opacity-70 pointer-events-none z-10"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <BasicInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="!h-10 !pl-10"
      />
      {open && (
        <ul className="absolute top-full left-0 right-0 z-[1100] mt-1 max-h-[280px] overflow-y-auto rounded-[8px] border border-neutral-300 bg-white shadow-lg">
          {loading && (
            <li className="px-3 py-2 font-body text-sm text-neutral-500">Поиск…</li>
          )}
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lng}-${i}`}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="w-full text-left px-3 py-2 font-body text-sm leading-5 text-neutral-900 hover:bg-neutral-100"
              >
                {s.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
