import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createAdminClient();

  // Handle incoming orders from Zomato/Swiggy/Uber Eats
  const { platform, order } = body;

  if (!platform || !order) {
    return NextResponse.json({ error: "Missing platform or order data" }, { status: 400 });
  }

  const { error } = await supabase.from("orders").insert({
    tenant_id: order.tenant_id,
    branch_id: order.branch_id,
    order_number: `AGG-${platform.toUpperCase()}-${order.external_id}`,
    order_type: "aggregator",
    status: "confirmed",
    aggregator_platform: platform,
    aggregator_order_id: order.external_id,
    subtotal: order.subtotal,
    total: order.total,
    delivery_address: order.delivery_address,
    delivery_notes: order.notes,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ received: true, platform });
}
