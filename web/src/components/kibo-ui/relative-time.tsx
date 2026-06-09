"use client";
import * as React from "react";

const INTERVALS = [
  { label: "year", seconds: 31536000 },
  { label: "month", seconds: 2592000 },
  { label: "week", seconds: 604800 },
  { label: "day", seconds: 86400 },
  { label: "hour", seconds: 3600 },
  { label: "minute", seconds: 60 },
  { label: "second", seconds: 1 },
] as const;

function getRelative(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  for (const { label, seconds: s } of INTERVALS) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count} ${label}${count !== 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export interface RelativeTimeProps extends React.HTMLAttributes<HTMLTimeElement> {
  date: Date | string;
}

export function RelativeTime({ date, ...props }: RelativeTimeProps) {
  const d = typeof date === "string" ? new Date(date) : date;
  const [text, setText] = React.useState(() => getRelative(d));

  React.useEffect(() => {
    const id = setInterval(() => setText(getRelative(d)), 30_000);
    return () => clearInterval(id);
  }, [d]);

  return (
    <time dateTime={d.toISOString()} title={d.toLocaleString()} {...props}>
      {text}
    </time>
  );
}
