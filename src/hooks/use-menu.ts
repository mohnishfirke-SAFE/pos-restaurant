"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/db/types";

type MenuCategory = Tables<"menu_categories">;
type MenuItem = Tables<"menu_items"> & { menu_categories?: { name: string } };

// Categories
export function useMenuCategories() {
  return useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as MenuCategory[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<MenuCategory> & { tenant_id: string; name: string; slug: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_categories")
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data as MenuCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuCategory> & { id: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as MenuCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
    },
  });
}

// Menu Items
export function useMenuItems(categoryId?: string) {
  return useQuery({
    queryKey: ["menu-items", categoryId],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("menu_items")
        .select("*, menu_categories(name)")
        .order("sort_order");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MenuItem[];
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<Tables<"menu_items">> & { tenant_id: string; category_id: string; name: string; base_price: number }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"menu_items">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tables<"menu_items">> & { id: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"menu_items">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}
