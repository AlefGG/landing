import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type ButtonVariant = "cta" | "ghost" | "text" | "blue" | "blue-ghost";
type ButtonSize = "sm" | "md";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
};

type AsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: never;
  };

type AsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
  };

type ButtonProps = AsButton | AsLink;

const variantClasses: Record<ButtonVariant, string> = {
  cta: "bg-gradient-to-b from-cta-gradient-from to-cta-gradient-to text-white rounded-[24px]",
  ghost:
    "border-[1.5px] border-cta-main text-cta-main bg-white/20 rounded-[40px]",
  text: "text-neutral-600 bg-transparent",
  blue: "bg-gradient-to-b from-[#20B7FB] to-[#0295CB] text-white rounded-[40px]",
  "blue-ghost":
    "border-[1.5px] border-[#20B7FB] text-[#20B7FB] bg-white/20 rounded-[40px]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1 text-sm leading-4",
  md: "px-4 py-2 text-base leading-6",
};

export default function Button({
  variant = "cta",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center font-semibold font-body transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if ("href" in props && props.href) {
    const { href, ...rest } = props as AsLink;
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(props as AsButton)}>
      {children}
    </button>
  );
}
