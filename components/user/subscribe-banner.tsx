import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubscribeBanner({
  show = true,
  title = "Upgrade ke Premium",
  desc = "Buka fitur eksklusif untuk journal & presentasi kamu.",
  cta = "Subscribe",
}: {
  show?: boolean;
  title?: string;
  desc?: string;
  cta?: string;
}) {
  if (!show) return null;

  return (
    <div className="relative overflow-hidden bg-card/40 dark:bg-white/5 p-6 backdrop-blur-xl transition-colors">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-[40px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20">
            <Crown className="h-6 w-6" />
            <div className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                {title}
              </h3>
              <div className="flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">
                <Sparkles className="mr-1 h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Pro
                </span>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {desc}
            </p>
          </div>
        </div>

        <Button
          asChild
          className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 border-0 transition-all active:scale-[0.98] sm:w-auto px-6 group"
        >
          <Link
            href="/subscribe"
            className="flex items-center justify-center gap-2"
          >
            {cta}
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
