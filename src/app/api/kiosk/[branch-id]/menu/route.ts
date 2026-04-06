import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ "branch-id": string }> }) {
  const { "branch-id": branchId } = await params;
  const supabase = createAdminClient();

  // Get branch's tenant
  const { data: branch } = await supabase
    .from("branches")
    .select("tenant_id")
    .eq("id", branchId)
    .single();

  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  // Get active menu items with categories
  const { data: categories } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("tenant_id", branch.tenant_id)
    .eq("is_active", true)
    .order("sort_order");

  const { data: items } = await supabase
    .from("menu_items")
    .select("*, menu_item_branches(*)")
    .eq("tenant_id", branch.tenant_id)
    .eq("is_active", true)
    .eq("is_available", true)
    .order("sort_order");

  return NextResponse.json({ categories, items });
}
