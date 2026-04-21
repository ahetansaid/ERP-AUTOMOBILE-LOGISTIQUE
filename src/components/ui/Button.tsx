"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "danger"
    | "success"
    | "subtle";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 ease-out-expo focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none";

    const variants = {
      primary:
        "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm hover:shadow-glow-sm hover:from-brand-400 hover:to-brand-500 focus-visible:ring-brand-500/60",
      secondary:
        "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-400 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:border-neutral-700",
      ghost:
        "bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-300 dark:text-neutral-300 dark:hover:bg-neutral-800",
      outline:
        "bg-transparent text-brand-700 border border-brand-200 hover:bg-brand-50 hover:border-brand-300 focus-visible:ring-brand-500/40 dark:text-brand-300 dark:border-brand-900 dark:hover:bg-brand-950/40",
      danger:
        "bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-500/60 shadow-sm",
      success:
        "bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-500/60 shadow-sm",
      subtle:
        "bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500/40 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900/60",
    };

    const sizes = {
      xs: "h-8 px-3 text-xs",
      sm: "h-9 px-3.5 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-5 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="3"
              />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
        <span
          className={`inline-flex items-center gap-2 ${loading ? "opacity-0" : ""}`}
        >
          {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
          {children}
          {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
