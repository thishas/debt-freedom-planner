import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Hero gradient style
        default:
          "gradient-hero text-primary-foreground shadow-card hover:shadow-hero hover:-translate-y-0.5 active:translate-y-0 active:shadow-card",
        // Destructive: Solid red, no gradient
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        // Outline: Teal outline with transparent background
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary/5 hover:border-primary/80",
        // Secondary: Soft mint/accent background
        secondary:
          "bg-accent/20 text-primary border border-accent/30 hover:bg-accent/30 hover:border-accent/50",
        // Ghost: Subtle hover effect
        ghost:
          "hover:bg-muted hover:text-foreground",
        // Link: Underlined text link
        link:
          "text-primary underline-offset-4 hover:underline",
        // Hero variant: Explicit gradient button
        hero:
          "gradient-hero text-primary-foreground shadow-hero hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0",
        // Soft variant: Very subtle background
        soft:
          "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/10",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
