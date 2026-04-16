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
}: CalendarDayProps) {
  let classes =
    "size-[40px] flex items-center justify-center text-[16px] font-body";

  if (disabled) {
    classes += " cursor-default opacity-40";
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
  } else if (!isCurrentMonth) {
    classes += " text-neutral-400";
  } else {
    classes += " text-neutral-900";
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
    >
      {day}
    </button>
  );
}
