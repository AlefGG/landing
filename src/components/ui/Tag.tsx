type TagProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Tag({ children, className = "" }: TagProps) {
  return (
    <span
      className={`inline-flex items-center h-6 px-2 text-sm leading-4 font-normal font-body rounded-[16px] bg-blue-20 text-neutral-800 ${className}`}
    >
      {children}
    </span>
  );
}
