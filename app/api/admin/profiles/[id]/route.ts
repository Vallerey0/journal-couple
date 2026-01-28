import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Forbidden", reason: gate.reason },
      { status: gate.reason === "UNAUTH" ? 401 : 403 },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // whitelist field yang boleh diubah admin
  const payload: Record<string, any> = {};
  const allowed = [
    "role",
    "plan",
    "active_until",
    "subscription_status",
    "trial_started_at",
    "trial_ends_at",
  ] as const;

  for (const k of allowed) {
    if (body[k] !== undefined) payload[k] = body[k];
  }

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
