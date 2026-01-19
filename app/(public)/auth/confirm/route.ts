import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

function safeNextPath(next: string | null) {
  // hanya izinkan path internal
  if (!next) return "/login";
  if (!next.startsWith("/")) return "/login";
  // hindari loop balik ke confirm lagi
  if (next.startsWith("/auth/confirm")) return "/login";
  return next;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextRaw = url.searchParams.get("next");
  const next = safeNextPath(nextRaw);

  // email opsional untuk autofill login (kalau kamu kirim di next)
  const email = url.searchParams.get("email") || "";

  // kalau param kurang, jangan tampilkan teknis
  if (!token_hash || !type) {
    const to = new URL("/login", url.origin);
    to.searchParams.set("error", "invalid_activation");
    if (email) to.searchParams.set("email", email);
    return NextResponse.redirect(to);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    // Paling sering: link sudah dipakai / expired
    // UX terbaik: arahkan ke login dengan status "already"
    const to = new URL("/login", url.origin);
    to.searchParams.set("already", "1");
    if (email) to.searchParams.set("email", email);
    return NextResponse.redirect(to);
  }

  // sukses: arahkan ke next, tapi pastikan banner activated muncul
  const to = new URL(next, url.origin);

  // tambahkan activated=1 jika belum ada
  if (!to.searchParams.has("activated")) {
    to.searchParams.set("activated", "1");
  }

  // bawa email untuk autofill jika belum ada
  if (email && !to.searchParams.has("email")) {
    to.searchParams.set("email", email);
  }

  return NextResponse.redirect(to);
}
