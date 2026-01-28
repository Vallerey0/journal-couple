"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type State = { message?: string };

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function ensureTrialSetup(userId: string, fallbackClient: any) {
  const admin = getAdminClient();
  const client = admin ?? fallbackClient;

  const { data: profile, error: profileErr } = await client
    .from("profiles")
    .select("id, trial_started_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) return profileErr;

  // kalau profile belum ada -> ini tanda trigger signup->profiles belum jalan
  if (!profile?.id) {
    return {
      message: "Profil belum terbentuk. Coba login ulang setelah aktivasi.",
    };
  }

  if (!profile.trial_started_at) {
    const now = new Date();
    const ends = addDays(now, 7).toISOString();

    const { error: updErr } = await client
      .from("profiles")
      .update({
        trial_started_at: now.toISOString(),
        trial_ends_at: ends,
        active_until: ends,
      })
      .eq("id", userId);

    if (updErr) return updErr;
  }

  return null;
}

export async function loginAction(
  _: State,
  formData: FormData,
): Promise<State> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email) return { message: "Email wajib diisi." };
  if (!isEmailValid(email)) return { message: "Email tidak valid." };
  if (!password) return { message: "Password wajib diisi." };

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = (error.message || "").toLowerCase();

    if (msg.includes("invalid") || msg.includes("credentials")) {
      return { message: "Email atau password salah." };
    }

    if (
      msg.includes("confirm") ||
      msg.includes("confirmed") ||
      msg.includes("not confirmed") ||
      msg.includes("verify") ||
      msg.includes("verified")
    ) {
      redirect(`/login?unverified=1&email=${encodeURIComponent(email)}`);
    }

    return { message: error.message };
  }

  const userId = data.user?.id;
  if (userId) {
    const trialErr = await ensureTrialSetup(userId, supabase);
    if (trialErr) {
      const msg =
        (trialErr as { message?: string })?.message ??
        "Gagal menyiapkan trial.";
      return { message: msg };
    }
  }

  redirect("/home");
}
