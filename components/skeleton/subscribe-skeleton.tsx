import { Skeleton } from "@/components/ui/skeleton";

export function SubscribeSkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* BACKGROUND BLOBS (Match Page Style) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-0 py-8 max-w-xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="text-center space-y-3">
          <Skeleton className="mx-auto h-10 w-64 bg-pink-500/10" />
          <Skeleton className="mx-auto h-4 w-80 bg-zinc-500/10" />
          <Skeleton className="mx-auto h-8 w-48 rounded-full bg-green-500/5 mt-4" />
        </div>

        {/* Plans Grid Skeleton */}
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="relative flex items-start gap-4 rounded-2xl border border-zinc-200/50 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60"
            >
              <Skeleton className="h-5 w-5 rounded-full mt-1" />
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full bg-pink-500/5" />
                </div>
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Coupon Section Skeleton */}
        <div className="p-5 rounded-2xl border border-zinc-200/50 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/40 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="pt-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="mx-auto h-3 w-64 mt-3" />
        </div>
      </div>
    </div>
  );
}
