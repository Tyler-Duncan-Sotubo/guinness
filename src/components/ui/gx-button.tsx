import * as React from "react";
import { cn } from "@/lib/utils";

type GXButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** "primary" = yellow, "secondary" = dark/outline */
  variant?: "primary" | "secondary";
};

export function GXButton({
  variant = "primary",
  className,
  children,
  ...props
}: GXButtonProps) {
  const base =
    "inline-flex items-center cursor-pointer justify-center px-6 py-3 rounded-full font-semibold uppercase tracking-[0.2em] text-xs md:text-sm transition-colors";

  const variants = {
    primary: "bg-amber-400 text-black hover:bg-amber-300",
    secondary:
      "bg-neutral-900 text-neutral-100 border border-neutral-700 hover:border-neutral-500",
  };

  return (
    <button {...props} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}
