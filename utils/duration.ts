/* ===========================
   FORMAT SISA WAKTU PREMIUM (LENGKAP)
   → 1 tahun 5 bulan 14 hari
=========================== */
export function formatRemainingFull(targetIso: string, now: Date = new Date()) {
  const target = new Date(targetIso);
  if (isNaN(target.getTime())) return "—";

  let diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Berakhir";

  let totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const years = Math.floor(totalDays / 365);
  totalDays -= years * 365;

  const months = Math.floor(totalDays / 30);
  totalDays -= months * 30;

  const days = totalDays;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0) parts.push(`${months} bulan`);
  if (days > 0) parts.push(`${days} hari`);

  return parts.join(" ");
}

/* ===========================
   FORMAT SISA WAKTU RINGKAS
   → 1 tahun 5 bulan
=========================== */
export function formatRemainingShort(
  targetIso: string,
  now: Date = new Date(),
) {
  const target = new Date(targetIso);
  if (isNaN(target.getTime())) return "—";

  let diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Berakhir";

  let totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const years = Math.floor(totalDays / 365);
  totalDays -= years * 365;

  const months = Math.floor(totalDays / 30);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0) parts.push(`${months} bulan`);

  return parts.join(" ");
}

/* ===========================
   COUNTDOWN CHECKOUT
   → 2j 14m / 45d
=========================== */
export function formatCountdown(targetIso: string, now: Date = new Date()) {
  const target = new Date(targetIso);
  if (isNaN(target.getTime())) return "—";

  let diff = Math.max(0, target.getTime() - now.getTime());

  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;

  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * 1000 * 60;

  const seconds = Math.floor(diff / 1000);

  if (hours > 0) return `${hours}j ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}d`;

  return `${seconds}d`;
}

/* ===========================
   FORMAT TANGGAL ID
=========================== */
export function formatDateID(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(d);
}
