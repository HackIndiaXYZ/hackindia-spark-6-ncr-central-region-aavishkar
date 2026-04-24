import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-2xl px-4 pr-10 text-sm text-white",
          "bg-white/[0.06] border border-white/[0.12]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-white/25",
          "transition",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

