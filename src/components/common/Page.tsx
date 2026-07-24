import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 animate-rise">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl gradient-brand shadow-glow">
            <Icon className="size-5 text-primary-foreground" />
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  tone?: "primary" | "blue" | "pink" | "success";
}) {
  const tones: Record<string, string> = {
    primary: "text-primary",
    blue: "text-brand-blue",
    pink: "text-brand-pink",
    success: "text-success",
  };
  return (
    <Card className="glass-card gap-0 border-0 p-5 transition-smooth hover:-translate-y-0.5 hover:shadow-float">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className={cn("size-[18px]", tones[tone])} />
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl gradient-soft">
        <Icon className="size-6 text-primary" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card h-40 animate-pulse" />
      ))}
    </div>
  );
}
