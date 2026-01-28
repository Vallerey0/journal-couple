import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  BadgeCheck,
  Music,
} from "lucide-react";

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
  return (
    <div className="h-full w-64 border-r bg-background">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold">Journal Couple Admin</div>
        <div className="text-xs text-muted-foreground">
          Monitoring & control
        </div>
      </div>

      <nav className="px-2">
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
    </div>
  );
}
