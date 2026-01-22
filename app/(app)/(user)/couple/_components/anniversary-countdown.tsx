type AnniversaryCountdownProps = {
  relationship_start_date: string;
  theme: {
    from: string;
    via: string;
    to: string;
  };
};

function getAnniversaryInfo(startDate: string) {
  const start = new Date(startDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const anniversaryThisYear = new Date(
    today.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  anniversaryThisYear.setHours(0, 0, 0, 0);

  let target = anniversaryThisYear;

  if (anniversaryThisYear < today) {
    target = new Date(
      today.getFullYear() + 1,
      start.getMonth(),
      start.getDate(),
    );
    target.setHours(0, 0, 0, 0);
  }

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return {
    daysLeft: diffDays,
    isToday: diffDays === 0,
  };
}

export function AnniversaryCountdown({
  relationship_start_date,
  theme,
}: AnniversaryCountdownProps) {
  const { daysLeft, isToday } = getAnniversaryInfo(relationship_start_date);

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
              Hari ini
            </p>

            <p className="mt-1 text-[20px] font-semibold tracking-tight">
              Selamat Anniversary
            </p>

            <p className="mt-0.5 text-[13px] text-black/60">
              Rayakan hari ini dengan penuh cinta
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-widest text-black/60">
              Anniversary berikutnya
            </p>

            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-[36px] font-semibold tracking-tight leading-none">
                {daysLeft}
              </span>
              <span className="text-[13px] text-black/60">hari</span>
            </div>

            <p className="mt-0.5 text-[12px] text-black/60">
              Jangan lupa rayakan
            </p>
          </>
        )}
      </div>
    </div>
  );
}
