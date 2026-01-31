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
          "relative aspect-[9/16] w-full overflow-hidden rounded-2xl border bg-muted transition-all duration-300",
          "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50",
          active && "ring-2 ring-primary ring-offset-2",
          locked && "opacity-80 grayscale-[0.8]",
          isGrace && "ring-2 ring-amber-500/50 ring-offset-2",
          !released && "opacity-90", // Visual cue for unreleased
          (pending || (isGrace && !active)) && "cursor-not-allowed opacity-80",
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

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          {active && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm">
              <Check className="h-3 w-3" />
              Applied
            </div>
          )}

          {/* Coming Soon Badge */}
          {!released && (
            <div className="flex items-center gap-1.5 rounded-full bg-blue-500/90 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
              <CalendarClock className="h-3 w-3" />
              Coming Soon
            </div>
          )}

          {isPremium && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm",
                locked ? "bg-rose-500/90" : "bg-amber-500/90",
              )}
            >
              {locked ? (
                <>
                  <Lock className="h-3 w-3" />
                  Premium
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Pro
                </>
              )}
            </div>
          )}

          {isGrace && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm">
              <AlertCircle className="h-3 w-3" />
              Grace Period
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
          <h3 className="font-medium text-white truncate">{name}</h3>
          <p className="text-[10px] text-white/80 line-clamp-1">
            {description}
          </p>
        </div>
      </button>
    </div>
  );
}
