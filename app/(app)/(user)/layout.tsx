import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { BottomNav } from "@/components/user/bottom-nav";
import Script from "next/script";

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
    <div className="min-h-dvh bg-background">
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
