import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunflower-100/50 disabled:pointer-events-none disabled:opacity-40 cursor-pointer shadow-sm active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-sunflower-100 text-matt-black-100 font-bold hover:bg-sunflower-200 shadow-md shadow-sunflower-100/20",
        primary:
          "bg-sunflower-100 text-matt-black-100 font-bold hover:bg-sunflower-200 shadow-md shadow-sunflower-100/20",
        destructive:
          "bg-cadmium-red-100/20 border border-cadmium-red-100/30 text-cadmium-red-200 hover:bg-cadmium-red-100/30",
        outline:
          "border border-white-chalk-100/15 bg-matt-black-200/50 text-white-chalk-100 hover:bg-matt-black-300 hover:border-white-chalk-100/25",
        secondary:
          "bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 border border-white-chalk-100/10",
        ghost:
          "text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/5",
        link:
          "text-sunflower-100 underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-[11px]",
        lg: "h-10 rounded-xl px-5 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          buttonVariants({ variant, size }),
          (children.props as any)?.className,
          className
        ),
        ref,
        ...props,
      });
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
