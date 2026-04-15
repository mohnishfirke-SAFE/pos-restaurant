"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables, InsertTables } from "@/lib/db/types";

type Customer = Tables<"customers">;

interface CustomerWithOrders {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export function useCustomers(tenantId: string | null, search?: string) {
  return useQuery({
    queryKey: ["customers", tenantId, search],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      let query = supabase
        .from("customers")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      customer: InsertTables<"customers"> & { tenant_id: string; name: string }
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Tables<"customers">> & { id: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCustomerOrders(customerId: string | null) {
  return useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          total,
          status,
          created_at,
          order_items (
            id,
            menu_item_id,
            quantity,
            unit_price,
            total_price
          )
        `
        )
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CustomerWithOrders[];
    },
    enabled: !!customerId,
  });
}
