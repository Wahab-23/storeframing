import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white-chalk-100/15 bg-matt-black-200/50 px-3.5 py-2 text-xs text-white-chalk-100 shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-xs file:font-medium",
          "placeholder:text-white-chalk-100/35",
          "focus-visible:outline-none focus-visible:border-sunflower-100/60 focus-visible:ring-1 focus-visible:ring-sunflower-100/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
