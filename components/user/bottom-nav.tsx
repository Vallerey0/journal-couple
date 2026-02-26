"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Image as ImageIcon,
  Heart,
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
  { href: "/couple", label: "Couple", Icon: Heart, match: "prefix" },
  { href: "/gallery", label: "Gallery", Icon: ImageIcon, match: "prefix" },
  { href: "/story", label: "Story", Icon: BookOpen, match: "prefix" },
  { href: "/settings", label: "Settings", Icon: Settings, match: "prefix" },
];

function isActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 mx-auto w-full max-w-md px-2">
      <div className="relative rounded-full border border-white/20 bg-white/70 shadow-xl shadow-pink-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-black/60 dark:shadow-pink-900/20">
        <ul className="flex items-center justify-between px-2 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item);

            return (
              <li key={item.href} className="relative flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 py-2 transition-colors",
                    active
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-t from-pink-500/10 to-transparent dark:from-pink-500/20"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}

                  <motion.div
                    whileTap={{ scale: 0.8 }}
                    className="relative z-10"
                  >
                    <item.Icon
                      className={cn(
                        "h-6 w-6 transition-all duration-300",
                        active && "fill-pink-500/20 stroke-[2.5px]",
                      )}
                    />
                  </motion.div>

                  <span
                    className={cn(
                      "text-[10px] font-medium leading-none transition-all duration-300",
                      active ? "font-bold scale-105" : "scale-100",
                    )}
                  >
                    {item.label}
                  </span>

                  {active && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute -bottom-1 h-1 w-1 rounded-full bg-pink-500"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
