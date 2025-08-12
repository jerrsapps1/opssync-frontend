import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Base button using brand CSS vars
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--brand-radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--brand-primary)] text-white hover:brightness-110",
        secondary:
          "bg-[color:var(--brand-secondary)] text-white hover:brightness-110",
        accent:
          "bg-[color:var(--brand-accent)] text-white hover:brightness-110",
        outline:
          "border border-[color:var(--brand-primary)] text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)] hover:text-white",
        ghost:
          "bg-transparent hover:bg-[color:var(--brand-primary)]/10 text-[color:var(--brand-primary)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-[calc(var(--brand-radius)-1px)]",
        lg: "h-11 px-8 rounded-[calc(var(--brand-radius)+1px)]",
        icon: "h-10 w-10",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
