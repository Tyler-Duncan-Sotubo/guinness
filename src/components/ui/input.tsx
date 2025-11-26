import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock } from "lucide-react";

interface InputProps extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, isPassword, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="relative flex items-center w-full">
        {isPassword && (
          <Lock className="absolute left-3 h-5 w-5 text-muted-foreground" />
        )}

        {leftIcon && !isPassword && (
          <span className="absolute left-3">{leftIcon}</span>
        )}

        <input
          type={inputType}
          className={cn(
            "flex h-12 w-full rounded-md border border-black/40 bg-transparent",
            "px-3 py-2 shadow-sm transition-colors placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // 16px on mobile, 14px from sm: up
            "text-[16px] sm:text-sm leading-normal",
            leftIcon || isPassword ? "pl-10" : "pl-5",
            rightIcon ? "pr-10" : "",
            "appearance-none",
            className
          )}
          ref={ref}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-muted-foreground focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        ) : (
          rightIcon && <span className="absolute right-3">{rightIcon}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
