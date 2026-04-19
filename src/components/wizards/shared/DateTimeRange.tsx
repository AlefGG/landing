import { useRef, useEffect } from "react";
import { Calendar, TimeDropdown } from "../../ui";
import type { CalendarDayMeta } from "../../ui/Calendar/Calendar";
import { formatDate } from "./phoneFormat";

export type DateTimeRangeValue = {
  startDate: Date | null;
  startTime: string;
  endTime: string;
};

export default function DateTimeRange({
  value,
  onChange,
  labels,
  calendarOpen,
  onToggleCalendar,
  startTimeOpen,
  onToggleStartTime,
  endTimeOpen,
  onToggleEndTime,
  dayMeta,
}: {
  value: DateTimeRangeValue;
  onChange: (v: DateTimeRangeValue) => void;
  labels: { startDate: string; startTime: string; endTime: string };
  calendarOpen: boolean;
  onToggleCalendar: () => void;
  startTimeOpen: boolean;
  onToggleStartTime: () => void;
  endTimeOpen: boolean;
  onToggleEndTime: () => void;
  dayMeta?: (date: Date) => CalendarDayMeta | undefined;
}) {
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        onToggleCalendar();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen, onToggleCalendar]);

  const timeOptions = Array.from({ length: 24 }, (_, h) => [
    { time: `${String(h).padStart(2, "0")}:00` },
    { time: `${String(h).padStart(2, "0")}:30` },
  ]).flat();

  return (
    <div className="mt-4 py-6 flex flex-col lg:flex-row items-start gap-4 lg:gap-8">
      <div className="relative w-full lg:w-[280px]" ref={calendarRef}>
        <button
          type="button"
          onClick={onToggleCalendar}
          className={`flex h-10 w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${
            value.startDate ? "text-neutral-900" : "text-neutral-300"
          }`}
        >
          {value.startDate ? formatDate(value.startDate) : labels.startDate}
        </button>
        {calendarOpen && (
          <div className="absolute top-full left-0 z-50 mt-1">
            <Calendar
              mode="single"
              value={value.startDate}
              onChange={(d) => {
                onChange({ ...value, startDate: d as Date });
                onToggleCalendar();
              }}
              dayMeta={dayMeta}
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 w-full lg:w-auto">
        <TimeDropdown
          options={timeOptions}
          value={value.startTime}
          onChange={(t) => onChange({ ...value, startTime: t })}
          isOpen={startTimeOpen}
          onToggle={onToggleStartTime}
          placeholder={labels.startTime}
          className="flex-1 lg:w-[124px]"
        />
        <TimeDropdown
          options={timeOptions}
          value={value.endTime}
          onChange={(t) => onChange({ ...value, endTime: t })}
          isOpen={endTimeOpen}
          onToggle={onToggleEndTime}
          placeholder={labels.endTime}
          className="flex-1 lg:w-[124px]"
        />
      </div>
    </div>
  );
}
