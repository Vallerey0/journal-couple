"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <AdminSidebar
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="text-sm font-semibold">Admin</div>

          <div className="ml-auto flex items-center gap-2">
            {/* nanti: search, admin menu, logout */}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl md:grid-cols-[16rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-14 h-[calc(100dvh-3.5rem)]">
            <AdminSidebar pathname={pathname} />
          </div>
        </aside>

        {/* Content */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
