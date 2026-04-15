"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// --- Types ---

export interface RecipeRow {
  id: string;
  tenant_id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity_needed: number;
  unit: string;
  ingredients: {
    name: string;
    cost_per_unit: number;
    unit: string;
  } | null;
  menu_items: {
    name: string;
  } | null;
}

export interface GroupedRecipe {
  menu_item_id: string;
  menu_item_name: string;
  rows: RecipeRow[];
}

interface SelectOption {
  id: string;
  name: string;
}

interface IngredientSelectOption {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

// --- Hooks ---

export function useRecipes(tenantId: string | null) {
  return useQuery({
    queryKey: ["recipes", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("recipes")
        .select("id, tenant_id, menu_item_id, ingredient_id, quantity_needed, unit, ingredients(name, cost_per_unit, unit), menu_items(name)")
        .eq("tenant_id", tenantId!)
        .order("menu_item_id");
      if (error) throw error;

      // Group by menu_item_id
      const grouped: Record<string, GroupedRecipe> = {};
      for (const row of data as unknown as RecipeRow[]) {
        if (!grouped[row.menu_item_id]) {
          grouped[row.menu_item_id] = {
            menu_item_id: row.menu_item_id,
            menu_item_name: row.menu_items?.name ?? "Unknown",
            rows: [],
          };
        }
        grouped[row.menu_item_id].rows.push(row);
      }
      return Object.values(grouped);
    },
  });
}

interface SaveRecipeInput {
  tenant_id: string;
  menu_item_id: string;
  rows: { ingredient_id: string; quantity_needed: number; unit: string }[];
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenant_id, menu_item_id, rows }: SaveRecipeInput) => {
      const supabase = createClient();

      // Delete existing recipes for this menu_item_id
      const { error: deleteError } = await supabase
        .from("recipes")
        .delete()
        .eq("tenant_id", tenant_id)
        .eq("menu_item_id", menu_item_id);
      if (deleteError) throw deleteError;

      // Insert new rows
      if (rows.length > 0) {
        const insertRows = rows.map((r) => ({
          tenant_id,
          menu_item_id,
          ingredient_id: r.ingredient_id,
          quantity_needed: r.quantity_needed,
          unit: r.unit,
        }));
        const { data, error: insertError } = await supabase
          .from("recipes")
          .insert(insertRows)
          .select();
        if (insertError) throw insertError;
        return data;
      }
      return [];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.tenant_id] });
    },
  });
}

export function useMenuItemsForSelect(tenantId: string | null) {
  return useQuery({
    queryKey: ["menu-items-select", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as SelectOption[];
    },
  });
}

export function useIngredientsForSelect(tenantId: string | null) {
  return useQuery({
    queryKey: ["ingredients-select", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name, unit, cost_per_unit")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as IngredientSelectOption[];
    },
  });
}
