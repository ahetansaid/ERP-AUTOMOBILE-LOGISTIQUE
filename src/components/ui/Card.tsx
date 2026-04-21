"use client";

import { type HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  /** Pas de padding interne — pour wrapper un tableau par exemple */
  flush?: boolean;
  /** Variante visuelle */
  variant?: "default" | "glass" | "ghost" | "outline";
  /** Active l'effet hover (translateY + shadow) */
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = "",
      title,
      description,
      action,
      flush = false,
      variant = "default",
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default:
        "bg-white border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800",
      glass:
        "glass",
      ghost:
        "bg-transparent border border-transparent",
      outline:
        "bg-transparent border border-neutral-200 dark:border-neutral-800",
    };

    return (
      <div
        ref={ref}
        className={`rounded-2xl overflow-hidden ${variants[variant]} ${
          interactive ? "card-hover" : ""
        } ${className}`}
        {...props}
      >
        {(title || action) && (
          <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
            <div className="min-w-0">
              {title && (
                <h3 className="truncate text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        <div className={flush ? "" : "p-6"}>{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
