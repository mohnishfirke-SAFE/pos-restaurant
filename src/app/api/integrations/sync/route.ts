import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLATFORM_APIS: Record<string, string> = {
  zomato: "https://api.zomato.com/pos/v1",
  swiggy: "https://partner-api.swiggy.com/v1",
};

// ---------------------------------------------------------------------------
// POST — Trigger sync action (menu push, order pull, status sync)
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { integration_id, action } = body;

  if (!integration_id || !action) {
    return NextResponse.json({ error: "integration_id and action required" }, { status: 400 });
  }

  // Get integration details
  const { data: integration, error } = await supabase
    .from("delivery_integrations")
    .select("*")
    .eq("id", integration_id)
    .single();

  if (error || !integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const platform = integration.platform as string;
  const baseUrl = PLATFORM_APIS[platform];
  const startTime = Date.now();
  let success = true;
  let errorMessage = "";
  let responseData: Record<string, unknown> = {};

  // ---------------------------------------------------------------------------
  // Menu Sync — push POS menu items to the platform
  // ---------------------------------------------------------------------------
  if (action === "menu_sync") {
    // Get all mapped menu items for this platform
    const { data: mappings } = await supabase
      .from("menu_platform_mapping")
      .select("*, menu_items(id, name, base_price, is_veg, is_available, description, preparation_time, menu_categories(name))")
      .eq("tenant_id", integration.tenant_id)
      .eq("platform", platform)
      .eq("is_available", true);

    const menuPayload = (mappings || []).map((m: Record<string, unknown>) => {
      const item = m.menu_items as Record<string, unknown> | null;
      return {
        platform_item_id: m.platform_item_id,
        platform_category_id: m.platform_category_id,
        name: item?.name,
        description: item?.description,
        price: (m.price_override as number) || (item?.base_price as number),
        is_veg: item?.is_veg,
        is_available: m.is_available,
        preparation_time: item?.preparation_time,
        category: (item?.menu_categories as Record<string, unknown>)?.name,
      };
    });

    try {
      if (baseUrl) {
        const res = await fetch(`${baseUrl}/menu/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${integration.api_key}`,
            "X-API-Secret": integration.api_secret || "",
            "X-Merchant-ID": integration.merchant_id || "",
          },
          body: JSON.stringify({
            merchant_id: integration.merchant_id,
            items: menuPayload,
            timestamp: new Date().toISOString(),
          }),
        });
        success = res.ok;
        if (!success) errorMessage = `HTTP ${res.status}`;
      }

      responseData = {
        items_synced: menuPayload.length,
        platform,
      };

      // Mark mappings as synced
      if (success && mappings?.length) {
        for (const m of mappings) {
          await supabase
            .from("menu_platform_mapping")
            .update({
              is_synced: true,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", (m as Record<string, unknown>).id);
        }
      }
    } catch (err) {
      success = false;
      errorMessage = err instanceof Error ? err.message : "Network error";
    }
  }

  // ---------------------------------------------------------------------------
  // Pull Orders — fetch pending orders from platform
  // ---------------------------------------------------------------------------
  if (action === "pull_orders") {
    try {
      if (baseUrl) {
        const res = await fetch(`${baseUrl}/orders/pending`, {
          headers: {
            Authorization: `Bearer ${integration.api_key}`,
            "X-Merchant-ID": integration.merchant_id || "",
          },
        });
        if (res.ok) {
          responseData = await res.json();
        } else {
          success = false;
          errorMessage = `HTTP ${res.status}`;
        }
      }
    } catch (err) {
      success = false;
      errorMessage = err instanceof Error ? err.message : "Network error";
    }
  }

  // ---------------------------------------------------------------------------
  // Sync Status — reconcile order statuses with platform
  // ---------------------------------------------------------------------------
  if (action === "sync_status") {
    // Get all active aggregator orders for this platform
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("id, status, aggregator_order_id, external_platform_status")
      .eq("branch_id", integration.branch_id)
      .eq("aggregator_platform", platform)
      .in("status", ["confirmed", "preparing", "ready"])
      .order("created_at", { ascending: false })
      .limit(50);

    responseData = {
      active_orders: activeOrders?.length || 0,
      platform,
    };
  }

  const latency = Date.now() - startTime;

  // Update last synced
  await supabase
    .from("delivery_integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration_id);

  // Log the sync
  await supabase.from("integration_logs").insert({
    tenant_id: integration.tenant_id,
    integration_id: integration.id,
    platform,
    event_type: `sync.${action}`,
    direction: "outbound",
    payload: { action, timestamp: new Date().toISOString() },
    response: responseData,
    status: success ? "success" : "failed",
    error_message: errorMessage || null,
    latency_ms: latency,
  });

  return NextResponse.json({
    success,
    action,
    platform,
    ...responseData,
    latency_ms: latency,
    synced_at: new Date().toISOString(),
    error: errorMessage || undefined,
  });
}
