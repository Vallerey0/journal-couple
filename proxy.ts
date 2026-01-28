import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// ✅ WAJIB: default export function bernama `proxy`
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ biarkan admin login lewat biar tidak loop
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // ✅ hanya lindungi /admin/*
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(req);

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // ❌ belum login → arahkan ke admin login
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ✅ whitelist admin email (opsional)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
  if (ADMIN_EMAIL && (user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "Akun ini bukan admin.");
    return NextResponse.redirect(url);
  }

  // ✅ cek role admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "Akses admin ditolak.");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
