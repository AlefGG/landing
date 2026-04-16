type IconButtonProps = {
  onClick?: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  className?: string;
  "aria-label": string;
};

export default function IconButton({
  onClick,
  icon,
  disabled,
  className = "",
  "aria-label": ariaLabel,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`flex size-[44px] items-center justify-center rounded-[9.667px] border-[1.5px] border-neutral-600 bg-white/20 hover:bg-neutral-200/50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <span className="size-[24px]">{icon}</span>
    </button>
  );
}
