import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  icon?: ReactNode;
  className?: string;
}

const toneCls: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

export function KpiCard({ label, value, sub, tone = "default", icon, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-4 py-3.5 shadow-xs transition-shadow hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && <div className="text-muted-foreground/70">{icon}</div>}
      </div>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular leading-none", toneCls[tone])}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground tabular">{sub}</p>}
    </div>
  );
}
