import { Skeleton } from "@/components/ui/skeleton";

export function GallerySkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* BACKGROUND BLOBS (Match Page Style) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 space-y-6 pt-4">
        {/* Header Skeleton */}
        <header className="space-y-1 px-1">
          <Skeleton className="h-8 w-48 bg-pink-500/10" />
          <Skeleton className="h-4 w-64 bg-zinc-500/10" />
        </header>

        {/* Sticky Header Skeleton */}
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/40 p-6 shadow-xl dark:border-white/10 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-32 opacity-50" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
          {/* Progress Bar Skeleton */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-200/50 dark:bg-white/10">
            <Skeleton className="h-full w-1/3 rounded-full bg-pink-500/20" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-white/20 bg-white/30 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
            >
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
