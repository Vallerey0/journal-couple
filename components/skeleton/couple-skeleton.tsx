import { Skeleton } from "@/components/ui/skeleton";

export function CoupleSkeleton() {
  return (
    <div className="relative w-full space-y-6 pt-2">
      {/* ================= HERO SKELETON ================= */}
      <section className="relative rounded-[32px] overflow-hidden p-6 border border-zinc-200/50 bg-white/40 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40">
        <div className="flex flex-col items-center gap-6">
          {/* Avatar Pair */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>

          {/* Names */}
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Days Together */}
          <div className="w-full rounded-2xl bg-zinc-500/5 p-4 flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </section>

      {/* ================= DETAILS SKELETON ================= */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-32 ml-1" />
        <div className="grid grid-cols-1 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className={`rounded-[24px] p-5 border border-white/10 bg-gradient-to-br ${
                i === 0
                  ? "from-blue-500/5 to-cyan-500/5"
                  : "from-pink-500/5 to-rose-500/5"
              }`}
            >
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 opacity-50" />
                <div className="pt-2 space-y-2">
                  <Skeleton className="h-4 w-full opacity-30" />
                  <Skeleton className="h-4 w-2/3 opacity-30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ACTIONS SKELETON ================= */}
      <section className="grid grid-cols-1 gap-3 pt-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </section>
    </div>
  );
}
