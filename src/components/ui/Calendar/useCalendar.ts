import { useState, useCallback, useMemo } from "react";

export type DayObject = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

type UseCalendarProps = {
  initialDate?: Date;
};

export default function useCalendar({ initialDate }: UseCalendarProps = {}) {
  const [viewDate, setViewDate] = useState(() => initialDate ?? new Date());

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const goToPrevMonth = useCallback(
    () =>
      setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)),
    [],
  );

  const goToNextMonth = useCallback(
    () =>
      setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)),
    [],
  );

  const goToPrevYear = useCallback(
    () =>
      setViewDate((d) => new Date(d.getFullYear() - 1, d.getMonth(), 1)),
    [],
  );

  const goToNextYear = useCallback(
    () =>
      setViewDate((d) => new Date(d.getFullYear() + 1, d.getMonth(), 1)),
    [],
  );

  const setMonth = useCallback(
    (month: number) =>
      setViewDate((d) => new Date(d.getFullYear(), month, 1)),
    [],
  );

  const getDaysInMonth = useMemo(() => {
    const year = currentYear;
    const month = currentMonth;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const days: DayObject[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d,
        day: d.getDate(),
        isCurrentMonth: false,
        isToday:
          `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayStr,
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        day: i,
        isCurrentMonth: true,
        isToday:
          `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayStr,
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          date: d,
          day: d.getDate(),
          isCurrentMonth: false,
          isToday:
            `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayStr,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  return {
    currentMonth,
    currentYear,
    goToPrevMonth,
    goToNextMonth,
    goToPrevYear,
    goToNextYear,
    setMonth,
    days: getDaysInMonth,
  };
}
