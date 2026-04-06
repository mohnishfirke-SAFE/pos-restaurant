import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { restaurantName, email, userId } = body;

  if (!restaurantName || !email || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const slug =
    restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36);

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({ name: restaurantName, slug, email })
    .select()
    .single();

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  // Create default branch
  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .insert({ tenant_id: tenant.id, name: "Main Branch", code: "MAIN" })
    .select()
    .single();

  if (branchError) {
    return NextResponse.json({ error: branchError.message }, { status: 500 });
  }

  // Link user to tenant as owner
  const { error: userError } = await supabase.from("tenant_users").insert({
    user_id: userId,
    tenant_id: tenant.id,
    branch_id: branch.id,
    role: "tenant_owner",
    display_name: restaurantName,
  });

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ tenant_id: tenant.id, branch_id: branch.id });
}
