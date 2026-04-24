import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "text-white bg-[linear-gradient(135deg,rgb(var(--brand)_/_0.95),rgb(var(--brand-2)_/_0.95))] hover:brightness-[1.03] shadow-[0_16px_40px_rgba(160,128,255,0.25)] border border-white/10 [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]",
  secondary:
    "text-white bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.12]",
  ghost: "text-white/90 hover:bg-white/[0.06]",
  danger:
    "text-white bg-[linear-gradient(135deg,rgb(var(--danger)_/_0.9),rgb(255_120_72_/_0.85))] hover:brightness-[1.03]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition will-change-transform",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0",
        "active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

type LinkButtonProps = Omit<React.ComponentProps<typeof Link>, "className"> & {
  className?: string;
  variant?: Variant;
  size?: Size;
};

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition will-change-transform",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0",
        "active:translate-y-[1px]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

