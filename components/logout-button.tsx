"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/actions/logout";
import { Button } from "@/components/ui/button";

export default function LogoutButton({
  label = "Logout",
  variant = "user",
}: {
  label?: string;
  variant?: "user" | "admin";
}) {
  const { pending } = useFormStatus();

  // admin bisa tetap merah kalau kamu mau
  const v = variant === "admin" ? "destructive" : "default";

  return (
    <form action={logoutAction} className="w-full">
      <Button type="submit" disabled={pending} variant={v} className="w-full">
        {pending ? "Keluar..." : label}
      </Button>
    </form>
  );
}
