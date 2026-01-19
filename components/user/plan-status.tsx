import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlanView } from "@/lib/plan";
import { formatRemainingShort } from "@/lib/duration";

type Props = {
  view: PlanView;
  note: string;
  activeUntil?: string | null;
};

export function PlanStatus({ view, note, activeUntil }: Props) {
  const styles =
    view === "premium"
      ? "border-foreground/20 bg-foreground/5 text-foreground"
      : view === "trial"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";

  let title: string;
  let subtitle: string;

  if (view === "premium") {
    title = "Premium";
    subtitle =
      activeUntil != null ? `Aktif ${formatRemainingShort(activeUntil)}` : note;
  } else if (view === "trial") {
    title = "Trial";
    subtitle = note;
  } else {
    title = "Langganan berakhir";
    subtitle = note;
  }

  return (
    <Link
      href="/subscribe"
      className={cn(
        "mb-2 block rounded-xl border px-3 py-2",
        "transition-colors hover:bg-muted/50",
        styles,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
    </Link>
  );
}
