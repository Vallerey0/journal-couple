"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  BadgeCheck,
  Music,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: BadgeCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },

  // 🎵 System-level asset
  { href: "/admin/default-music", label: "Default Music", icon: Music },

  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold">Journal Couple Admin</div>
        <div className="text-xs text-muted-foreground">
          Monitoring & control
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20",
            isLoggingOut && "cursor-not-allowed opacity-50",
          )}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Keluar..." : "Log Out"}
        </button>
      </div>
    </div>
  );
}
