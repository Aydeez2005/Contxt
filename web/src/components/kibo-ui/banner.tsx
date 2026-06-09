import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const bannerVariants = cva(
  "relative flex w-full items-start gap-3 rounded-xl border p-4 text-sm",
  {
    variants: {
      variant: {
        default: "border-white/8 bg-white/4 text-white/80",
        info:    "border-blue-500/20 bg-blue-500/8 text-blue-300",
        success: "border-emerald-500/20 bg-emerald-500/8 text-emerald-300",
        warning: "border-amber-500/20 bg-amber-500/8 text-amber-300",
        error:   "border-red-500/20 bg-red-500/8 text-red-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  onDismiss?: () => void;
}

export function Banner({ className, variant, onDismiss, children, ...props }: BannerProps) {
  return (
    <div className={cn(bannerVariants({ variant }), className)} {...props}>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
