import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: intent } = await supabase
      .from("payment_intents")
      .select(
        "id, user_id, final_price_idr, status, expires_at, midtrans_order_id, midtrans_token, midtrans_redirect_url",
      )
      .eq("id", intentId)
      .maybeSingle();

    if (!intent || intent.user_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (intent.status !== "pending") {
      return NextResponse.json(
        { message: `Status intent tidak valid: ${intent.status}` },
        { status: 400 },
      );
    }

    // cek expiry intent
    if (
      intent.expires_at &&
      new Date(intent.expires_at).getTime() <= Date.now()
    ) {
      await supabase
        .from("payment_intents")
        .update({ status: "expired" })
        .eq("id", intent.id);

      return NextResponse.json(
        { message: "Checkout sudah kedaluwarsa." },
        { status: 410 },
      );
    }

    // reuse token
    if (intent.midtrans_token) {
      return NextResponse.json({
        token: intent.midtrans_token,
        redirect_url: intent.midtrans_redirect_url,
        order_id: intent.midtrans_order_id,
      });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { message: "MIDTRANS_SERVER_KEY missing" },
        { status: 500 },
      );
    }

    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const snapUrl = isProd
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const orderId = `JC-${intent.id.slice(0, 8)}-${Date.now()}`;
    const amount = Number(intent.final_price_idr ?? 0);

    if (amount <= 0) {
      return NextResponse.json(
        { message: "Jumlah pembayaran tidak valid." },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        email: user.email,
      },
      callbacks: {
        finish: `${appUrl}/home`,
      },
    };

    const midRes = await fetch(snapUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64(serverKey + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const midJson = await midRes.json();

    if (!midRes.ok || !midJson?.token) {
      return NextResponse.json(
        { message: "Midtrans error", detail: midJson },
        { status: 400 },
      );
    }

    await supabase
      .from("payment_intents")
      .update({
        midtrans_order_id: orderId,
        midtrans_token: midJson.token,
        midtrans_redirect_url: midJson.redirect_url,
      })
      .eq("id", intent.id);

    return NextResponse.json({
      token: midJson.token,
      redirect_url: midJson.redirect_url,
      order_id: orderId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
