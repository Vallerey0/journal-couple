"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { updateTheme } from "./theme.action";
import Image, { StaticImageData } from "next/image";
import {
  Check,
  Lock,
  Sparkles,
  AlertCircle,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { SubscriptionGuardResult } from "@/lib/subscriptions/guard";
import { canUseTheme } from "@/lib/theme/access";
import { useRouter } from "next/navigation";
import { isThemeReleased, parseReleaseDate } from "@/themes/registry";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type Props = {
  code: string;
  name: string;
  description: string;
  thumbnail: StaticImageData;
  isPremium: boolean;
  active: boolean;
  subscription: SubscriptionGuardResult;
  tags: string[];
  releaseAt?: string;
};

export default function ThemeCard({
  code,
  name,
  description,
  thumbnail,
  isPremium,
  active,
  subscription,
  tags,
  releaseAt,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Logic Akses
  const allowed = canUseTheme(isPremium, subscription);
  const isGrace = isPremium && "grace" in subscription && subscription.grace;

  // Logic Release
  const released = isThemeReleased({ releaseAt });

  // Logic Tampilan
  // Lock tampil jika TIDAK allowed (Expired/Free user mencoba akses Premium)
  // KECUALI Grace period -> tidak dilock visual, tapi tombol apply mati
  const locked = !allowed && !isGrace;

  const handleClick = () => {
    if (pending) return;

    // 1. Cek Release Status
    if (!released && releaseAt) {
      const dateStr = format(parseReleaseDate(releaseAt), "d MMMM yyyy", {
        locale: id,
      });
      toast.message("Coming Soon", {
        description: `Theme "${name}" akan tersedia pada ${dateStr}.`,
      });
      return;
    }

    // 2. Cek Lock Status (Expired)
    if (locked) {
      router.push("/subscribe");
      return;
    }

    // 3. Cek Grace Period (Soft Lock)
    if (isGrace) {
      return;
    }

    // 4. Execute Action
    startTransition(() => updateTheme(code));
  };

  return (
    <div className="group relative flex flex-col gap-2">
      {/* Thumbnail Container */}
      <button
        onClick={handleClick}
        disabled={pending || (isGrace && !active)}
        className={cn(
          "relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 transition-all duration-500",
          "hover:shadow-2xl hover:scale-[1.02] focus:outline-none",
          active
            ? "ring-4 ring-pink-500/50 shadow-pink-500/20 shadow-xl scale-[1.02]"
            : "hover:ring-2 hover:ring-white/50 dark:hover:ring-white/20",
          locked && "opacity-80 grayscale-[0.8]",
          isGrace && "ring-4 ring-amber-500/50",
          !released && "opacity-90", // Visual cue for unreleased
          (pending || (isGrace && !active)) && "cursor-not-allowed opacity-80",
          "bg-white/5 dark:bg-zinc-900/5", // Glass base without blur
        )}
      >
        <Image
          src={thumbnail}
          alt={name}
          fill
          placeholder="blur"
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            pending && "opacity-50",
            !released && "grayscale-[0.5]", // Sedikit grayscale untuk unreleased
          )}
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Loading Spinner */}
        {pending && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-white shadow-lg" />
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start z-10">
          {active && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg border border-white/20">
              <Check className="h-2.5 w-2.5" />
              Applied
            </div>
          )}

          {/* Coming Soon Badge */}
          {!released && (
            <div className="flex items-center gap-1 rounded-full bg-blue-500/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg border border-white/20">
              <CalendarClock className="h-2.5 w-2.5" />
              Soon
            </div>
          )}

          {isPremium && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-lg border border-white/20",
                locked
                  ? "bg-rose-500/90"
                  : "bg-gradient-to-r from-amber-500 to-orange-500",
              )}
            >
              {locked ? (
                <>
                  <Lock className="h-2.5 w-2.5" />
                  Premium
                </>
              ) : (
                <>
                  <Sparkles className="h-2.5 w-2.5" />
                  Pro
                </>
              )}
            </div>
          )}

          {isGrace && (
            <div className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg backdrop-blur-md border border-white/20">
              <AlertCircle className="h-2.5 w-2.5" />
              Grace
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-left z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10">
          <h3 className="font-bold text-white truncate text-sm shadow-black/50 drop-shadow-sm">
            {name}
          </h3>
          <p className="text-[10px] text-white/80 line-clamp-1 font-medium opacity-90">
            {description}
          </p>
        </div>
      </button>
    </div>
  );
}
