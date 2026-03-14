"use client";

import { useState } from "react";
import { ProfilePhotoViewer } from "./profile-photo-viewer";
import { getPublicMediaUrl } from "@/lib/media/url";

type Props = {
  coupleId: string;
  maleName: string;
  femaleName: string;
  malePhotoUrl?: string | null;
  femalePhotoUrl?: string | null;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export function CoupleAvatar({
  coupleId,
  maleName,
  femaleName,
  malePhotoUrl,
  femalePhotoUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const items = [
    {
      id: "male",
      name: maleName,
      url: malePhotoUrl ? getPublicMediaUrl(malePhotoUrl) : null,
      initial: getInitial(maleName),
      type: "male" as const,
    },
    {
      id: "female",
      name: femaleName,
      url: femalePhotoUrl ? getPublicMediaUrl(femalePhotoUrl) : null,
      initial: getInitial(femaleName),
      type: "female" as const,
    },
  ];

  const handleOpen = (index: number) => {
    setInitialIndex(index);
    setOpen(true);
  };

  return (
    <>
      <div className="flex justify-center py-2">
        <div className="relative flex items-center">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150" />

          {/* Avatar 1 */}
          <button
            onClick={() => handleOpen(0)}
            className="
              relative z-10
              h-14 w-14
              rounded-full
              flex items-center justify-center
              text-lg font-bold
              bg-gradient-to-br
              from-indigo-400 to-cyan-400
              text-white
              ring-4 ring-white/20
              shadow-lg
              overflow-hidden
              transition-transform hover:scale-105 active:scale-95
            "
          >
            {items[0].url ? (
              <img
                src={items[0].url}
                alt={maleName}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitial(maleName)
            )}
          </button>

          {/* Avatar 2 */}
          <button
            onClick={() => handleOpen(1)}
            className="
              relative z-20
              -ml-4
              h-14 w-14
              rounded-full
              flex items-center justify-center
              text-lg font-bold
              bg-gradient-to-br
              from-pink-400 to-rose-400
              text-white
              ring-4 ring-white/20
              shadow-lg
              overflow-hidden
              transition-transform hover:scale-105 active:scale-95
            "
          >
            {items[1].url ? (
              <img
                src={items[1].url}
                alt={femaleName}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitial(femaleName)
            )}
          </button>
        </div>
      </div>

      <ProfilePhotoViewer
        items={items}
        initialIndex={initialIndex}
        open={open}
        onClose={() => setOpen(false)}
        coupleId={coupleId}
      />
    </>
  );
}
