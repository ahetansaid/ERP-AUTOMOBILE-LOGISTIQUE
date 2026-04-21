"use client";

import { type HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "brand"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "outline";
  size?: "sm" | "md";
  /** Point coloré à gauche (style Notion/Linear) */
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className = "", variant = "default", size = "sm", dot = false, children, ...props },
    ref
  ) => {
    const variants = {
      default:
        "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
      brand:
        "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300",
      success:
        "bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300",
      warning:
        "bg-warning-50 text-warning-700 dark:bg-warning-950/60 dark:text-warning-300",
      danger:
        "bg-danger-50 text-danger-700 dark:bg-danger-950/60 dark:text-danger-300",
      info: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
      outline:
        "bg-transparent text-neutral-700 border border-neutral-200 dark:text-neutral-300 dark:border-neutral-700",
    };

    const dots = {
      default: "bg-neutral-500",
      brand: "bg-brand-500",
      success: "bg-accent-500",
      warning: "bg-warning-500",
      danger: "bg-danger-500",
      info: "bg-sky-500",
      outline: "bg-neutral-500",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {dot && (
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${dots[variant]}`}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
