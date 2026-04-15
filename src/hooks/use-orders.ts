"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/db/types";

type OrderWithRelations = Tables<"orders"> & {
  order_items: (Tables<"order_items"> & {
    menu_items: { name: string } | null;
  })[];
  customers: { name: string } | null;
  restaurant_tables: { table_number: string } | null;
};

export function useOrders(tenantId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ["orders", tenantId, branchId],
    queryFn: async () => {
      if (!tenantId || !branchId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, order_items(*, menu_items(name)), customers(name), restaurant_tables(table_number)"
        )
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as OrderWithRelations[];
    },
    enabled: !!tenantId && !!branchId,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      if (!id) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, order_items(*, menu_items(name)), customers(name), restaurant_tables(table_number)"
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as OrderWithRelations;
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Tables<"orders">["status"];
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Tables<"orders">;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
    },
  });
}

export function useAcceptOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      aggregatorPlatform,
      aggregatorOrderId,
    }: {
      orderId: string;
      aggregatorPlatform: string;
      aggregatorOrderId: string;
    }) => {
      const response = await fetch("/api/integrations/accept-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          order_id: orderId,
          aggregator_platform: aggregatorPlatform,
          aggregator_order_id: aggregatorOrderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept order");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      aggregatorPlatform,
      aggregatorOrderId,
      reason,
    }: {
      orderId: string;
      aggregatorPlatform: string;
      aggregatorOrderId: string;
      reason?: string;
    }) => {
      const response = await fetch("/api/integrations/accept-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          order_id: orderId,
          aggregator_platform: aggregatorPlatform,
          aggregator_order_id: aggregatorOrderId,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject order");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
