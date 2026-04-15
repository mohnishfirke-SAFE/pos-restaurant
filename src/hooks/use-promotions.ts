"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface PromotionRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "bogo" | "happy_hour";
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  applicable_items: string[] | null;
  applicable_categories: string[] | null;
  applicable_branches: string[] | null;
  coupon_code: string | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  happy_hour_days: number[] | null;
  happy_hour_start: string | null;
  happy_hour_end: string | null;
  is_active: boolean;
  created_at: string;
}

export function usePromotions(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["promotions", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromotionRow[];
    },
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      promotion: Omit<PromotionRow, "id" | "created_at" | "used_count"> & {
        tenant_id: string;
        name: string;
        discount_type: "percentage" | "fixed" | "bogo" | "happy_hour";
        discount_value: number;
      }
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("promotions")
        .insert({
          tenant_id: promotion.tenant_id,
          name: promotion.name,
          description: promotion.description ?? null,
          discount_type: promotion.discount_type,
          discount_value: promotion.discount_value,
          min_order_value: promotion.min_order_value ?? null,
          max_discount: promotion.max_discount ?? null,
          applicable_items: promotion.applicable_items ?? null,
          applicable_categories: promotion.applicable_categories ?? null,
          applicable_branches: promotion.applicable_branches ?? null,
          coupon_code: promotion.coupon_code ?? null,
          max_uses: promotion.max_uses ?? null,
          valid_from: promotion.valid_from ?? null,
          valid_until: promotion.valid_until ?? null,
          happy_hour_days: promotion.happy_hour_days ?? null,
          happy_hour_start: promotion.happy_hour_start ?? null,
          happy_hour_end: promotion.happy_hour_end ?? null,
          is_active: promotion.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PromotionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PromotionRow> & { id: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("promotions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as PromotionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
  });
}
