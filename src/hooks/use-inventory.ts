"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// --- Types ---

export interface StockOverviewRow {
  id: string; // branch_stock id
  tenant_id: string;
  branch_id: string;
  ingredient_id: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  last_restocked: string | null;
  ingredients: {
    name: string;
    sku: string;
    unit: string;
    cost_per_unit: number;
  } | null;
}

export interface IngredientRow {
  id: string;
  tenant_id: string;
  name: string;
  unit: string;
  sku: string;
  barcode: string | null;
  cost_per_unit: number;
  is_active: boolean;
  created_at: string;
}

// --- Stock Overview ---

export function useStockOverview(tenantId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ["stock-overview", tenantId, branchId],
    enabled: !!tenantId && !!branchId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("branch_stock")
        .select("id, tenant_id, branch_id, ingredient_id, current_stock, min_stock_level, max_stock_level, last_restocked, ingredients(name, sku, unit, cost_per_unit)")
        .eq("tenant_id", tenantId!)
        .eq("branch_id", branchId!);
      if (error) throw error;
      return data as unknown as StockOverviewRow[];
    },
  });
}

// --- Create Ingredient (insert ingredients row + branch_stock row) ---

interface CreateIngredientInput {
  tenant_id: string;
  branch_id: string;
  name: string;
  unit: string;
  sku: string;
  barcode?: string;
  cost_per_unit: number;
  min_stock_level: number;
  max_stock_level: number;
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIngredientInput) => {
      const supabase = createClient();

      // Insert ingredient
      const { data: ingredient, error: ingError } = await supabase
        .from("ingredients")
        .insert({
          tenant_id: input.tenant_id,
          name: input.name,
          unit: input.unit,
          sku: input.sku,
          barcode: input.barcode ?? null,
          cost_per_unit: input.cost_per_unit,
          is_active: true,
        })
        .select()
        .single();
      if (ingError) throw ingError;

      // Insert branch_stock row
      const { data: stock, error: stockError } = await supabase
        .from("branch_stock")
        .insert({
          tenant_id: input.tenant_id,
          branch_id: input.branch_id,
          ingredient_id: ingredient.id,
          current_stock: 0,
          min_stock_level: input.min_stock_level,
          max_stock_level: input.max_stock_level,
        })
        .select()
        .single();
      if (stockError) throw stockError;

      return { ingredient, stock };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stock-overview", variables.tenant_id, variables.branch_id] });
      queryClient.invalidateQueries({ queryKey: ["ingredients", variables.tenant_id] });
    },
  });
}

// --- Update Stock ---

interface UpdateStockInput {
  id: string; // branch_stock id
  current_stock: number;
  tenant_id: string;
  branch_id: string;
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, current_stock }: UpdateStockInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("branch_stock")
        .update({ current_stock })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stock-overview", variables.tenant_id, variables.branch_id] });
    },
  });
}

// --- Ingredients (full CRUD) ---

export function useIngredients(tenantId: string | null) {
  return useQuery({
    queryKey: ["ingredients", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, tenant_id, name, unit, sku, barcode, cost_per_unit, is_active, created_at")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as IngredientRow[];
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; tenant_id: string } & Partial<Omit<IngredientRow, "id" | "tenant_id" | "created_at">>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ingredients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as IngredientRow;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients", variables.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ["stock-overview" ] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tenant_id }: { id: string; tenant_id: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("ingredients")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients", variables.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ["stock-overview"] });
    },
  });
}
