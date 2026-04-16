const MONTHS = [
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

type CalendarMonthGridProps = {
  selectedMonth: number;
  onMonthClick: (month: number) => void;
};

export default function CalendarMonthGrid({
  selectedMonth,
  onMonthClick,
}: CalendarMonthGridProps) {
  return (
    <div className="grid grid-cols-3 gap-[16px] gap-y-[10px]">
      {MONTHS.map((name, i) => {
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
