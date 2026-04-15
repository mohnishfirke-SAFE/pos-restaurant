"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  address: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
}

export function useTenantSettings(tenantId: string | null) {
  return useQuery({
    queryKey: ["tenant-settings", tenantId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tenants")
        .select(
          "id, name, slug, email, phone, gstin, pan, address, settings, subscription_plan, subscription_status, trial_ends_at"
        )
        .eq("id", tenantId!)
        .single();
      if (error) throw error;
      return data as TenantData;
    },
    enabled: !!tenantId,
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      flatFields,
      settingsPatch,
    }: {
      id: string;
      flatFields?: Record<string, unknown>;
      settingsPatch?: Record<string, unknown>;
    }) => {
      const supabase = createClient();

      // Build update payload
      const updatePayload: Record<string, unknown> = {};

      if (flatFields) {
        Object.assign(updatePayload, flatFields);
      }

      if (settingsPatch) {
        // Fetch current settings to merge
        const { data: current } = await supabase
          .from("tenants")
          .select("settings")
          .eq("id", id)
          .single();

        const currentSettings =
          (current?.settings as Record<string, unknown>) || {};
        const mergedSettings = deepMerge(currentSettings, settingsPatch);
        updatePayload.settings = mergedSettings;
      }

      const { data, error } = await supabase
        .from("tenants")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-settings", variables.id],
      });
    },
  });
}

/**
 * Deep merge two objects. Source values overwrite target values at each level.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key];
    if (
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}
