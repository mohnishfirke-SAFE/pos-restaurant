"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/db/types";

type Branch = Tables<"branches">;

function generateBranchCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

export function useBranches(tenantId: string | null) {
  return useQuery({
    queryKey: ["branches", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      branch: Partial<Tables<"branches">> & {
        tenant_id: string;
        name: string;
      }
    ) => {
      const code = branch.code || generateBranchCode(branch.name);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("branches")
        .insert({ ...branch, code })
        .select()
        .single();

      if (error) throw error;
      return data as Branch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Tables<"branches">> & { id: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("branches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Branch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useToggleBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("branches")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
