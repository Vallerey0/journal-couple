import { Skeleton } from "@/components/ui/skeleton";
import { User, Crown, Palette, Music, LogOut } from "lucide-react";

export function SettingsSkeleton() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Blobs (Match Page Style) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 space-y-6 pt-4">
        {/* HEADER */}
        <header className="space-y-2">
          <Skeleton className="h-10 w-48 bg-purple-500/10" />
          <Skeleton className="h-4 w-64 bg-zinc-500/10" />
        </header>

        {/* PROFILE SECTION */}
        <section className="space-y-4">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 dark:bg-zinc-900/50 p-6 shadow-2xl">
            <div className="relative z-10 flex items-center gap-5">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIPTION STATUS */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <Crown className="w-3 h-3 text-amber-500/30" />
            <Skeleton className="h-3 w-32 bg-zinc-500/10" />
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/10 dark:bg-zinc-900/50 p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-40" />
              </div>
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </section>

        {/* MENU OPTIONS */}
        <section className="space-y-3">
          <Skeleton className="h-3 w-24 mx-2 bg-zinc-500/10" />
          <div className="grid grid-cols-1 gap-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </section>

        {/* LOGOUT BUTTON */}
        <Skeleton className="h-14 w-full rounded-2xl mt-4" />
      </div>
    </div>
  );
}
