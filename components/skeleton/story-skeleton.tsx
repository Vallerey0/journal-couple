import { Skeleton } from "@/components/ui/skeleton";

export function StorySkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* BACKGROUND BLOBS (Match Page Style) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      {/* Header Skeleton */}
      <div className="relative z-10 pt-8 px-6 text-center space-y-3">
        <Skeleton className="mx-auto h-8 w-40 bg-pink-500/10" />
        <Skeleton className="mx-auto h-4 w-60 bg-zinc-500/10" />
      </div>

      {/* Timeline Skeleton */}
      <div className="relative z-10 w-full max-w-md mx-auto py-12 px-4 min-h-[800px]">
        {/* Mock Rope (Simple Vertical Line) */}
        <div className="absolute left-1/2 top-20 bottom-20 w-1 bg-zinc-200/30 -translate-x-1/2 rounded-full" />

        {/* Nodes Skeleton (S-Curve mimic) */}
        <div className="relative z-10 space-y-24 pt-20">
          {[{ x: -25 }, { x: -80 }, { x: 0 }, { x: 80 }, { x: 0 }].map(
            (pos, i) => (
              <div
                key={i}
                className="flex flex-col items-center"
                style={{ transform: `translateX(${pos.x}px)` }}
              >
                <div className="relative">
                  {/* Node Circle */}
                  <Skeleton className="h-16 w-16 rounded-full border-4 border-white shadow-lg" />
                  {/* Small Pulse Dot */}
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-pink-500/20 animate-pulse" />
                </div>
                {/* Node Title */}
                <Skeleton className="mt-3 h-4 w-24 rounded-full" />
                <Skeleton className="mt-2 h-3 w-32 rounded-full opacity-50" />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
