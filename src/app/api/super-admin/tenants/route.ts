import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, email, subscription_plan, subscription_status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch branch counts
  const { data: branchCounts } = await supabase
    .from("branches")
    .select("tenant_id");

  // Fetch user counts
  const { data: userCounts } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("is_active", true);

  // Fetch revenue per tenant (current month)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: orderRevenue } = await supabase
    .from("orders")
    .select("tenant_id, total")
    .gte("created_at", monthStart);

  // Aggregate
  const branchMap = new Map<string, number>();
  (branchCounts ?? []).forEach((b) => {
    branchMap.set(b.tenant_id, (branchMap.get(b.tenant_id) ?? 0) + 1);
  });

  const userMap = new Map<string, number>();
  (userCounts ?? []).forEach((u) => {
    userMap.set(u.tenant_id, (userMap.get(u.tenant_id) ?? 0) + 1);
  });

  const revenueMap = new Map<string, number>();
  (orderRevenue ?? []).forEach((o) => {
    revenueMap.set(o.tenant_id, (revenueMap.get(o.tenant_id) ?? 0) + (Number(o.total) || 0));
  });

  const enriched = (tenants ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    plan: t.subscription_plan,
    status: t.subscription_status,
    branches: branchMap.get(t.id) ?? 0,
    users: userMap.get(t.id) ?? 0,
    revenue: revenueMap.get(t.id) ?? 0,
    created_at: t.created_at,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, subscription_plan } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36);

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      name,
      slug,
      email,
      phone: phone || null,
      subscription_plan: subscription_plan || "starter",
      subscription_status: "trialing",
    })
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

  return NextResponse.json({ tenant_id: tenant.id, branch_id: branch.id });
}
