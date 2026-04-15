import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_PRICES: Record<string, number> = {
  starter: 2999,
  professional: 9999,
  enterprise: 25000,
};

export async function GET() {
  const supabase = createAdminClient();

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, subscription_plan, subscription_status, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = tenants ?? [];

  // MRR: sum of plan prices for active + trialing tenants
  const mrr = all
    .filter((t) => t.subscription_status === "active" || t.subscription_status === "trialing")
    .reduce((sum, t) => sum + (PLAN_PRICES[t.subscription_plan] ?? 0), 0);

  const activeCount = all.filter((t) => t.subscription_status === "active").length;
  const trialingCount = all.filter((t) => t.subscription_status === "trialing").length;
  const pastDueCount = all.filter((t) => t.subscription_status === "past_due").length;
  const cancelledCount = all.filter((t) => t.subscription_status === "cancelled").length;

  // Churn rate: cancelled / (active + cancelled) * 100
  const churnRate =
    activeCount + cancelledCount > 0
      ? ((cancelledCount / (activeCount + cancelledCount)) * 100).toFixed(1)
      : "0.0";

  // MRR breakdown by plan
  const mrrByPlan: Record<string, number> = {};
  all
    .filter((t) => t.subscription_status === "active" || t.subscription_status === "trialing")
    .forEach((t) => {
      const plan = t.subscription_plan;
      mrrByPlan[plan] = (mrrByPlan[plan] ?? 0) + (PLAN_PRICES[plan] ?? 0);
    });

  // Build invoices list from tenants
  const invoices = all.map((t) => ({
    tenant_id: t.id,
    tenant: t.name,
    plan: t.subscription_plan,
    amount: PLAN_PRICES[t.subscription_plan] ?? 0,
    status: t.subscription_status,
    date: t.created_at
      ? new Date(t.created_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  }));

  return NextResponse.json({
    mrr,
    activeSubscriptions: activeCount,
    trialingCount,
    pastDueCount,
    cancelledCount,
    churnRate: parseFloat(churnRate),
    mrrByPlan,
    invoices,
  });
}
