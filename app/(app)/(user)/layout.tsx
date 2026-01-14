import type { ReactNode } from "react";
import { BottomNav } from "@/components/user/bottom-nav";
import Script from "next/script";

export default function UserLayout({ children }: { children: ReactNode }) {
  const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  const snapSrc = isProd
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  return (
    <div className="min-h-dvh bg-background">
      {/* ✅ inject snap.js tanpa mengubah layout */}
      {clientKey ? (
        <Script
          src={snapSrc}
          data-client-key={clientKey}
          strategy="afterInteractive"
        />
      ) : null}

      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
