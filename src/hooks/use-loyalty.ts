"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface LoyaltyConfigRow {
  id: string;
  tenant_id: string;
  points_per_rupee: number;
  redemption_rate: number;
  tier_thresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  is_active: boolean;
  created_at: string;
}

export interface LoyaltyTransactionRow {
  id: string;
  tenant_id: string;
  customer_id: string;
  order_id: string | null;
  points: number;
  description: string;
  created_at: string;
  customers: { name: string } | null;
}

export function useLoyaltyConfig(tenantId: string | null) {
  return useQuery({
    queryKey: ["loyalty-config", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("loyalty_config")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (error) throw error;
      return data as LoyaltyConfigRow | null;
    },
    enabled: !!tenantId,
  });
}

export function useUpdateLoyaltyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      config: Omit<LoyaltyConfigRow, "id" | "created_at"> & { id?: string }
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("loyalty_config")
        .upsert(config, { onConflict: "tenant_id" })
        .select()
        .single();
      if (error) throw error;
      return data as LoyaltyConfigRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-config"] });
    },
  });
}

export function useLoyaltyTransactions(tenantId: string | null) {
  return useQuery({
    queryKey: ["loyalty-transactions", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*, customers(name)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LoyaltyTransactionRow[];
    },
    enabled: !!tenantId,
  });
}
