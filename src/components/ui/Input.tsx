"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      size = "md",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    const sizes = {
      sm: "h-9 text-sm",
      md: "h-10 text-sm",
      lg: "h-11 text-base",
    };
    const paddingX = {
      sm: `${leftIcon ? "pl-8" : "pl-3"} ${rightIcon ? "pr-8" : "pr-3"}`,
      md: `${leftIcon ? "pl-9" : "pl-3.5"} ${rightIcon ? "pr-9" : "pr-3.5"}`,
      lg: `${leftIcon ? "pl-10" : "pl-4"} ${rightIcon ? "pr-10" : "pr-4"}`,
    };
    const iconPos = {
      sm: "h-4 w-4",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 ${iconPos[size]}`}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border bg-white text-neutral-900 shadow-xs transition-colors duration-150 placeholder:text-neutral-400 focus:outline-none dark:bg-neutral-900 dark:text-neutral-100
              ${sizes[size]} ${paddingX[size]}
              ${
                error
                  ? "border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20"
                  : "border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-700 dark:focus:border-brand-500"
              }
              ${className}`}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span
              className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 ${iconPos[size]}`}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm font-medium text-danger-600 dark:text-danger-400"
            role="alert"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={`${inputId}-hint`}
            className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
