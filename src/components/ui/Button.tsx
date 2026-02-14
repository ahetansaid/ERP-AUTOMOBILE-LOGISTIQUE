import { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-accent-600 text-white shadow-card hover:bg-accent-700 hover:shadow-card-hover active:bg-accent-800",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
  outline:
    "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
