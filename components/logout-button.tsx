"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/actions/logout";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogoutButton({
  label = "Logout",
  variant = "user",
  className,
  size = "sm",
}: {
  label?: string;
  variant?: "user" | "admin";
  className?: string;
  size?: "xs" | "sm" | "default" | "lg";
}) {
  const { pending } = useFormStatus();

  const v = variant === "admin" ? "destructive" : "ghost";
  const cls =
    variant === "admin"
      ? "w-full"
      : "w-full justify-start text-red-600 dark:text-red-400 hover:text-red-500 hover:bg-red-500/10";

  return (
    <form action={logoutAction} className="w-full">
      <Button
        type="submit"
        disabled={pending}
        variant={v}
        size={size}
        className={cn(cls, className)}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {pending ? "Keluar..." : label}
      </Button>
    </form>
  );
}
