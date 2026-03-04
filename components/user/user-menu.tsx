"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Monitor, Moon, Settings, Sun, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LogoutButton from "@/components/logout-button"; // sesuaikan path

function ThemeIcon({ t }: { t: string | undefined }) {
  if (t === "dark") return <Moon className="mr-2 h-4 w-4" />;
  if (t === "light") return <Sun className="mr-2 h-4 w-4" />;
  return <Monitor className="mr-2 h-4 w-4" />;
}

export function UserMenu({ initials = "U" }: { initials?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl bg-white/10 dark:bg-black/10 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/15"
          aria-label="User menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl border border-white/30 dark:border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] p-2"
      >
        <DropdownMenuLabel className="text-muted-foreground">
          Akun
        </DropdownMenuLabel>

        <DropdownMenuItem
          asChild
          className="rounded-xl focus:bg-white/15 focus:text-foreground"
        >
          <Link href="/couple">
            <User className="mr-2 h-4 w-4" />
            Profile Couple
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="rounded-xl focus:bg-white/15 focus:text-foreground"
        >
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/20 dark:bg-white/15" />

        <DropdownMenuLabel className="flex items-center">
          <ThemeIcon t={theme} />
          Tema
        </DropdownMenuLabel>

        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={(v) => setTheme(v)}
        >
          <DropdownMenuRadioItem
            value="system"
            className="rounded-xl focus:bg-white/15 focus:text-foreground"
          >
            System
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="light"
            className="rounded-xl focus:bg-white/15 focus:text-foreground"
          >
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="dark"
            className="rounded-xl focus:bg-white/15 focus:text-foreground"
          >
            Dark
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator className="bg-white/20 dark:bg-white/15" />

        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
          <div className="w-full px-2 py-1.5">
            <LogoutButton label="Logout" variant="user" size="sm" />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
