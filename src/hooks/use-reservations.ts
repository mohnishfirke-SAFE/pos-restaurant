"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface ReservationRow {
  id: string;
  tenant_id: string;
  branch_id: string;
  table_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
  restaurant_tables: { table_number: string } | null;
}

export function useReservations(
  tenantId: string | null,
  branchId: string | null
) {
  return useQuery({
    queryKey: ["reservations", tenantId, branchId],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      let query = supabase
        .from("reservations")
        .select("*, restaurant_tables(table_number)")
        .eq("tenant_id", tenantId)
        .order("reservation_date", { ascending: false });

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReservationRow[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      reservation: Omit<
        ReservationRow,
        | "id"
        | "created_at"
        | "restaurant_tables"
      > & {
        tenant_id: string;
        branch_id: string;
        customer_name: string;
        customer_phone: string;
        party_size: number;
        reservation_date: string;
        reservation_time: string;
      }
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reservations")
        .insert(reservation)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ReservationRow> & { id: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reservations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useTables(tenantId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ["restaurant-tables", tenantId, branchId],
    queryFn: async () => {
      if (!tenantId || !branchId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("id, table_number, capacity, status")
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .eq("is_active", true)
        .order("table_number");
      if (error) throw error;
      return data as {
        id: string;
        table_number: string;
        capacity: number;
        status: string;
      }[];
    },
    enabled: !!tenantId && !!branchId,
  });
}
