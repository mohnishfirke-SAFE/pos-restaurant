import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();

  // In production, verify webhook signature from Razorpay
  // const signature = request.headers.get("x-razorpay-signature");
  // if (!verifyWebhookSignature(body, signature, process.env.RAZORPAY_WEBHOOK_SECRET!)) {
  //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  // }

  const supabase = createAdminClient();
  const event = body.event;

  if (event === "payment.captured") {
    const paymentId = body.payload?.payment?.entity?.id;
    const orderId = body.payload?.payment?.entity?.notes?.order_id;

    if (orderId) {
      await supabase
        .from("payments")
        .update({ status: "completed", gateway_payment_id: paymentId })
        .eq("gateway_order_id", body.payload?.payment?.entity?.order_id);

      await supabase
        .from("orders")
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq("id", orderId);
    }
  }

  if (event === "refund.processed") {
    const paymentId = body.payload?.refund?.entity?.payment_id;
    await supabase
      .from("payments")
      .update({ status: "refunded", refunded_at: new Date().toISOString() })
      .eq("gateway_payment_id", paymentId);
  }

  return NextResponse.json({ received: true });
}
