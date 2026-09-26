import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-xl border border-white-chalk-100/15 bg-matt-black-200/50 px-3.5 py-2 pr-9 text-xs text-white-chalk-100 shadow-sm transition-colors cursor-pointer",
            "focus-visible:outline-none focus-visible:border-sunflower-100/60 focus-visible:ring-1 focus-visible:ring-sunflower-100/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white-chalk-100/40" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
