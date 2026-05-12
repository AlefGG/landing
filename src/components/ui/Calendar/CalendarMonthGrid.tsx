import { useMemo } from "react";
import { useTranslation } from "react-i18next";

function bcp47For(lang: string): string {
  if (lang === "kk" || lang === "kz") return "kk-KZ";
  if (lang === "ru") return "ru-RU";
  return lang;
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0]!.toUpperCase() + s.slice(1) : s;
}

type CalendarMonthGridProps = {
  selectedMonth: number;
  onMonthClick: (month: number) => void;
};

export default function CalendarMonthGrid({
  selectedMonth,
  onMonthClick,
}: CalendarMonthGridProps) {
  const { i18n } = useTranslation();
  const bcp47 = bcp47For(i18n.language);

  const monthNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(bcp47, { month: "long" });
    return Array.from({ length: 12 }, (_, i) =>
      capitalize(fmt.format(new Date(2024, i, 1))),
    );
  }, [bcp47]);

  return (
    <div className="grid grid-cols-3 gap-[16px] gap-y-[10px]">
      {monthNames.map((name, i) => {
        const isSelected = i === selectedMonth;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onMonthClick(i)}
            className={`h-[40px] w-[104px] rounded-[6px] border text-center font-body text-[16px] transition-colors ${
              isSelected
                ? "bg-blue-5 border-dark-blue-40 text-dark-blue-80"
                : "border-neutral-300 text-neutral-900 hover:bg-neutral-200/50"
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
