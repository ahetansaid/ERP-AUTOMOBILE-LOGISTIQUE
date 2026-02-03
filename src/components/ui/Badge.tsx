import { ReactNode } from "react";

const colors: Record<string, string> = {
  slate: "bg-slate-100 text-slate-800",
  blue: "bg-blue-100 text-blue-800",
  cyan: "bg-cyan-100 text-cyan-800",
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
  green: "bg-green-100 text-green-800",
  violet: "bg-violet-100 text-violet-800",
  red: "bg-red-100 text-red-800",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color] ?? colors.slate}`}
    >
      {children}
    </span>
  );
}
