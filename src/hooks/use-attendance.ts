"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface AttendanceLogRow {
  id: string;
  tenant_id: string;
  branch_id: string;
  user_id: string;
  action: string;
  timestamp: string;
  location: Record<string, unknown> | null;
  tenant_users?: { display_name: string; role: string } | null;
}

export interface TodayShiftRow {
  id: string;
  user_id: string;
  status: "scheduled" | "clocked_in" | "clocked_out" | "completed" | "cancelled";
  clock_in_at: string | null;
  clock_out_at: string | null;
}

export interface TodayAttendanceRecord {
  attendance: AttendanceLogRow[];
  shifts: TodayShiftRow[];
}

export function useTodayAttendance(
  tenantId: string | undefined,
  branchId: string | undefined
) {
  return useQuery({
    queryKey: ["today-attendance", tenantId, branchId],
    enabled: !!tenantId && !!branchId,
    queryFn: async () => {
      const supabase = createClient();
      const today = new Date().toISOString().slice(0, 10);

      // Fetch today's attendance logs
      const { data: attendance, error: attError } = await supabase
        .from("attendance_log")
        .select("*, tenant_users(display_name, role)")
        .eq("tenant_id", tenantId!)
        .eq("branch_id", branchId!)
        .gte("timestamp", `${today}T00:00:00`)
        .lte("timestamp", `${today}T23:59:59`)
        .order("timestamp", { ascending: true });
      if (attError) throw attError;

      // Fetch today's shifts
      const { data: shifts, error: shiftError } = await supabase
        .from("shifts")
        .select("id, user_id, status, clock_in_at, clock_out_at")
        .eq("tenant_id", tenantId!)
        .eq("branch_id", branchId!)
        .eq("shift_date", today);
      if (shiftError) throw shiftError;

      return {
        attendance: (attendance ?? []) as AttendanceLogRow[],
        shifts: (shifts ?? []) as TodayShiftRow[],
      } as TodayAttendanceRecord;
    },
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenantId,
      branchId,
      userId,
      shiftId,
    }: {
      tenantId: string;
      branchId: string;
      userId: string;
      shiftId: string;
    }) => {
      const supabase = createClient();
      const now = new Date().toISOString();

      // Insert attendance log
      const { error: logError } = await supabase
        .from("attendance_log")
        .insert({
          tenant_id: tenantId,
          branch_id: branchId,
          user_id: userId,
          action: "clock_in",
          timestamp: now,
        });
      if (logError) throw logError;

      // Update shift status
      const { error: shiftError } = await supabase
        .from("shifts")
        .update({
          status: "clocked_in",
          clock_in_at: now,
        })
        .eq("id", shiftId);
      if (shiftError) throw shiftError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenantId,
      branchId,
      userId,
      shiftId,
    }: {
      tenantId: string;
      branchId: string;
      userId: string;
      shiftId: string;
    }) => {
      const supabase = createClient();
      const now = new Date().toISOString();

      // Insert attendance log
      const { error: logError } = await supabase
        .from("attendance_log")
        .insert({
          tenant_id: tenantId,
          branch_id: branchId,
          user_id: userId,
          action: "clock_out",
          timestamp: now,
        });
      if (logError) throw logError;

      // Update shift status
      const { error: shiftError } = await supabase
        .from("shifts")
        .update({
          status: "clocked_out",
          clock_out_at: now,
        })
        .eq("id", shiftId);
      if (shiftError) throw shiftError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}
