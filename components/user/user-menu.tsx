"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";

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
          className="h-9 w-9 rounded-xl"
          aria-label="User menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Akun</DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link href="/couple">
            <User className="mr-2 h-4 w-4" />
            Profile Couple
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center">
          <ThemeIcon t={theme} />
          Tema
        </DropdownMenuLabel>

        {/* ✅ no submenu: radio list */}
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={(v) => setTheme(v)}
        >
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Logout via server action */}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
          <div className="w-full px-2 py-1.5">
            <LogoutButton label="Logout" variant="user" />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
