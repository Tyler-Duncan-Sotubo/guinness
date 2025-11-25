import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // 👇 DEFAULT NOW MATCHES GXButton PRIMARY
        default:
          "bg-amber-400 text-black hover:bg-amber-300 shadow" +
          " rounded-full uppercase tracking-[0.2em] text-xs px-6 py-3",

        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 font-semibold",
        outline:
          "border border-input bg-monzo-innerBg shadow-sm hover:bg-accent hover:text-accent-foreground font-semibold",
        secondary:
          "text-secondary-foreground shadow-sm hover:bg-secondary/80 border",
        ghost: "hover:bg-monzo-innerBg hover:text-accent-foreground",
        link: "text-monzo-brandDark text-sm underline-offset-4 font-semibold",
        clean: "bg-transparent hover:bg-monzo-innerBg border-black/10 border",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isLoading && "cursor-not-allowed opacity-75"
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
