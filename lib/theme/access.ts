import { SubscriptionGuardResult } from "@/lib/subscriptions/guard";

/**
 * Menentukan apakah user boleh menggunakan theme tertentu
 * berdasarkan status subscription mereka.
 *
 * Rules:
 * - Theme Free: Selalu boleh (return true)
 * - Theme Premium:
 *   - Premium/Trial (allowed=true, grace=false/undefined): Boleh
 *   - Grace Period (allowed=true, grace=true): TIDAK BOLEH (soft lock)
 *   - Expired (allowed=false): TIDAK BOLEH (hard lock)
 */
export function canUseTheme(
  isPremiumTheme: boolean,
  sub: SubscriptionGuardResult,
): boolean {
  // 1. Theme Free -> Selalu Boleh
  if (!isPremiumTheme) {
    return true;
  }

  // 2. Theme Premium
  // Cek apakah subscription allowed (Premium/Trial/Grace)
  if (!sub.allowed) {
    return false; // Expired
  }

  // Cek spesifik Grace Period
  // Di Grace Period, user "allowed" masuk app, tapi fitur premium (seperti ganti theme) dikunci
  if ("grace" in sub && sub.grace) {
    return false;
  }

  // Sisa: Premium Active atau Trial -> Boleh
  return true;
}
