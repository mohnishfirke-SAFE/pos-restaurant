import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all integrations for the tenant
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .order("platform");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - Create or update an integration
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { tenant_id, branch_id, platform, credentials, config, store_id } = body;

  if (!tenant_id || !platform) {
    return NextResponse.json({ error: "tenant_id and platform required" }, { status: 400 });
  }

  // Generate a webhook secret for this integration
  const webhook_secret = crypto.randomUUID().replace(/-/g, "");

  const { data, error } = await supabase
    .from("integrations")
    .upsert(
      {
        tenant_id,
        branch_id: branch_id || null,
        platform,
        credentials: credentials || {},
        config: config || {},
        store_id: store_id || null,
        is_active: true,
        webhook_secret,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,branch_id,platform" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

// PATCH - Toggle integration active/inactive
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { id, is_active } = body;

  const { data, error } = await supabase
    .from("integrations")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - Remove an integration
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("integrations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
