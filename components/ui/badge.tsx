import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors border",
  {
    variants: {
      variant: {
        default:
          "bg-sunflower-100/15 text-sunflower-100 border-sunflower-100/30",
        secondary:
          "bg-white-chalk-100/10 text-white-chalk-100/70 border-white-chalk-100/15",
        destructive:
          "bg-cadmium-red-100/15 text-cadmium-red-200 border-cadmium-red-100/30",
        outline:
          "text-white-chalk-100 border-white-chalk-100/20",
        success:
          "bg-pablano-100/15 text-pablano-200 border-pablano-100/30",
        info:
          "bg-munsell-blue-100/15 text-munsell-blue-200 border-munsell-blue-100/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
