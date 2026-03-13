import { Skeleton } from "@/components/ui/skeleton";
import { Music, Play, Plus, Clock } from "lucide-react";

export function MusicSkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-0 py-8 max-w-2xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Music className="w-5 h-5 text-purple-500/30" />
              </div>
              <Skeleton className="h-8 w-48 bg-purple-500/10" />
            </div>
            <Skeleton className="h-4 w-64 bg-zinc-500/10" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex p-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl border border-white/20 w-fit">
            <Skeleton className="h-9 w-28 rounded-xl mr-1" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>

          {/* Playlist Section Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>

            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/20 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/40"
                >
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-24 opacity-50" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Library Section Skeleton */}
          <div className="space-y-4 pt-4">
            <Skeleton className="h-5 w-32 px-2" />
            <div className="grid grid-cols-1 gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/20 bg-white/30 backdrop-blur-md dark:border-white/5 dark:bg-zinc-900/20"
                >
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-zinc-400/30" />
                      <Skeleton className="h-3 w-12 opacity-50" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
