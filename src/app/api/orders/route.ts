import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: orderNumber } = await supabase.rpc("generate_order_number", {
    p_tenant_id: body.tenant_id,
    p_branch_id: body.branch_id,
  });

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      ...body,
      order_number: orderNumber || `ORD-${Date.now()}`,
      status: "confirmed",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create KOT
  if (body.items?.length) {
    await supabase.from("kots").insert({
      tenant_id: body.tenant_id,
      branch_id: body.branch_id,
      order_id: order.id,
      kot_number: `KOT-${Date.now().toString(36)}`,
      status: "pending",
    });

    // Insert order items
    const orderItems = body.items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      tenant_id: body.tenant_id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: (item.unit_price as number) * (item.quantity as number),
      modifiers: item.modifiers || [],
      notes: item.notes || null,
    }));

    await supabase.from("order_items").insert(orderItems);
  }

  return NextResponse.json(order, { status: 201 });
}
