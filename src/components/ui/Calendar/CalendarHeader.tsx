type CalendarHeaderProps = {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onTitleClick?: () => void;
};

export default function CalendarHeader({
  title,
  onPrev,
  onNext,
  onTitleClick,
}: CalendarHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between h-[30px]">
      <button
        type="button"
        onClick={onPrev}
        className="flex size-[20px] items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path
            d="M7 1L1 7L7 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {onTitleClick ? (
        <button
          type="button"
          onClick={onTitleClick}
          className="flex-1 text-center font-body font-semibold text-[16px] leading-[24px] text-neutral-900 cursor-pointer bg-transparent border-none p-0"
        >
          {title}
        </button>
      ) : (
        <span className="flex-1 text-center font-body font-semibold text-[16px] leading-[24px] text-neutral-900">
          {title}
        </span>
      )}
      <button
        type="button"
        onClick={onNext}
        className="flex size-[20px] items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path
            d="M1 1L7 7L1 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
