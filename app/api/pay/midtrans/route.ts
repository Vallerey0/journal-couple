import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Body = { intentId?: string };

function base64(s: string) {
  return Buffer.from(s).toString("base64");
}

export async function POST(req: Request) {
  try {
    const { intentId } = (await req.json()) as Body;
    if (!intentId) {
      return NextResponse.json({ message: "intentId wajib." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ambil intent (RLS memastikan hanya miliknya)
    const { data: intent, error: intentErr } = await supabase
      .from("payment_intents")
      .select(
        "id, user_id, plan_id, final_price_idr, status, midtrans_order_id, midtrans_token, midtrans_redirect_url"
      )
      .eq("id", intentId)
      .maybeSingle();

    if (intentErr) {
      return NextResponse.json({ message: intentErr.message }, { status: 400 });
    }
    if (!intent) {
      return NextResponse.json(
        { message: "Checkout tidak ditemukan." },
        { status: 404 }
      );
    }
    if (intent.user_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (intent.status !== "pending") {
      return NextResponse.json(
        { message: `Status intent tidak valid: ${intent.status}` },
        { status: 400 }
      );
    }

    // kalau sudah pernah dibuat token sebelumnya, pakai yang ada
    if (intent.midtrans_token) {
      return NextResponse.json({
        token: intent.midtrans_token,
        redirect_url: intent.midtrans_redirect_url,
        order_id: intent.midtrans_order_id,
      });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      return NextResponse.json(
        { message: "MIDTRANS_SERVER_KEY belum di set." },
        { status: 500 }
      );
    }

    const snapUrl = isProd
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    // order_id harus unik
    const orderId = `JC-${intent.id.slice(0, 8)}-${Date.now()}`;

    const amount = Number(intent.final_price_idr ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Total pembayaran tidak valid." },
        { status: 400 }
      );
    }

    // callback ke user app setelah bayar (bisa kamu ubah nanti)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        email: user.email,
      },
      callbacks: {
        finish: `${appUrl}/home?paid=1`,
      },
    };

    const midRes = await fetch(snapUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64(serverKey + ":")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const midJson = await midRes.json();

    if (!midRes.ok) {
      return NextResponse.json(
        { message: "Midtrans error", detail: midJson },
        { status: 400 }
      );
    }

    const token = midJson?.token as string | undefined;
    const redirect_url = midJson?.redirect_url as string | undefined;

    if (!token || !redirect_url) {
      return NextResponse.json(
        { message: "Response Midtrans tidak lengkap.", detail: midJson },
        { status: 400 }
      );
    }

    // simpan token & redirect_url ke intent
    const { error: upErr } = await supabase
      .from("payment_intents")
      .update({
        midtrans_order_id: orderId,
        midtrans_token: token,
        midtrans_redirect_url: redirect_url,
      })
      .eq("id", intent.id);

    if (upErr) {
      return NextResponse.json(
        { message: "Gagal menyimpan data pembayaran.", detail: upErr },
        { status: 400 }
      );
    }

    return NextResponse.json({ token, redirect_url, order_id: orderId });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
