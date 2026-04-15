"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// --- Types ---

export interface POLineItem {
  id: string;
  purchase_order_id: string;
  ingredient_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  ingredients: {
    name: string;
  } | null;
}

export interface PurchaseOrderRow {
  id: string;
  tenant_id: string;
  branch_id: string;
  supplier_id: string;
  po_number: string;
  status: string;
  total_amount: number;
  notes: string | null;
  expected_date: string | null;
  received_date: string | null;
  created_by: string | null;
  created_at: string;
  suppliers: {
    name: string;
  } | null;
  purchase_order_items: POLineItem[];
}

interface SupplierOption {
  id: string;
  name: string;
}

interface IngredientOption {
  id: string;
  name: string;
}

// --- Hooks ---

export function usePurchaseOrders(tenantId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ["purchase-orders", tenantId, branchId],
    enabled: !!tenantId && !!branchId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id, tenant_id, branch_id, supplier_id, po_number, status, total_amount, notes, expected_date, received_date, created_by, created_at, suppliers(name), purchase_order_items(id, purchase_order_id, ingredient_id, quantity_ordered, quantity_received, unit_cost, total_cost, ingredients(name))")
        .eq("tenant_id", tenantId!)
        .eq("branch_id", branchId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PurchaseOrderRow[];
    },
  });
}

interface CreatePOInput {
  tenant_id: string;
  branch_id: string;
  supplier_id: string;
  po_number: string;
  status: string;
  total_amount: number;
  notes?: string;
  expected_date?: string;
  created_by?: string;
  items: {
    ingredient_id: string;
    quantity_ordered: number;
    unit_cost: number;
    total_cost: number;
  }[];
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePOInput) => {
      const supabase = createClient();

      // Insert PO header
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          tenant_id: input.tenant_id,
          branch_id: input.branch_id,
          supplier_id: input.supplier_id,
          po_number: input.po_number,
          status: input.status,
          total_amount: input.total_amount,
          notes: input.notes ?? null,
          expected_date: input.expected_date ?? null,
          created_by: input.created_by ?? null,
        })
        .select()
        .single();
      if (poError) throw poError;

      // Insert PO line items
      if (input.items.length > 0) {
        const lineItems = input.items.map((item) => ({
          purchase_order_id: po.id,
          ingredient_id: item.ingredient_id,
          quantity_ordered: item.quantity_ordered,
          quantity_received: 0,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost,
        }));
        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(lineItems);
        if (itemsError) throw itemsError;
      }

      return po;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", variables.tenant_id, variables.branch_id] });
    },
  });
}

export function useSuppliers(tenantId: string | null) {
  return useQuery({
    queryKey: ["suppliers", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("tenant_id", tenantId!)
        .order("name");
      if (error) throw error;
      return data as SupplierOption[];
    },
  });
}

export function useIngredientsForPO(tenantId: string | null) {
  return useQuery({
    queryKey: ["ingredients-po", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as IngredientOption[];
    },
  });
}
