import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();

  // In production, verify Razorpay signature here
  // const isValid = validatePaymentVerification({ order_id, payment_id }, signature, secret);

  const { error } = await supabase.from("payments").insert({
    tenant_id: body.tenant_id,
    branch_id: body.branch_id,
    order_id: body.order_id,
    method: body.method,
    status: "completed",
    amount: body.amount,
    gateway: body.gateway || "razorpay",
    gateway_payment_id: body.payment_id,
    created_by: body.user_id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark order as paid
  await supabase
    .from("orders")
    .update({ is_paid: true, paid_at: new Date().toISOString(), status: "completed" })
    .eq("id", body.order_id);

  return NextResponse.json({ success: true });
}
