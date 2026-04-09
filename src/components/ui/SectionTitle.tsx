type SectionTitleProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
};

export default function SectionTitle({ children, id, className = "" }: SectionTitleProps) {
  return (
    <h2
      id={id}
      className={`font-heading font-extrabold text-[28px] leading-[32px] lg:text-[40px] lg:leading-[40px] text-neutral-800 text-center w-full ${className}`}
    >
      {children}
    </h2>
  );
}
