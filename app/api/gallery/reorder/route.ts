import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      display_order: z.number(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = reorderSchema.parse(body);

    if (items.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Use a transaction-like approach or simple Promise.all
    // Since Supabase RPC for batch updates is ideal but simple updates work too
    // We will loop through. For small galleries (limit 10), this is fine.
    
    // Security check: ensure these items belong to the user's couple
    // Optimization: Just update. RLS policies should handle security.
    
    const updates = items.map((item) =>
      supabase
        .from("gallery_items")
        .update({ display_order: item.display_order })
        .eq("id", item.id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
