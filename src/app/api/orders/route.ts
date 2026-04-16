import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const branchId = searchParams.get("branch_id");

  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (branchId) query = query.eq("branch_id", branchId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  // Separate order fields from items (items is not an orders column)
  const { items, ...orderFields } = body;

  const { data: orderNumber } = await supabase.rpc("generate_order_number", {
    p_tenant_id: orderFields.tenant_id,
    p_branch_id: orderFields.branch_id,
  });

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      ...orderFields,
      order_number: orderNumber || `ORD-${Date.now()}`,
      status: orderFields.status || "confirmed",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create KOT + order items (only for confirmed orders with items)
  if (order.status !== "draft" && items?.length) {
    const { error: kotError } = await supabase.from("kots").insert({
      tenant_id: orderFields.tenant_id,
      branch_id: orderFields.branch_id,
      order_id: order.id,
      kot_number: `KOT-${Date.now().toString(36)}`,
      status: "pending",
    });

    if (kotError) {
      console.error("KOT creation failed:", kotError.message);
    }

    // Insert order items
    const orderItems = items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      tenant_id: orderFields.tenant_id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: (item.unit_price as number) * (item.quantity as number),
      modifiers: item.modifiers || [],
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("Order items creation failed:", itemsError.message);
    }
  }

  return NextResponse.json(order, { status: 201 });
}
