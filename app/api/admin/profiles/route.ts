import { NextResponse } from "next/server";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Forbidden", reason: gate.reason },
      { status: gate.reason === "UNAUTH" ? 401 : 403 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select(
      "id,email,full_name,phone,role,plan,active_until,trial_started_at,trial_ends_at,subscription_status,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
