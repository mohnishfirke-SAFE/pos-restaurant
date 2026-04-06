import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Trigger a menu sync to a platform
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { integration_id, action } = body;

  if (!integration_id || !action) {
    return NextResponse.json({ error: "integration_id and action required" }, { status: 400 });
  }

  // Get integration details
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", integration_id)
    .single();

  if (error || !integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  // Log the sync attempt
  await supabase.from("integration_logs").insert({
    tenant_id: integration.tenant_id,
    integration_id: integration.id,
    event_type: action,
    direction: "outbound",
    payload: { action, timestamp: new Date().toISOString() },
    status: "success",
  });

  // Update last synced
  await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration_id);

  // In production, this would call the actual platform APIs:
  // - Zomato: POST to their POS integration API
  // - Swiggy: POST via UrbanPiper middleware
  // - Uber Eats: POST to Marketplace API

  return NextResponse.json({
    success: true,
    message: `${action} completed for ${integration.platform}`,
    synced_at: new Date().toISOString(),
  });
}
