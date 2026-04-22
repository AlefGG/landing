import type { DayObject } from "./useCalendar";
import CalendarDay from "./CalendarDay";

export type DayMetaInfo = {
  blocked?: boolean;
  reason?: string | null;
  disabled?: boolean;
};

type CalendarDayGridProps = {
  days: DayObject[];
  selectedDate?: Date | null;
  selectedRange?: [Date, Date] | null;
  mode: "single" | "dateRange" | "weekRange";
  onDayClick: (date: Date) => void;
  weekDayLabels?: string[];
  dayMeta?: (date: Date) => DayMetaInfo | undefined;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inRange(date: Date, start: Date, end: Date) {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

const DEFAULT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarDayGrid({
  days,
  selectedDate,
  selectedRange,
  mode,
  onDayClick,
  weekDayLabels = DEFAULT_LABELS,
  dayMeta,
}: CalendarDayGridProps) {
  const rangeStart = selectedRange?.[0] ?? null;
  const rangeEnd = selectedRange?.[1] ?? null;

  return (
    <div className="grid grid-cols-7">
      {weekDayLabels.map((label) => (
        <div
          key={label}
          className="flex items-center justify-center h-[20px] text-neutral-500 text-[16px] text-center font-body"
        >
          {label}
        </div>
      ))}
      {days.map((dayObj, i) => {
        const isSelected =
          mode === "single" && selectedDate
            ? sameDay(dayObj.date, selectedDate)
            : false;

        const isInRng =
          rangeStart && rangeEnd
            ? inRange(dayObj.date, rangeStart, rangeEnd)
            : false;

        const isRangeStart =
          rangeStart ? sameDay(dayObj.date, rangeStart) : false;
        const isRangeEnd =
          rangeEnd ? sameDay(dayObj.date, rangeEnd) : false;

        const meta = dayMeta?.(dayObj.date);
        const blocked = meta?.blocked === true;
        const disabled = blocked || meta?.disabled === true;
        const title = meta?.reason ?? undefined;

        return (
          <CalendarDay
            key={i}
            day={dayObj.day}
            isCurrentMonth={dayObj.isCurrentMonth}
            isToday={dayObj.isToday}
            isSelected={isSelected || (isRangeStart && !rangeEnd)}
            isInRange={isInRng && !isRangeStart && !isRangeEnd}
            isRangeStart={isInRng && isRangeStart && !!rangeEnd}
            isRangeEnd={isInRng && isRangeEnd && !!rangeStart}
            onClick={() => {
              if (disabled) return;
              onDayClick(dayObj.date);
            }}
            disabled={disabled}
            blocked={blocked}
            title={title}
            dateIso={`${dayObj.date.getFullYear()}-${String(dayObj.date.getMonth() + 1).padStart(2, "0")}-${String(dayObj.date.getDate()).padStart(2, "0")}`}
          />
        );
      })}
    </div>
  );
}
