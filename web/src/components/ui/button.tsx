"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#F8F7F2] text-[#141310] hover:bg-white rounded-xl shadow-sm hover:-translate-y-px active:translate-y-0 border-0",
        destructive:
          "bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 rounded-xl",
        outline:
          "border border-white/10 bg-white/4 backdrop-blur-sm text-white/80 hover:bg-white/8 hover:text-white hover:border-white/18 rounded-xl",
        secondary:
          "bg-white/6 border border-white/8 text-white/60 hover:bg-white/10 hover:text-white rounded-xl",
        ghost:
          "text-white/50 hover:text-white hover:bg-white/6 rounded-xl",
        link:
          "text-white/60 underline-offset-4 hover:underline hover:text-white",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-11 px-6 text-sm rounded-xl",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
