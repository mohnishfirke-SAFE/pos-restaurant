"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SettleWithOrderPayload {
  order_id: string;
  tenant_id: string;
  branch_id: string;
  method: "cash" | "card" | "upi";
  amount: number;
  user_id: string;
}

interface OrderData {
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
}

interface SettleWithNewOrderPayload {
  order_data: OrderData;
  tenant_id: string;
  branch_id: string;
  method: "cash" | "card" | "upi";
  amount: number;
  user_id: string;
}

type SettlePayload = SettleWithOrderPayload | SettleWithNewOrderPayload;

export function useSettleBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SettlePayload) => {
      const res = await fetch("/api/billing/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to settle bill");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
