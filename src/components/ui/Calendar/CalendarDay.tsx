type CalendarDayProps = {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  blocked?: boolean;
  dateIso?: string;
};

export default function CalendarDay({
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  isInRange,
  isRangeStart,
  isRangeEnd,
  onClick,
  disabled,
  title,
  blocked,
  dateIso,
}: CalendarDayProps) {
  let classes =
    "size-[40px] flex items-center justify-center text-[16px] font-body";

  if (disabled) {
    classes += " cursor-not-allowed";
  } else {
    classes += " cursor-pointer";
  }

  if (isSelected) {
    classes +=
      " bg-blue-5 border border-dark-blue-40 rounded-full text-dark-blue-80";
  } else if (isInRange) {
    classes += " bg-blue-5 text-dark-blue-80";
    if (isRangeStart) classes += " rounded-tl-[20px] rounded-bl-[20px]";
    if (isRangeEnd) classes += " rounded-tr-[20px] rounded-br-[20px]";
  } else if (blocked) {
    classes += " bg-neutral-200 text-neutral-500 line-through";
  } else if (!isCurrentMonth) {
    classes += " text-neutral-400";
  } else {
    classes += " text-neutral-900";
  }

  if (!isSelected && !isInRange && disabled && !blocked) {
    classes += " opacity-40";
  }

  if (isToday) {
    classes += " font-bold text-[14px]";
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={classes}
      title={title}
      data-blocked={blocked ? "true" : undefined}
      data-testid={dateIso ? `calendar-day-${dateIso}` : undefined}
      data-date={dateIso}
    >
      {day}
    </button>
  );
}
