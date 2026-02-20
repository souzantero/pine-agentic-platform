"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <span
      className={cn(
        "font-extrabold tracking-widest select-none",
        sizeClasses[size],
        className
      )}
    >
      <span className="text-primary">PINE</span>
    </span>
  );
}
