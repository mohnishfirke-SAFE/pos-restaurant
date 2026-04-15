"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface ShiftRow {
  id: string;
  tenant_id: string;
  branch_id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "clocked_in" | "clocked_out" | "completed" | "cancelled";
  clock_in_at: string | null;
  clock_out_at: string | null;
  break_minutes: number | null;
  notes: string | null;
  created_at: string;
  tenant_users?: { display_name: string } | null;
}

export interface EmployeeOption {
  id: string;
  display_name: string;
  user_id: string;
}

export function useShifts(
  tenantId: string | undefined,
  branchId: string | undefined,
  weekStart?: string
) {
  return useQuery({
    queryKey: ["shifts", tenantId, branchId, weekStart],
    enabled: !!tenantId && !!branchId,
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("shifts")
        .select("*, tenant_users(display_name)")
        .eq("tenant_id", tenantId!)
        .eq("branch_id", branchId!)
        .order("shift_date", { ascending: true });

      if (weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);
        query = query
          .gte("shift_date", weekStart)
          .lte("shift_date", weekEndStr);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ShiftRow[];
    },
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      shift: Omit<ShiftRow, "id" | "created_at" | "tenant_users" | "clock_in_at" | "clock_out_at"> & {
        tenant_id: string;
        branch_id: string;
        user_id: string;
        shift_date: string;
        start_time: string;
        end_time: string;
        status?: "scheduled";
      }
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          ...shift,
          status: shift.status ?? "scheduled",
        })
        .select()
        .single();
      if (error) throw error;
      return data as ShiftRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("shifts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useEmployeesForSelect(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["employees-for-select", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tenant_users")
        .select("id, display_name, user_id")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("display_name");
      if (error) throw error;
      return data as EmployeeOption[];
    },
  });
}
