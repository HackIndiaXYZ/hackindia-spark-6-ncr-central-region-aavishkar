import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[120px] w-full resize-y rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/40",
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
Textarea.displayName = "Textarea";

