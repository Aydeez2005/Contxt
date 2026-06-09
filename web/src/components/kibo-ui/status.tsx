import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
  {
    variants: {
      variant: {
        success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        error:   "bg-red-500/10 border-red-500/20 text-red-400",
        info:    "bg-blue-500/10 border-blue-500/20 text-blue-400",
        neutral: "bg-white/5 border-white/8 text-white/40",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

const dotVariants = cva("h-1.5 w-1.5 rounded-full", {
  variants: {
    variant: {
      success: "bg-emerald-400",
      warning: "bg-amber-400",
      error:   "bg-red-400",
      info:    "bg-blue-400",
      neutral: "bg-white/30",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface StatusProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusVariants> {}

export function Status({ className, variant, children, ...props }: StatusProps) {
  return (
    <span className={cn(statusVariants({ variant }), className)} {...props}>
      <span className={cn(dotVariants({ variant }))} />
      {children}
    </span>
  );
}
