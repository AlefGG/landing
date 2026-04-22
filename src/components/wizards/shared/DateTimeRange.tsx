import { useRef, useEffect } from "react";
import { Calendar, TimeDropdown } from "../../ui";
import type { CalendarDayMeta } from "../../ui/Calendar/Calendar";
import { formatDate } from "./phoneFormat";

export type DateTimeRangeValue = {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
};

export default function DateTimeRange({
  value,
  onChange,
  labels,
  startCalendarOpen,
  onToggleStartCalendar,
  endCalendarOpen,
  onToggleEndCalendar,
  startTimeOpen,
  onToggleStartTime,
  endTimeOpen,
  onToggleEndTime,
  dayMeta,
  endDayMeta,
}: {
  value: DateTimeRangeValue;
  onChange: (v: DateTimeRangeValue) => void;
  labels: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  startCalendarOpen: boolean;
  onToggleStartCalendar: () => void;
  endCalendarOpen: boolean;
  onToggleEndCalendar: () => void;
  startTimeOpen: boolean;
  onToggleStartTime: () => void;
  endTimeOpen: boolean;
  onToggleEndTime: () => void;
  dayMeta?: (date: Date) => CalendarDayMeta | undefined;
  endDayMeta?: (date: Date) => CalendarDayMeta | undefined;
}) {
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startCalendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        startCalendarRef.current &&
        !startCalendarRef.current.contains(e.target as Node)
      ) {
        onToggleStartCalendar();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [startCalendarOpen, onToggleStartCalendar]);

  useEffect(() => {
    if (!endCalendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        endCalendarRef.current &&
        !endCalendarRef.current.contains(e.target as Node)
      ) {
        onToggleEndCalendar();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [endCalendarOpen, onToggleEndCalendar]);

  const timeOptions = Array.from({ length: 24 }, (_, h) => [
    { time: `${String(h).padStart(2, "0")}:00` },
    { time: `${String(h).padStart(2, "0")}:30` },
  ]).flat();

  return (
    <div className="mt-4 py-6 flex flex-col lg:flex-row items-start gap-4 lg:gap-6 flex-wrap">
      <div className="relative w-full lg:w-[220px]" ref={startCalendarRef}>
        <button
          type="button"
          onClick={onToggleStartCalendar}
          data-testid="wizard-start-date-button"
          className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${
            value.startDate ? "text-neutral-900" : "text-neutral-500"
          }`}
        >
          {value.startDate ? formatDate(value.startDate) : labels.startDate}
        </button>
        {startCalendarOpen && (
          <div className="absolute top-full left-0 z-[1100] mt-1" data-testid="wizard-start-calendar">
            <Calendar
              mode="single"
              value={value.startDate}
              onChange={(d) => {
                const next = d as Date;
                // Reset endDate if it would now be before startDate.
                const endDate =
                  value.endDate && value.endDate.getTime() < next.getTime()
                    ? null
                    : value.endDate;
                onChange({ ...value, startDate: next, endDate });
                onToggleStartCalendar();
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
      </div>

      <div className="relative w-full lg:w-[220px]" ref={endCalendarRef}>
        <button
          type="button"
          onClick={onToggleEndCalendar}
          className={`flex h-10 lg:h-[44px] w-full items-center rounded-[8px] border border-neutral-400 bg-white px-[11px] text-left font-body text-base leading-6 ${
            value.endDate ? "text-neutral-900" : "text-neutral-500"
          }`}
        >
          {value.endDate ? formatDate(value.endDate) : labels.endDate}
        </button>
        {endCalendarOpen && (
          <div className="absolute top-full left-0 z-[1100] mt-1">
            <Calendar
              mode="single"
              value={value.endDate}
              onChange={(d) => {
                onChange({ ...value, endDate: d as Date });
                onToggleEndCalendar();
              }}
              dayMeta={endDayMeta ?? dayMeta}
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 w-full lg:w-auto">
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
