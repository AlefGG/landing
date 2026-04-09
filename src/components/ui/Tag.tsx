type TagProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Tag({ children, className = "" }: TagProps) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold font-body rounded-full ${className}`}
    >
      {children}
    </span>
  );
}
