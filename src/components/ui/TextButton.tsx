type TextButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export default function TextButton({
  onClick,
  children,
  icon,
  className = "",
  type = "button",
}: TextButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-[8px] py-[4px] font-body text-[16px] font-semibold leading-[24px] text-cta-main hover:opacity-80 ${className}`}
    >
      {icon && <span className="size-[16px] overflow-hidden">{icon}</span>}
      {children}
    </button>
  );
}
