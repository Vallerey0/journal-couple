type AnniversaryCountdownProps = {
  relationship_start_date: string;
  engaged_at?: string | null;
  married_at?: string | null;
  theme: {
    from: string;
    via: string;
    to: string;
  };
};

function getAnniversaryInfo(
  relationship_start_date: string,
  engaged_at?: string | null,
  married_at?: string | null,
) {
  const dates = [
    { label: "Pacaran", date: relationship_start_date, weight: 3 },
    { label: "Tunangan", date: engaged_at, weight: 2 },
    { label: "Menikah", date: married_at, weight: 1 }, // Weight for priority if same day
  ].filter((d) => !!d.date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAnniversaries = dates.map(({ label, date, weight }) => {
    const start = new Date(date!);
    let target = new Date(
      today.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    target.setHours(0, 0, 0, 0);

    if (target < today) {
      target = new Date(
        today.getFullYear() + 1,
        start.getMonth(),
        start.getDate(),
      );
      target.setHours(0, 0, 0, 0);
    }

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return { label, daysLeft: diffDays, weight };
  });

  // Sort by daysLeft, then by weight (smaller weight = higher priority, e.g. Menikah > Tunangan > Pacaran)
  upcomingAnniversaries.sort((a, b) => {
    if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
    return a.weight - b.weight;
  });

  const next = upcomingAnniversaries[0];

  return {
    label: next.label,
    daysLeft: next.daysLeft,
    isToday: next.daysLeft === 0,
  };
}

export function AnniversaryCountdown({
  relationship_start_date,
  engaged_at,
  married_at,
  theme,
}: AnniversaryCountdownProps) {
  const { label, daysLeft, isToday } = getAnniversaryInfo(
    relationship_start_date,
    engaged_at,
    married_at,
  );

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-2xl
        border border-white/40
        bg-background/60
        supports-[backdrop-filter]:backdrop-blur-xl
        shadow-sm
      "
      style={{
        background: `linear-gradient(
          135deg,
          ${theme.from},
          ${theme.via},
          ${theme.to}
        )`,
      }}
    >
      {/* ================= LIGHT STREAK (KACA MENGKILAT) ================= */}
      <div
        className="
          pointer-events-none
          absolute
          -top-1/2
          left-[-45%]
          h-[220%]
          w-[60%]
          rotate-[22deg]
          bg-gradient-to-r
          from-white/0
          via-white/45
          to-white/0
          opacity-60
        "
      />

      {/* ================= CONTENT ================= */}
      <div className="relative px-5 py-4 text-center">
        {isToday ? (
          <>
            <p className="text-[10px] uppercase tracking-widest text-black/60">
              Hari Spesial
            </p>

            <p className="mt-1 text-[18px] font-bold tracking-tight text-black/90">
              Anniversary {label} 🎉
            </p>

            <p className="mt-0.5 text-[12px] text-black/60">
              Rayakan hari ini dengan penuh cinta
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-widest text-black/60">
              Menuju Hari Bahagia
            </p>

            <div className="mt-1 flex flex-col items-center">
              <p className="text-[14px] font-bold text-black/80 leading-tight">
                Anniversary {label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[40px] font-black tracking-tighter leading-none text-black/90">
                  {daysLeft}
                </span>
                <span className="text-[13px] font-bold text-black/60 uppercase tracking-widest">
                  Hari Lagi
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
