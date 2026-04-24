import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl px-4 text-sm text-white placeholder:text-white/40",
          "bg-white/[0.06] border border-white/[0.12]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-white/25",
          "transition",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

