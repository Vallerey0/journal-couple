import type { ReactNode } from "react";

export default function SubscribeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-md px-4 pb-6 pt-4">{children}</main>
    </div>
  );
}
