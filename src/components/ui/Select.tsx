import { useRef, useEffect, useState, useCallback, type KeyboardEvent } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}: SelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-item]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex, isOpen]);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onChange],
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          select(options[focusedIndex].value);
        }
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-[8px] block font-body text-[16px] font-semibold leading-[24px] text-neutral-600">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`flex h-[40px] w-full items-center rounded-[8px] border border-neutral-500 bg-white px-[11px] text-left font-body text-[16px] leading-[24px] ${selectedLabel ? "text-neutral-900" : "text-neutral-500"}`}
      >
        <span className="flex-1 truncate">{selectedLabel || placeholder}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`ml-[8px] shrink-0 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute top-full left-0 z-[1100] mt-[4px] max-h-[200px] w-full overflow-y-auto rounded-[8px] border border-neutral-200 bg-white shadow-[0px_7px_16px_0px_rgba(93,96,120,0.2)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                type="button"
                key={option.value}
                data-item
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                onClick={() => select(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`flex h-[36px] w-full cursor-pointer items-center border-none bg-transparent px-[16px] text-left font-body text-[16px] ${
                  isSelected
                    ? "bg-blue-5 text-dark-blue-80"
                    : isFocused
                      ? "bg-blue-5 text-neutral-900"
                      : "text-neutral-900"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
