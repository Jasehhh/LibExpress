import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ghost-danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-stamp text-white hover:bg-stamp-deep",
  secondary:
    "bg-surface text-ink border border-rule-strong hover:border-ink-soft hover:bg-paper",
  ghost: "text-ink-soft hover:text-ink hover:bg-ink/5",
  danger: "bg-overdue text-white hover:bg-[#962922]",
  "ghost-danger": "text-ink-soft hover:text-overdue hover:bg-overdue-wash",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-[0.9375rem]",
};

// Shared with <Link> so links that act as buttons look the same.
export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  busy?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  busy = false,
  className = "",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClass(variant, size)} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy && (
        <span
          aria-hidden
          className="size-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
}
