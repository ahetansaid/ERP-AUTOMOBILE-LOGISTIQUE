"use client";

import { type HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`card-hover overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-soft glow-primary-hover ${className}`}
        {...props}
      >
        {title && (
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-sm font-semibold tracking-tight text-slate-800">
              {title}
            </h3>
          </div>
        )}
        <div className={title ? "p-6" : "p-6"}>{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
