import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types for incoming platform payloads
// ---------------------------------------------------------------------------
interface PlatformOrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  external_item_id?: string;
  modifiers?: Array<{ name: string; price: number }>;
  notes?: string;
}

interface PlatformOrder {
  tenant_id: string;
  branch_id: string;
  external_id: string;
  customer_name?: string;
  customer_phone?: string;
  items: PlatformOrderItem[];
  subtotal: number;
  total: number;
  tax_amount?: number;
  delivery_address?: Record<string, unknown>;
  delivery_notes?: string;
  pickup_eta?: string;
  delivery_partner_name?: string;
  delivery_partner_phone?: string;
  platform_commission_pct?: number;
}

// ---------------------------------------------------------------------------
// Verify webhook signature
// ---------------------------------------------------------------------------
function verifyWebhookSignature(
  secret: string,
  payload: string,
  signature: string | null
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature.replace("sha256=", ""), "hex")
  );
}

// ---------------------------------------------------------------------------
// POST — Receive orders from Zomato / Swiggy
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const rawBody = await request.text();
  let body: { platform: string; order: PlatformOrder; event?: string };

  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { platform, order, event } = body;

  if (!platform || !order) {
    return NextResponse.json(
      { error: "Missing platform or order data" },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------------
  // 1. Validate webhook secret
  // ------------------------------------------------------------------
  const webhookSecret =
    request.nextUrl.searchParams.get("secret") || "";
  const signatureHeader = request.headers.get("x-webhook-signature");

  const { data: integration } = await supabase
    .from("delivery_integrations")
    .select("*")
    .eq("branch_id", order.branch_id)
    .eq("platform", platform)
    .eq("is_active", true)
    .single();

  if (!integration) {
    return NextResponse.json(
      { error: "No active integration found for this branch/platform" },
      { status: 403 }
    );
  }

  // Verify via query param OR HMAC signature
  const secretValid = webhookSecret === integration.webhook_secret;
  const signatureValid = verifyWebhookSignature(
    integration.webhook_secret,
    rawBody,
    signatureHeader
  );

  if (!secretValid && !signatureValid) {
    await logEvent(supabase, integration, "webhook.auth_failed", "inbound", body, "failed", "Invalid webhook secret or signature");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ------------------------------------------------------------------
  // 2. Queue the order for reliability
  // ------------------------------------------------------------------
  const { data: queueEntry } = await supabase
    .from("platform_order_queue")
    .insert({
      tenant_id: integration.tenant_id,
      branch_id: integration.branch_id,
      platform,
      external_order_id: order.external_id,
      raw_payload: body,
      status: "processing",
    })
    .select()
    .single();

  // ------------------------------------------------------------------
  // 3. Handle different event types
  // ------------------------------------------------------------------
  if (event === "order.cancelled") {
    return handleCancellation(supabase, integration, order, queueEntry?.id);
  }

  if (event === "delivery.status_update") {
    return handleDeliveryUpdate(supabase, integration, order);
  }

  // ------------------------------------------------------------------
  // 4. Resolve menu items from platform mapping
  // ------------------------------------------------------------------
  const { data: mappings } = await supabase
    .from("menu_platform_mapping")
    .select("platform_item_id, menu_item_id")
    .eq("tenant_id", integration.tenant_id)
    .eq("platform", platform);

  const mappingLookup = new Map(
    (mappings || []).map((m) => [m.platform_item_id, m.menu_item_id])
  );

  // ------------------------------------------------------------------
  // 5. Create the order
  // ------------------------------------------------------------------
  const { data: orderNumber } = await supabase.rpc("generate_order_number", {
    p_tenant_id: integration.tenant_id,
    p_branch_id: integration.branch_id,
  });

  const commissionPct =
    order.platform_commission_pct ?? integration.default_commission_pct ?? 0;
  const commissionAmount = (order.total * commissionPct) / 100;

  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      tenant_id: integration.tenant_id,
      branch_id: integration.branch_id,
      order_number: orderNumber || `AGG-${platform.toUpperCase()}-${order.external_id}`,
      order_type: "aggregator",
      status: integration.auto_accept ? "confirmed" : "draft",
      source: platform,
      aggregator_platform: platform,
      aggregator_order_id: order.external_id,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount || 0,
      total: order.total,
      delivery_address: order.delivery_address || null,
      delivery_notes: order.delivery_notes || null,
      delivery_partner_name: order.delivery_partner_name || null,
      delivery_partner_phone: order.delivery_partner_phone || null,
      delivery_partner_eta: order.pickup_eta || null,
      pickup_eta: order.pickup_eta || null,
      platform_commission_pct: commissionPct,
      platform_commission_amount: commissionAmount,
      auto_accepted: integration.auto_accept,
      accepted_at: integration.auto_accept ? new Date().toISOString() : null,
      external_platform_status: "received",
      notes: order.customer_name
        ? `Customer: ${order.customer_name}${order.customer_phone ? ` | Phone: ${order.customer_phone}` : ""}`
        : null,
    })
    .select()
    .single();

  if (orderError || !newOrder) {
    // Mark queue entry as failed
    if (queueEntry?.id) {
      await supabase
        .from("platform_order_queue")
        .update({ status: "failed", error_message: orderError?.message })
        .eq("id", queueEntry.id);
    }
    await logEvent(supabase, integration, "order.create_failed", "inbound", body, "failed", orderError?.message);
    return NextResponse.json(
      { error: orderError?.message || "Failed to create order" },
      { status: 500 }
    );
  }

  // ------------------------------------------------------------------
  // 6. Insert order items
  // ------------------------------------------------------------------
  if (order.items?.length) {
    const orderItems = order.items.map((item) => ({
      order_id: newOrder.id,
      tenant_id: integration.tenant_id,
      menu_item_id:
        mappingLookup.get(item.external_item_id || "") ||
        "00000000-0000-0000-0000-000000000000", // fallback for unmapped items
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.total || item.price * item.quantity,
      notes: item.notes || null,
      modifiers: item.modifiers
        ? JSON.stringify(item.modifiers)
        : "[]",
    }));

    await supabase.from("order_items").insert(orderItems);
  }

  // ------------------------------------------------------------------
  // 7. Auto-create KOT for kitchen
  // ------------------------------------------------------------------
  await supabase.from("kots").insert({
    tenant_id: integration.tenant_id,
    branch_id: integration.branch_id,
    order_id: newOrder.id,
    kot_number: `KOT-${platform.toUpperCase().charAt(0)}-${Date.now().toString(36)}`,
    status: integration.auto_accept ? "pending" : "pending",
    station: "main",
  });

  // ------------------------------------------------------------------
  // 8. Update queue entry as completed
  // ------------------------------------------------------------------
  if (queueEntry?.id) {
    await supabase
      .from("platform_order_queue")
      .update({
        status: "completed",
        order_id: newOrder.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", queueEntry.id);
  }

  // ------------------------------------------------------------------
  // 9. Log success
  // ------------------------------------------------------------------
  await logEvent(supabase, integration, "order.received", "inbound", body, "success");

  return NextResponse.json({
    received: true,
    platform,
    order_id: newOrder.id,
    order_number: newOrder.order_number,
    auto_accepted: integration.auto_accept,
    status: newOrder.status,
  });
}

// ---------------------------------------------------------------------------
// Handle order cancellation from platform
// ---------------------------------------------------------------------------
async function handleCancellation(
  supabase: ReturnType<typeof createAdminClient>,
  integration: Record<string, unknown>,
  order: PlatformOrder,
  queueId?: string
) {
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("aggregator_order_id", order.external_id)
    .eq("aggregator_platform", integration.platform as string)
    .single();

  if (existingOrder) {
    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        external_platform_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingOrder.id);

    // Cancel associated KOTs
    await supabase
      .from("kots")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("order_id", existingOrder.id);
  }

  if (queueId) {
    await supabase
      .from("platform_order_queue")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", queueId);
  }

  await logEvent(supabase, integration, "order.cancelled", "inbound", { external_id: order.external_id }, "success");

  return NextResponse.json({ received: true, event: "order.cancelled" });
}

// ---------------------------------------------------------------------------
// Handle delivery status updates (partner assigned, ETA, picked up)
// ---------------------------------------------------------------------------
async function handleDeliveryUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  integration: Record<string, unknown>,
  order: PlatformOrder
) {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (order.delivery_partner_name) updates.delivery_partner_name = order.delivery_partner_name;
  if (order.delivery_partner_phone) updates.delivery_partner_phone = order.delivery_partner_phone;
  if (order.pickup_eta) updates.delivery_partner_eta = order.pickup_eta;

  await supabase
    .from("orders")
    .update(updates)
    .eq("aggregator_order_id", order.external_id)
    .eq("aggregator_platform", integration.platform as string);

  await logEvent(supabase, integration, "delivery.status_update", "inbound", order, "success");

  return NextResponse.json({ received: true, event: "delivery.status_update" });
}

// ---------------------------------------------------------------------------
// Log helper
// ---------------------------------------------------------------------------
async function logEvent(
  supabase: ReturnType<typeof createAdminClient>,
  integration: Record<string, unknown>,
  eventType: string,
  direction: string,
  payload: unknown,
  status: string,
  errorMessage?: string
) {
  await supabase.from("integration_logs").insert({
    tenant_id: integration.tenant_id,
    integration_id: integration.id,
    platform: integration.platform,
    event_type: eventType,
    direction,
    payload,
    status,
    error_message: errorMessage || null,
  });
}
