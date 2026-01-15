import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlanView } from "@/lib/plan";

export function PlanStatus({
  view,
  note,
  planName,
}: {
  view: PlanView;
  note: string;
  planName?: string | null;
}) {
  const styles =
    view === "premium"
      ? "border-foreground/20 bg-foreground/5 text-foreground"
      : view === "trial"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";

  const label =
    view === "premium"
      ? planName
        ? `PREMIUM • ${planName}`
        : "PREMIUM"
      : view === "trial"
      ? "TRIAL"
      : "EXPIRED";

  return (
    <Link
      href="/subscribe"
      className={cn(
        "mb-2 block rounded-xl border px-3 py-2 text-sm",
        "transition-colors hover:bg-muted/50",
        styles
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{note}</span>
      </div>
    </Link>
  );
}
