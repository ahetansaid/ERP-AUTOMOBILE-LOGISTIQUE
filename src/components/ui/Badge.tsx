import { ReactNode } from "react";

const colors: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  cyan: "bg-cyan-100 text-cyan-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  green: "bg-green-100 text-green-700",
  violet: "bg-violet-100 text-violet-700",
  red: "bg-red-100 text-red-700",
  accent: "bg-accent-100 text-accent-800",
};

export function Badge({
  children,
  color = "slate",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${colors[color] ?? colors.slate}`}
    >
      {children}
    </span>
  );
}
