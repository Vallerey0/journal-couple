"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Heart,
  Home,
  Image as ImageIcon,
  MapPin,
  Settings,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "prefix";
};

const NAV: NavItem[] = [
  { href: "/home", label: "Home", Icon: Home, match: "exact" },
  { href: "/gallery", label: "Gallery", Icon: ImageIcon, match: "prefix" },
  { href: "/traveling", label: "Travel", Icon: MapPin, match: "prefix" },
  { href: "/couple", label: "Couple", Icon: Heart, match: "prefix" },
  { href: "/settings", label: "Settings", Icon: Settings, match: "prefix" },
];

function isActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md px-4 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="relative rounded-2xl border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = isActive(pathname, item);

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-3 text-xs transition-colors",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.Icon className="h-5 w-5" />
                  <span className="leading-none">{item.label}</span>

                  {active ? (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-foreground"
                      transition={{
                        type: "spring",
                        stiffness: 520,
                        damping: 40,
                      }}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
