import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const normalized = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalized || !isEmailValid(normalized)) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { exists: false, error: "Server config missing." },
        { status: 500 }
      );
    }

    const admin = createClient(url, serviceKey);

    // Supabase listUsers pakai pagination.
    // perPage aman dibuat 1000 agar lebih sedikit request.
    const perPage = 1000;
    let page = 1;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        return NextResponse.json(
          { exists: false, error: error.message },
          { status: 500 }
        );
      }

      const users = data?.users ?? [];

      const exists = users.some(
        (u) => (u.email || "").toLowerCase() === normalized
      );

      if (exists) return NextResponse.json({ exists: true }, { status: 200 });

      // kalau halaman ini < perPage berarti sudah habis
      if (users.length < perPage) break;

      page += 1;
    }

    return NextResponse.json({ exists: false }, { status: 200 });
  } catch {
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}
