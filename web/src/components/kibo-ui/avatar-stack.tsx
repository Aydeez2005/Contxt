import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface AvatarStackItem {
  name: string;
  src?: string;
}

export interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: AvatarStackItem[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AvatarStack({ avatars, max = 4, size = "md", className, ...props }: AvatarStackProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className={cn("flex -space-x-2", className)} {...props}>
      {visible.map((avatar, i) => (
        <Avatar key={i} className={cn(sizeClasses[size], "ring-2 ring-background")}>
          {avatar.src && <AvatarImage src={avatar.src} alt={avatar.name} />}
          <AvatarFallback>{initials(avatar.name)}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <Avatar className={cn(sizeClasses[size], "ring-2 ring-background bg-muted")}>
          <AvatarFallback>+{overflow}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
