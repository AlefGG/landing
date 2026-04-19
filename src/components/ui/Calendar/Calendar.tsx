import { useState, useCallback } from "react";
import useCalendar from "./useCalendar";
import CalendarHeader from "./CalendarHeader";
import CalendarDayGrid from "./CalendarDayGrid";
import CalendarMonthGrid from "./CalendarMonthGrid";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type CalendarDayMeta = {
  blocked?: boolean;
  reason?: string | null;
  disabled?: boolean;
};

export type CalendarProps = {
  mode: "single" | "dateRange" | "weekRange" | "yearMonth";
  value: Date | [Date, Date] | null;
  onChange: (value: Date | [Date, Date]) => void;
  locale?: string;
  className?: string;
  dayMeta?: (date: Date) => CalendarDayMeta | undefined;
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSunday(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Calendar({
  mode,
  value,
  onChange,
  className = "",
  dayMeta,
}: CalendarProps) {
  const {
    currentMonth,
    currentYear,
    goToPrevMonth,
    goToNextMonth,
    goToPrevYear,
    goToNextYear,
    setMonth,
    days,
  } = useCalendar({
    initialDate: value instanceof Date ? value : Array.isArray(value) ? value[0] : undefined,
  });

  const [showMonthGrid, setShowMonthGrid] = useState(mode === "yearMonth");
  const [rangePickState, setRangePickState] = useState<Date | null>(null);

  const isYearMonth = mode === "yearMonth";
  const isDayMode = mode === "single" || mode === "dateRange" || mode === "weekRange";

  const headerTitle = showMonthGrid
    ? `${currentYear}`
    : `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const handleHeaderPrev = showMonthGrid ? goToPrevYear : goToPrevMonth;
  const handleHeaderNext = showMonthGrid ? goToNextYear : goToNextMonth;

  const handleTitleClick = useCallback(() => {
    if (!isYearMonth) setShowMonthGrid((v) => !v);
  }, [isYearMonth]);

  const handleMonthClick = useCallback(
    (month: number) => {
      if (isYearMonth) {
        onChange(new Date(currentYear, month, 1));
      } else {
        setMonth(month);
        setShowMonthGrid(false);
      }
    },
    [isYearMonth, currentYear, onChange, setMonth],
  );

  const handleDayClick = useCallback(
    (date: Date) => {
      if (mode === "single") {
        onChange(date);
      } else if (mode === "weekRange") {
        const monday = getMonday(date);
        const sunday = getSunday(monday);
        onChange([monday, sunday]);
      } else if (mode === "dateRange") {
        if (!rangePickState) {
          setRangePickState(date);
        } else {
          const start =
            date.getTime() < rangePickState.getTime() ? date : rangePickState;
          const end =
            date.getTime() >= rangePickState.getTime() ? date : rangePickState;
          onChange([start, end]);
          setRangePickState(null);
        }
      }
    },
    [mode, onChange, rangePickState],
  );

  const selectedDate =
    mode === "single" && value instanceof Date ? value : null;

  const selectedRange: [Date, Date] | null =
    mode === "dateRange" || mode === "weekRange"
      ? Array.isArray(value)
        ? (value as [Date, Date])
        : rangePickState
          ? [rangePickState, rangePickState]
          : null
      : null;

  const containerWidth = isYearMonth ? "w-[376px]" : "w-[356px]";

  return (
    <div
      className={`bg-white border border-neutral-200 rounded-[8px] shadow-[0px_7px_16px_0px_rgba(93,96,120,0.2)] p-[20px] flex flex-col gap-[10px] items-center ${containerWidth} ${className}`}
    >
      {isDayMode && !showMonthGrid ? (
        <>
          <CalendarHeader
            title={headerTitle}
            onPrev={handleHeaderPrev}
            onNext={handleHeaderNext}
            onTitleClick={handleTitleClick}
          />
          <CalendarDayGrid
            days={days}
            selectedDate={selectedDate}
            selectedRange={selectedRange}
            mode={mode}
            onDayClick={handleDayClick}
            dayMeta={dayMeta}
          />
        </>
      ) : (
        <>
          <CalendarHeader
            title={headerTitle}
            onPrev={handleHeaderPrev}
            onNext={handleHeaderNext}
            onTitleClick={isDayMode ? handleTitleClick : undefined}
          />
          <CalendarMonthGrid
            selectedMonth={
              isYearMonth && value instanceof Date
                ? value.getMonth()
                : currentMonth
            }
            onMonthClick={handleMonthClick}
          />
        </>
      )}
    </div>
  );
}
