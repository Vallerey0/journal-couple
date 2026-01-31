import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlanView } from "@/utils/plan";
import { formatRemainingShort } from "@/utils/duration";

type Props = {
  view: PlanView;
  note: string;
  activeUntil?: string | null;
};

export function PlanStatus({ view, note, activeUntil }: Props) {
  const textStyles =
    view === "premium"
      ? "text-foreground"
      : view === "trial"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

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
        "block w-full rounded-[28px] px-5 py-4",
        "transition-all active:scale-[0.98]",
        textStyles,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view === "premium" && (
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
          )}
          <span className="text-base font-bold tracking-tight">{title}</span>
        </div>
        <span className="text-xs font-medium opacity-70 uppercase tracking-wide">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
