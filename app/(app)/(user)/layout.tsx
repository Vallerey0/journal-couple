import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/user/bottom-nav";
import Script from "next/script";
import { Metadata } from "next";
import UserIdleLogout from "@/components/user/user-idle-logout";
import { GlobalLoading } from "@/components/ui/global-loading";

export const metadata: Metadata = {
  title: {
    template: "%s | Journal Couple",
    default: "Dashboard | Journal Couple",
  },
  description: "Your shared space.",
};

export default async function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // ✅ belum login -> jangan tampilkan UI user area
  if (!data.user) {
    redirect("/login");
  }

  const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  const snapSrc = isProd
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-zinc-200 via-purple-200 to-pink-200 dark:from-zinc-950 dark:via-purple-950 dark:to-pink-950">
      {/* Global session guard for user area */}
      <UserIdleLogout idleMinutes={30} />
      <Script
        src={snapSrc}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
