import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Platform API base URLs (production endpoints)
// ---------------------------------------------------------------------------
const PLATFORM_APIS: Record<string, { baseUrl: string; statusEndpoint: string }> = {
  zomato: {
    baseUrl: "https://api.zomato.com/pos/v1",
    statusEndpoint: "/orders/{order_id}/status",
  },
  swiggy: {
    baseUrl: "https://partner-api.swiggy.com/v1",
    statusEndpoint: "/orders/{order_id}/status",
  },
};

// Status mapping: internal POS status → platform status
const STATUS_MAP: Record<string, Record<string, string>> = {
  zomato: {
    confirmed: "accepted",
    preparing: "preparing",
    ready: "ready_for_pickup",
    completed: "delivered",
    cancelled: "cancelled",
  },
  swiggy: {
    confirmed: "ACCEPTED",
    preparing: "PREPARING",
    ready: "READY_FOR_PICKUP",
    completed: "DELIVERED",
    cancelled: "CANCELLED",
  },
};

// ---------------------------------------------------------------------------
// POST — Push order status update to Zomato/Swiggy
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { order_id, new_status } = body;

  if (!order_id || !new_status) {
    return NextResponse.json(
      { error: "order_id and new_status required" },
      { status: 400 }
    );
  }

  // Get order with aggregator details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Only sync aggregator orders
  if (order.order_type !== "aggregator" || !order.aggregator_platform) {
    return NextResponse.json({ error: "Not an aggregator order" }, { status: 400 });
  }

  // Get integration credentials
  const { data: integration } = await supabase
    .from("delivery_integrations")
    .select("*")
    .eq("branch_id", order.branch_id)
    .eq("platform", order.aggregator_platform)
    .eq("is_active", true)
    .single();

  if (!integration) {
    return NextResponse.json(
      { error: "No active integration for this platform" },
      { status: 404 }
    );
  }

  const platform = order.aggregator_platform as string;
  const platformConfig = PLATFORM_APIS[platform];
  const platformStatus = STATUS_MAP[platform]?.[new_status];

  if (!platformConfig || !platformStatus) {
    return NextResponse.json(
      { error: `Unknown platform or status mapping: ${platform} / ${new_status}` },
      { status: 400 }
    );
  }

  // Build the API call
  const url = `${platformConfig.baseUrl}${platformConfig.statusEndpoint.replace(
    "{order_id}",
    order.aggregator_order_id
  )}`;

  const startTime = Date.now();
  let apiResponse: Response | null = null;
  let success = false;
  let errorMessage = "";

  try {
    apiResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${integration.api_key}`,
        "X-API-Secret": integration.api_secret || "",
        "X-Merchant-ID": integration.merchant_id || "",
      },
      body: JSON.stringify({
        order_id: order.aggregator_order_id,
        status: platformStatus,
        timestamp: new Date().toISOString(),
      }),
    });

    success = apiResponse.ok;
    if (!success) {
      const errBody = await apiResponse.text();
      errorMessage = `HTTP ${apiResponse.status}: ${errBody}`;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Network error";
  }

  const latency = Date.now() - startTime;

  // Update order's external platform status
  await supabase
    .from("orders")
    .update({
      status: new_status,
      external_platform_status: platformStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order_id);

  // Log the API call
  await supabase.from("integration_logs").insert({
    tenant_id: order.tenant_id,
    integration_id: integration.id,
    platform,
    event_type: "status.push",
    direction: "outbound",
    payload: { order_id, new_status, platform_status: platformStatus },
    response: apiResponse
      ? { status: apiResponse.status, ok: apiResponse.ok }
      : { error: errorMessage },
    status: success ? "success" : "failed",
    error_message: errorMessage || null,
    http_status: apiResponse?.status || null,
    latency_ms: latency,
  });

  return NextResponse.json({
    success,
    platform,
    internal_status: new_status,
    platform_status: platformStatus,
    latency_ms: latency,
    error: errorMessage || undefined,
  });
}
