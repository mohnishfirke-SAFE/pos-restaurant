import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const [tenantsRes, branchesRes, usersRes, revenueRes] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase.from("branches").select("id", { count: "exact", head: true }),
    supabase.from("tenant_users").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("total").gte(
      "created_at",
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    ),
  ]);

  const revenue = (revenueRes.data ?? []).reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );

  return NextResponse.json({
    totalTenants: tenantsRes.count ?? 0,
    totalBranches: branchesRes.count ?? 0,
    activeUsers: usersRes.count ?? 0,
    monthlyRevenue: revenue,
  });
}
