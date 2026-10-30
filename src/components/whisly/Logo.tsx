import { useId } from "react";
import { cn } from "@/lib/utils";

/** Gradient waveform "W" mark used across Whisly screens. */
export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const bars = [
    { x: 4, h: 6 },
    { x: 14, h: 16 },
    { x: 24, h: 30 },
    { x: 96, h: 30 },
    { x: 106, h: 16 },
    { x: 116, h: 6 },
  ];
  return (
    <svg viewBox="0 0 120 60" className={cn("h-10 w-auto", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--brand-pink)" />
          <stop offset="0.55" stopColor="var(--brand-violet)" />
          <stop offset="1" stopColor="var(--brand-blue)" />
        </linearGradient>
      </defs>
      {bars.map((b) => (
        <rect
          key={b.x}
          x={b.x - 2.5}
          y={30 - b.h / 2}
          width="5"
          height={b.h}
          rx="2.5"
          fill={`url(#g${id})`}
        />
      ))}
      <path
        d="M36 10 L48 50 L60 18 L72 50 L84 10"
        fill="none"
        stroke={`url(#g${id})`}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className={size === "sm" ? "h-7" : "h-9"} />
      <span
        className={cn(
          "font-bold tracking-tight text-foreground",
          size === "sm" ? "text-2xl" : "text-3xl",
        )}
      >
        Whisly
      </span>
    </div>
  );
}

/** Soft lavender waves at the bottom of auth screens. */
export function WaveFooter() {
  return (
    <svg
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full"
      aria-hidden="true"
    >
      <path d="M0 40 C120 20 200 120 400 70 L400 120 L0 120 Z" fill="var(--accent)" />
      <path d="M0 60 C90 50 150 110 190 120 L0 120 Z" fill="var(--wave)" />
      <path d="M200 110 C280 110 330 60 400 40" stroke="var(--wave)" fill="none" strokeWidth="1.5" />
    </svg>
  );
}
