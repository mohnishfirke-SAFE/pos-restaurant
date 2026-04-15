"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/db/types";

type RestaurantTable = Tables<"restaurant_tables"> & {
  orders?: { id: string; total: number; created_at: string } | null;
};

export function useTables(tenantId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ["tables", tenantId, branchId],
    queryFn: async () => {
      if (!tenantId || !branchId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("*, orders(id, total, created_at)")
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .eq("is_active", true)
        .order("table_number");

      if (error) throw error;
      return data as RestaurantTable[];
    },
    enabled: !!tenantId && !!branchId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      table: Partial<Tables<"restaurant_tables">> & {
        tenant_id: string;
        branch_id: string;
        table_number: string;
      }
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("restaurant_tables")
        .insert(table)
        .select()
        .single();

      if (error) throw error;
      return data as Tables<"restaurant_tables">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      current_order_id,
    }: {
      id: string;
      status: Tables<"restaurant_tables">["status"];
      current_order_id?: string | null;
    }) => {
      const supabase = createClient();
      const updates: Partial<Tables<"restaurant_tables">> = { status };
      if (current_order_id !== undefined) {
        updates.current_order_id = current_order_id;
      }

      const { data, error } = await supabase
        .from("restaurant_tables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Tables<"restaurant_tables">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurant_tables")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}
