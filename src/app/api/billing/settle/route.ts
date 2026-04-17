import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const {
    order_id,
    order_data,
    tenant_id,
    branch_id,
    method,
    amount,
    user_id,
  }: {
    order_id?: string;
    order_data?: {
      tenant_id: string;
      branch_id: string;
      order_type: string;
      table_id?: string | null;
      waiter_id?: string | null;
      subtotal: number;
      discount_amount: number;
      tax_amount: number;
      cgst_amount: number;
      sgst_amount: number;
      total: number;
      items: Array<{
        menu_item_id: string;
        quantity: number;
        unit_price: number;
        modifiers: unknown[];
        notes: string | null;
      }>;
    };
    tenant_id: string;
    branch_id: string;
    method: "cash" | "card" | "upi";
    amount: number;
    user_id: string;
  } = body;

  if (!tenant_id || !branch_id || !method || !amount) {
    return NextResponse.json(
      { error: "Missing required billing fields" },
      { status: 400 }
    );
  }

  let resolvedOrderId = order_id;

  // ------------------------------------------------------------------
  // If no existing order, create one (POS "Pay" flow)
  // ------------------------------------------------------------------
  if (!resolvedOrderId && order_data) {
    const { data: orderNumber } = await supabase.rpc("generate_order_number", {
      p_tenant_id: order_data.tenant_id,
      p_branch_id: order_data.branch_id,
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        tenant_id: order_data.tenant_id,
        branch_id: order_data.branch_id,
        order_type: order_data.order_type,
        table_id: order_data.table_id || null,
        waiter_id: order_data.waiter_id || null,
        subtotal: order_data.subtotal,
        discount_amount: order_data.discount_amount,
        tax_amount: order_data.tax_amount,
        cgst_amount: order_data.cgst_amount,
        sgst_amount: order_data.sgst_amount,
        total: order_data.total,
        order_number: orderNumber || `ORD-${Date.now()}`,
        status: "confirmed",
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    resolvedOrderId = order.id;

    // Insert order items
    if (order_data.items?.length) {
      const orderItems = order_data.items.map((item) => ({
        order_id: order.id,
        tenant_id: order_data.tenant_id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        modifiers: item.modifiers || [],
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) {
        console.error("Order items insert failed:", itemsError.message);
      }
    }
  }

  if (!resolvedOrderId) {
    return NextResponse.json(
      { error: "No order_id or order_data provided" },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------------
  // Check if already paid (prevent double-settle)
  // ------------------------------------------------------------------
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("is_paid, table_id")
    .eq("id", resolvedOrderId)
    .single();

  if (existingOrder?.is_paid) {
    return NextResponse.json(
      { error: "Order has already been settled" },
      { status: 409 }
    );
  }

  // ------------------------------------------------------------------
  // Record payment
  // ------------------------------------------------------------------
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      tenant_id,
      branch_id,
      order_id: resolvedOrderId,
      method,
      status: "completed",
      amount,
      created_by: user_id,
    })
    .select()
    .single();

  if (paymentError) {
    return NextResponse.json(
      { error: paymentError.message },
      { status: 500 }
    );
  }

  // ------------------------------------------------------------------
  // Mark order as paid + completed
  // ------------------------------------------------------------------
  await supabase
    .from("orders")
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", resolvedOrderId);

  // ------------------------------------------------------------------
  // Move table to cleaning (for dine-in orders)
  // ------------------------------------------------------------------
  const tableId = existingOrder?.table_id || order_data?.table_id;
  if (tableId) {
    await supabase
      .from("restaurant_tables")
      .update({
        status: "cleaning",
        current_order_id: null,
      })
      .eq("id", tableId);
  }

  return NextResponse.json({
    success: true,
    order_id: resolvedOrderId,
    payment_id: payment.id,
  });
}
