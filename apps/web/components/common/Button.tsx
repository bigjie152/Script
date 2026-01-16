import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-soft hover:shadow-glass hover:-translate-y-0.5",
  outline:
    "border border-white/60 bg-white/40 text-ink hover:bg-white/60 hover:-translate-y-0.5",
  ghost: "bg-transparent text-ink hover:bg-white/40"
};

export function Button({
  variant = "primary",
  loading,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASS[variant],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "处理中..." : children}
    </button>
  );
}
