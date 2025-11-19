import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type GXButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";

  /** Optional image URL or React node to show on the LEFT side */
  leftIcon?: string | React.ReactNode;

  /** Optional alt text if using an image URL */
  leftIconAlt?: string;
};

export function GXButton({
  variant = "primary",
  className,
  children,
  leftIcon,
  leftIconAlt = "",
  ...props
}: GXButtonProps) {
  const base =
    "inline-flex items-center cursor-pointer justify-center gap-2 px-6 py-3 rounded-full font-semibold uppercase tracking-[0.2em] text-xs transition-colors";

  const variants = {
    primary: "bg-amber-400 text-black hover:bg-amber-300",
    secondary:
      "bg-black text-neutral-100 border border-neutral-700 hover:border-neutral-500",
  };

  return (
    <button {...props} className={cn(base, variants[variant], className)}>
      {/* LEFT ICON */}
      {leftIcon &&
        (typeof leftIcon === "string" ? (
          <Image src={leftIcon} alt={leftIconAlt} width={23} height={23} />
        ) : (
          <span className="mr-2 flex items-center">{leftIcon}</span>
        ))}

      {children}
    </button>
  );
}
