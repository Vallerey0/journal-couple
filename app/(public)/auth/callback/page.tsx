"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client"; // pastikan file ini ada

function getHashParams() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  const sp = new URLSearchParams(hash);
  return {
    access_token: sp.get("access_token"),
    refresh_token: sp.get("refresh_token"),
    expires_in: sp.get("expires_in"),
    token_type: sp.get("token_type"),
    error: sp.get("error"),
    error_code: sp.get("error_code"),
    error_description: sp.get("error_description"),
  };
}

export default function AuthCallbackPage() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const next = sp.get("next") || "/login";
    const email = sp.get("email") || "";
    const type = sp.get("type") || "";

    const run = async () => {
      const supabase = createClient();

      // 1) kalau ada code (PKCE)
      const code = sp.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(
            `/login?error=${encodeURIComponent(
              "Link tidak valid atau sudah digunakan."
            )}${email ? `&email=${encodeURIComponent(email)}` : ""}`
          );
          return;
        }

        // sukses
        router.replace(
          `${next}${next.includes("?") ? "&" : "?"}activated=1${
            email ? `&email=${encodeURIComponent(email)}` : ""
          }`
        );
        return;
      }

      // 2) kalau pakai flow verify token -> hasilnya ada di hash (#access_token=...)
      const h = getHashParams();

      if (h.error) {
        router.replace(
          `/login?error=${encodeURIComponent(
            h.error_description || "Link tidak valid atau sudah kedaluwarsa."
          )}${email ? `&email=${encodeURIComponent(email)}` : ""}`
        );
        return;
      }

      if (h.access_token && h.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: h.access_token,
          refresh_token: h.refresh_token,
        });

        if (error) {
          router.replace(
            `/login?error=${encodeURIComponent(
              "Link tidak valid atau sudah kedaluwarsa."
            )}${email ? `&email=${encodeURIComponent(email)}` : ""}`
          );
          return;
        }

        // signup/recovery sama-sama bisa lewat sini
        if (type === "recovery") {
          router.replace(next); // contoh: /reset-password
          return;
        }

        router.replace(
          `${next}${next.includes("?") ? "&" : "?"}activated=1${
            email ? `&email=${encodeURIComponent(email)}` : ""
          }`
        );
        return;
      }

      // fallback: tidak ada apa-apa
      router.replace(
        `/login?error=${encodeURIComponent(
          "Link tidak valid atau sudah kedaluwarsa."
        )}${email ? `&email=${encodeURIComponent(email)}` : ""}`
      );
    };

    run();
  }, [sp, router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Memproses autentikasi...
        </p>
      </div>
    </main>
  );
}
