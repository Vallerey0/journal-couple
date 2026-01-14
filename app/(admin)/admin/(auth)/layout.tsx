import type { ReactNode } from "react";

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4">
        {children}
      </main>
    </div>
  );
}
