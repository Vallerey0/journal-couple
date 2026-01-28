import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: item } = await supabase
    .from("journal_music")
    .select("id, couple_id")
    .eq("id", params.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Music not found" }, { status: 404 });
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("id", item.couple_id)
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 1. Set semua music couple → is_active = false
  await supabase
    .from("journal_music")
    .update({ is_active: false })
    .eq("couple_id", couple.id);

  // 2. Set music {id} → is_active = true
  const { error } = await supabase
    .from("journal_music")
    .update({ is_active: true })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
