"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    const variants = {
      primary:
        "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft hover:shadow-glow focus:ring-primary-500/50 hover:from-primary-500 hover:to-primary-600",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-300 border border-slate-200/80",
      ghost:
        "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200 text-slate-600",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-soft",
    };
    const sizes = {
      sm: "px-3.5 py-2 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
