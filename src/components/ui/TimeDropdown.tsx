import { useRef, useEffect, useState, useCallback, type KeyboardEvent } from "react";

type TimeOption = {
  time: string;
  duration?: string;
};

type TimeDropdownProps = {
  options: TimeOption[];
  value?: string;
  onChange: (time: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  placeholder?: string;
  className?: string;
};

export default function TimeDropdown({
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  placeholder = "Start time",
  className = "",
}: TimeDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-item]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex, isOpen]);

  const select = useCallback(
    (time: string) => {
      onChange(time);
      setFocusedIndex(-1);
      onToggle();
    },
    [onChange, onToggle],
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setFocusedIndex(-1);
        onToggle();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case "Enter": {
        e.preventDefault();
        const candidate = options[focusedIndex];
        if (candidate) {
          select(candidate.time);
        }
        break;
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className={`flex h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-[16px] leading-[24px] ${value ? "text-neutral-900" : "text-neutral-500"}`}
      >
        <span className="block w-full truncate whitespace-nowrap">
          {value || placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute top-full left-0 z-[1100] mt-[4px] max-h-[312px] w-[192px] overflow-y-auto rounded-[8px] border border-neutral-200 bg-white shadow-[0px_7px_16px_0px_rgba(93,96,120,0.2)] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {options.map((option, index) => {
            const isSelected = option.time === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                type="button"
                key={option.time}
                data-item
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                onClick={() => select(option.time)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`flex h-[32px] w-full cursor-pointer items-center border-none bg-transparent px-[16px] font-body text-[16px] ${
                  isSelected
                    ? "bg-blue-5 text-dark-blue-80"
                    : isFocused
                      ? "bg-blue-5 text-neutral-900"
                      : "text-neutral-900"
                }`}
              >
                <span>{option.time}</span>
                {option.duration && (
                  <span className="ml-auto text-neutral-500">{option.duration}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
