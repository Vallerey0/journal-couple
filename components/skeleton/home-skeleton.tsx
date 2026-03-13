import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="relative w-full text-foreground">
      {/* ================= AMBIENT BACKGROUND ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 space-y-6 pt-2">
        {/* HEADER SECTION SKELETON */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* PLAN STATUS CARD SKELETON */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-[32px] opacity-75" />
          <div className="relative rounded-[32px] bg-card/50 border border-border p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>

        {/* QUICK ACTIONS SKELETON */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-[32px] border border-border bg-card/40 p-6 flex flex-col justify-between overflow-hidden"
            >
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* SLUG MANAGER SKELETON */}
        <div className="rounded-[32px] border border-border bg-card/40 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
