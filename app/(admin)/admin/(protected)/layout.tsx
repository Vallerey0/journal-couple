import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import AdminIdleLogout from "@/components/admin/AdminIdleLogout";

export default function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {/* ✅ WAJIB: aktif hanya untuk halaman admin yang protected */}
      <AdminIdleLogout idleMinutes={15} />

      <AdminShell>{children}</AdminShell>
    </>
  );
}
