import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ "branch-id": string }> }) {
  const { "branch-id": branchId } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("tenant_id, code")
    .eq("id", branchId)
    .single();

  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  // Create order
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      tenant_id: branch.tenant_id,
      branch_id: branchId,
      order_number: `KIOSK-${branch.code}-${Date.now().toString(36).toUpperCase()}`,
      order_type: body.order_type || "kiosk",
      status: "confirmed",
      subtotal: body.subtotal,
      tax_amount: body.tax_amount,
      total: body.total,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert items and create KOT
  if (body.items?.length) {
    const orderItems = body.items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      tenant_id: branch.tenant_id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: (item.price as number) * (item.quantity as number),
    }));
    await supabase.from("order_items").insert(orderItems);

    await supabase.from("kots").insert({
      tenant_id: branch.tenant_id,
      branch_id: branchId,
      order_id: order.id,
      kot_number: `KOT-${Date.now().toString(36).toUpperCase()}`,
      status: "pending",
    });
  }

  return NextResponse.json({ order_id: order.id, order_number: order.order_number }, { status: 201 });
}
