import { type InputHTMLAttributes } from "react";

type BasicInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  className?: string;
};

export default function BasicInput({
  className = "",
  disabled,
  ...rest
}: BasicInputProps) {
  return (
    <input
      className={`h-[44px] w-full rounded-[8px] border border-neutral-400 bg-white px-[11px] font-body text-[16px] leading-[24px] text-neutral-900 placeholder:text-neutral-500 focus:border-blue-20 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      disabled={disabled}
      {...rest}
    />
  );
}
