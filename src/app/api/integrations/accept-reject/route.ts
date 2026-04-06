import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST — Accept or reject an incoming aggregator order
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { order_id, action, rejection_reason } = body;

  if (!order_id || !action) {
    return NextResponse.json(
      { error: "order_id and action (accept|reject) required" },
      { status: 400 }
    );
  }

  // Get the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.order_type !== "aggregator") {
    return NextResponse.json({ error: "Not an aggregator order" }, { status: 400 });
  }

  const platform = order.aggregator_platform as string;
  const now = new Date().toISOString();

  if (action === "accept") {
    // Accept the order
    await supabase
      .from("orders")
      .update({
        status: "confirmed",
        accepted_at: now,
        external_platform_status: "accepted",
        updated_at: now,
      })
      .eq("id", order_id);

    // Push acceptance to platform
    await pushStatusToPlatform(supabase, order, "accepted");

    // Log
    await logAction(supabase, order, "order.accepted");

    return NextResponse.json({ success: true, action: "accepted", order_id });
  }

  if (action === "reject") {
    // Reject reason codes
    const validReasons = [
      "restaurant_busy",
      "item_unavailable",
      "closing_soon",
      "out_of_ingredients",
      "technical_issue",
      "other",
    ];

    const reason = rejection_reason || "restaurant_busy";

    // Reject the order
    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        rejected_at: now,
        rejection_reason: reason,
        external_platform_status: "rejected",
        updated_at: now,
      })
      .eq("id", order_id);

    // Cancel KOTs
    await supabase
      .from("kots")
      .update({ status: "cancelled", updated_at: now })
      .eq("order_id", order_id);

    // Push rejection to platform
    await pushStatusToPlatform(supabase, order, "rejected", reason);

    // Log
    await logAction(supabase, order, "order.rejected", { reason });

    return NextResponse.json({ success: true, action: "rejected", order_id, reason });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// ---------------------------------------------------------------------------
// GET — Get rejection reason codes
// ---------------------------------------------------------------------------
export async function GET() {
  return NextResponse.json({
    reasons: [
      { code: "restaurant_busy", label: "Restaurant is too busy" },
      { code: "item_unavailable", label: "Item(s) unavailable" },
      { code: "closing_soon", label: "Closing soon" },
      { code: "out_of_ingredients", label: "Out of ingredients" },
      { code: "technical_issue", label: "Technical issue" },
      { code: "other", label: "Other reason" },
    ],
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function pushStatusToPlatform(
  supabase: Awaited<ReturnType<typeof createClient>>,
  order: Record<string, unknown>,
  status: string,
  reason?: string
) {
  const platform = order.aggregator_platform as string;
  const PLATFORM_APIS: Record<string, string> = {
    zomato: "https://api.zomato.com/pos/v1",
    swiggy: "https://partner-api.swiggy.com/v1",
  };

  const baseUrl = PLATFORM_APIS[platform];
  if (!baseUrl) return;

  const { data: integration } = await supabase
    .from("delivery_integrations")
    .select("*")
    .eq("branch_id", order.branch_id as string)
    .eq("platform", platform)
    .eq("is_active", true)
    .single();

  if (!integration) return;

  try {
    await fetch(`${baseUrl}/orders/${order.aggregator_order_id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${integration.api_key}`,
        "X-Merchant-ID": integration.merchant_id || "",
      },
      body: JSON.stringify({
        order_id: order.aggregator_order_id,
        status,
        reason: reason || undefined,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail — logged separately
  }
}

async function logAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  order: Record<string, unknown>,
  eventType: string,
  extraPayload?: Record<string, unknown>
) {
  await supabase.from("integration_logs").insert({
    tenant_id: order.tenant_id,
    platform: order.aggregator_platform,
    event_type: eventType,
    direction: "outbound",
    payload: { order_id: order.id, ...extraPayload },
    status: "success",
  });
}
