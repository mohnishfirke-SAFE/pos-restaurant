"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    default:
      return new Date(0);
  }
}

// ---------------------------------------------------------------------------
// useReportStats — total revenue, order count, unique customers, avg order value
// ---------------------------------------------------------------------------

export interface ReportStats {
  revenue: number;
  orderCount: number;
  customerCount: number;
  avgOrderValue: number;
}

export function useReportStats(
  tenantId: string | null,
  branchId: string | null,
  period: string
) {
  const [data, setData] = useState<ReportStats>({
    revenue: 0,
    orderCount: 0,
    customerCount: 0,
    avgOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      setLoading(true);
      const start = getStartDate(period);
      let query = supabase
        .from("orders")
        .select("total, customer_id")
        .eq("tenant_id", tenantId)
        .gte("created_at", start.toISOString())
        .neq("status", "cancelled");

      if (branchId) query = query.eq("branch_id", branchId);

      const { data: rows, error } = await query;
      if (cancelled) return;
      if (error || !rows) {
        setData({ revenue: 0, orderCount: 0, customerCount: 0, avgOrderValue: 0 });
        setLoading(false);
        return;
      }

      const revenue = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
      const orderCount = rows.length;
      const customerSet = new Set(
        rows.map((r) => r.customer_id).filter(Boolean)
      );
      const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

      setData({ revenue, orderCount, customerCount: customerSet.size, avgOrderValue });
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId, period]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// useTopItems — top 5 items by order count
// ---------------------------------------------------------------------------

export interface TopItem {
  name: string;
  orders: number;
  revenue: number;
}

export function useTopItems(
  tenantId: string | null,
  branchId: string | null,
  period: string
) {
  const [data, setData] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      setLoading(true);
      const start = getStartDate(period);
      let query = supabase
        .from("order_items")
        .select("menu_item_id, quantity, total_price, orders!inner(tenant_id, branch_id, created_at, status)")
        .eq("orders.tenant_id", tenantId)
        .gte("orders.created_at", start.toISOString())
        .neq("orders.status", "cancelled")
        .eq("is_cancelled", false);

      if (branchId) query = query.eq("orders.branch_id", branchId);

      const { data: rows, error } = await query;
      if (cancelled) return;
      if (error || !rows) {
        setData([]);
        setLoading(false);
        return;
      }

      // Aggregate by menu_item_id
      const agg = new Map<string, { orders: number; revenue: number }>();
      for (const row of rows) {
        const key = row.menu_item_id as string;
        const existing = agg.get(key) || { orders: 0, revenue: 0 };
        existing.orders += Number(row.quantity) || 0;
        existing.revenue += Number(row.total_price) || 0;
        agg.set(key, existing);
      }

      // Fetch menu item names
      const itemIds = [...agg.keys()];
      if (itemIds.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("id, name")
        .in("id", itemIds);

      if (cancelled) return;

      const nameMap = new Map((menuItems || []).map((m: { id: string; name: string }) => [m.id, m.name]));

      const items: TopItem[] = [...agg.entries()]
        .map(([id, val]) => ({
          name: nameMap.get(id) || "Unknown",
          orders: val.orders,
          revenue: val.revenue,
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      setData(items);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId, period]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// useHourlyData — order counts grouped by hour for today
// ---------------------------------------------------------------------------

export interface HourlyData {
  hour: string;
  orders: number;
}

export function useHourlyData(
  tenantId: string | null,
  branchId: string | null
) {
  const [data, setData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      setLoading(true);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let query = supabase
        .from("orders")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", todayStart.toISOString())
        .neq("status", "cancelled");

      if (branchId) query = query.eq("branch_id", branchId);

      const { data: rows, error } = await query;
      if (cancelled) return;
      if (error || !rows) {
        setData([]);
        setLoading(false);
        return;
      }

      // Group by hour
      const hourMap = new Map<number, number>();
      for (let h = 6; h <= 23; h++) hourMap.set(h, 0);

      for (const row of rows) {
        const hour = new Date(row.created_at).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      }

      const formatHour = (h: number): string => {
        if (h === 0) return "12AM";
        if (h < 12) return `${h}AM`;
        if (h === 12) return "12PM";
        return `${h - 12}PM`;
      };

      const result: HourlyData[] = [...hourMap.entries()]
        .sort(([a], [b]) => a - b)
        .map(([h, count]) => ({ hour: formatHour(h), orders: count }));

      setData(result);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// useDailySales — daily totals for last N days
// ---------------------------------------------------------------------------

export interface DailySales {
  date: string;
  orders: number;
  revenue: number;
  avgOrder: number;
}

export function useDailySales(
  tenantId: string | null,
  branchId: string | null,
  days: number = 7
) {
  const [data, setData] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      let query = supabase
        .from("orders")
        .select("created_at, total")
        .eq("tenant_id", tenantId)
        .gte("created_at", startDate.toISOString())
        .neq("status", "cancelled");

      if (branchId) query = query.eq("branch_id", branchId);

      const { data: rows, error } = await query;
      if (cancelled) return;
      if (error || !rows) {
        setData([]);
        setLoading(false);
        return;
      }

      // Group by date
      const dayMap = new Map<string, { orders: number; revenue: number }>();
      for (const row of rows) {
        const dateStr = new Date(row.created_at).toISOString().slice(0, 10);
        const existing = dayMap.get(dateStr) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += Number(row.total) || 0;
        dayMap.set(dateStr, existing);
      }

      const result: DailySales[] = [...dayMap.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, val]) => ({
          date,
          orders: val.orders,
          revenue: val.revenue,
          avgOrder: val.orders > 0 ? Math.round(val.revenue / val.orders) : 0,
        }));

      setData(result);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId, days]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// useChannelReport — groups orders by order_type + aggregator_platform
// ---------------------------------------------------------------------------

export interface ChannelData {
  name: string;
  orders: number;
  revenue: number;
  avgOrder: number;
  commissionPct: number;
  commission: number;
  netRevenue: number;
}

export function useChannelReport(
  tenantId: string | null,
  branchId: string | null,
  period: string
) {
  const [data, setData] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      setLoading(true);
      const start = getStartDate(period);
      let query = supabase
        .from("orders")
        .select(
          "order_type, aggregator_platform, total, platform_commission_pct, platform_commission_amount"
        )
        .eq("tenant_id", tenantId)
        .gte("created_at", start.toISOString())
        .neq("status", "cancelled");

      if (branchId) query = query.eq("branch_id", branchId);

      const { data: rows, error } = await query;
      if (cancelled) return;
      if (error || !rows) {
        setData([]);
        setLoading(false);
        return;
      }

      // Also get delivery_integrations for commission defaults
      let commissionDefaults = new Map<string, number>();
      if (branchId) {
        const { data: integrations } = await supabase
          .from("delivery_integrations")
          .select("platform, default_commission_pct")
          .eq("tenant_id", tenantId)
          .eq("branch_id", branchId)
          .eq("is_active", true);
        if (integrations) {
          for (const integ of integrations) {
            commissionDefaults.set(integ.platform, Number(integ.default_commission_pct) || 0);
          }
        }
      }

      // Group by channel
      const channelMap = new Map<
        string,
        {
          orders: number;
          revenue: number;
          commissionPct: number;
          commission: number;
        }
      >();

      for (const row of rows) {
        let channelName: string;
        if (row.order_type === "dine_in") {
          channelName = "Dine-in";
        } else if (row.order_type === "takeaway") {
          channelName = "Takeaway";
        } else if (row.order_type === "aggregator" && row.aggregator_platform) {
          channelName =
            (row.aggregator_platform as string).charAt(0).toUpperCase() +
            (row.aggregator_platform as string).slice(1);
        } else if (row.order_type === "delivery") {
          channelName = "Delivery";
        } else {
          channelName = "Other";
        }

        const existing = channelMap.get(channelName) || {
          orders: 0,
          revenue: 0,
          commissionPct: 0,
          commission: 0,
        };
        existing.orders += 1;
        existing.revenue += Number(row.total) || 0;

        const commPct =
          Number(row.platform_commission_pct) ||
          commissionDefaults.get((row.aggregator_platform as string) || "") ||
          0;
        const commAmt = Number(row.platform_commission_amount) || 0;
        existing.commission += commAmt;
        existing.commissionPct = commPct;

        channelMap.set(channelName, existing);
      }

      const result: ChannelData[] = [...channelMap.entries()].map(
        ([name, val]) => ({
          name,
          orders: val.orders,
          revenue: val.revenue,
          avgOrder: val.orders > 0 ? Math.round(val.revenue / val.orders) : 0,
          commissionPct: val.commissionPct,
          commission: val.commission,
          netRevenue: val.revenue - val.commission,
        })
      );

      setData(result);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId, period]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// useInventoryReport — stock levels + usage from stock_movements
// ---------------------------------------------------------------------------

export interface InventoryItem {
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  used: number;
  cost: number;
  wastage: number;
}

export function useInventoryReport(
  tenantId: string | null,
  branchId: string | null
) {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !branchId) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      setLoading(true);

      // Fetch branch_stock with ingredients
      const { data: stockRows, error: stockErr } = await supabase
        .from("branch_stock")
        .select(
          "ingredient_id, current_stock, min_stock_level, ingredients(id, name, unit, cost_per_unit)"
        )
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId);

      if (cancelled) return;
      if (stockErr || !stockRows) {
        setData([]);
        setLoading(false);
        return;
      }

      // Fetch stock movements for last 7 days (usage + wastage)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: movements } = await supabase
        .from("stock_movements")
        .select("ingredient_id, movement_type, quantity")
        .eq("tenant_id", tenantId)
        .eq("branch_id", branchId)
        .gte("created_at", weekAgo.toISOString());

      if (cancelled) return;

      // Aggregate usage and wastage per ingredient
      const usageMap = new Map<string, { used: number; waste: number }>();
      for (const m of movements || []) {
        const key = m.ingredient_id as string;
        const existing = usageMap.get(key) || { used: 0, waste: 0 };
        const qty = Math.abs(Number(m.quantity) || 0);
        if (m.movement_type === "sale") existing.used += qty;
        if (m.movement_type === "waste") existing.waste += qty;
        usageMap.set(key, existing);
      }

      const items: InventoryItem[] = (stockRows as Record<string, unknown>[])
        .map((row) => {
          const ingredient = row.ingredients as Record<string, unknown> | null;
          const usage = usageMap.get(row.ingredient_id as string) || {
            used: 0,
            waste: 0,
          };
          const costPerUnit = Number(ingredient?.cost_per_unit) || 0;
          return {
            name: (ingredient?.name as string) || "Unknown",
            unit: (ingredient?.unit as string) || "",
            currentStock: Number(row.current_stock) || 0,
            minStock: Number(row.min_stock_level) || 0,
            used: usage.used,
            cost: usage.used * costPerUnit,
            wastage: usage.waste,
          };
        })
        .sort((a, b) => b.cost - a.cost);

      setData(items);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// useStaffReport — orders by waiter + shift info
// ---------------------------------------------------------------------------

export interface StaffData {
  name: string;
  role: string;
  orders: number;
  revenue: number;
  avgServiceMin: number;
  hoursWorked: number;
}

export function useStaffReport(
  tenantId: string | null,
  branchId: string | null
) {
  const [data, setData] = useState<StaffData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      setLoading(true);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Fetch orders grouped by waiter_id
      let query = supabase
        .from("orders")
        .select("waiter_id, total, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", monthStart.toISOString())
        .neq("status", "cancelled");

      if (branchId) query = query.eq("branch_id", branchId);

      const { data: rows, error } = await query;
      if (cancelled) return;
      if (error || !rows) {
        setData([]);
        setLoading(false);
        return;
      }

      // Aggregate by waiter
      const waiterMap = new Map<
        string,
        {
          orders: number;
          revenue: number;
          totalServiceMs: number;
          serviceCount: number;
        }
      >();

      for (const row of rows) {
        if (!row.waiter_id) continue;
        const key = row.waiter_id as string;
        const existing = waiterMap.get(key) || {
          orders: 0,
          revenue: 0,
          totalServiceMs: 0,
          serviceCount: 0,
        };
        existing.orders += 1;
        existing.revenue += Number(row.total) || 0;

        if (row.created_at && row.updated_at) {
          const ms =
            new Date(row.updated_at).getTime() -
            new Date(row.created_at).getTime();
          existing.totalServiceMs += ms;
          existing.serviceCount += 1;
        }

        waiterMap.set(key, existing);
      }

      // Get waiter display names
      const waiterIds = [...waiterMap.keys()];
      if (waiterIds.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const { data: users } = await supabase
        .from("tenant_users")
        .select("user_id, display_name, role")
        .in("user_id", waiterIds)
        .eq("tenant_id", tenantId);

      if (cancelled) return;

      const userMap = new Map(
        (users || []).map((u: { user_id: string; display_name: string; role: string }) => [
          u.user_id,
          { name: u.display_name, role: u.role },
        ])
      );

      // Get shift data for hours worked this month
      let shiftQuery = supabase
        .from("shifts")
        .select("user_id, clock_in_at, clock_out_at, start_time, end_time, shift_date")
        .eq("tenant_id", tenantId)
        .gte("shift_date", monthStart.toISOString().slice(0, 10));

      if (branchId) shiftQuery = shiftQuery.eq("branch_id", branchId);

      const { data: shifts } = await shiftQuery;
      if (cancelled) return;

      const hoursMap = new Map<string, number>();
      for (const s of shifts || []) {
        const key = s.user_id as string;
        let hours = hoursMap.get(key) || 0;
        if (s.clock_in_at && s.clock_out_at) {
          const diff =
            (new Date(s.clock_out_at as string).getTime() -
              new Date(s.clock_in_at as string).getTime()) /
            (1000 * 60 * 60);
          hours += diff;
        } else if (s.start_time && s.end_time) {
          // Estimate from scheduled times
          const [sh, sm] = (s.start_time as string).split(":").map(Number);
          const [eh, em] = (s.end_time as string).split(":").map(Number);
          hours += Math.max(0, eh + em / 60 - (sh + sm / 60));
        }
        hoursMap.set(key, hours);
      }

      const result: StaffData[] = [...waiterMap.entries()]
        .map(([id, val]) => {
          const user = userMap.get(id) || { name: "Unknown", role: "staff" };
          const avgServiceMin =
            val.serviceCount > 0
              ? Math.round(val.totalServiceMs / val.serviceCount / 60000)
              : 0;
          return {
            name: user.name,
            role: user.role,
            orders: val.orders,
            revenue: val.revenue,
            avgServiceMin,
            hoursWorked: Math.round((hoursMap.get(id) || 0) * 10) / 10,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      setData(result);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// useCustomerReport — customer analytics
// ---------------------------------------------------------------------------

export interface CustomerReportStats {
  totalCustomers: number;
  repeatRate: number;
  avgLifetimeValue: number;
}

export interface TopCustomer {
  name: string;
  phone: string;
  visits: number;
  totalSpent: number;
  avgOrder: number;
  tier: string;
}

export function useCustomerReport(tenantId: string | null) {
  const [stats, setStats] = useState<CustomerReportStats>({
    totalCustomers: 0,
    repeatRate: 0,
    avgLifetimeValue: 0,
  });
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      setLoading(true);

      const { data: rows, error } = await supabase
        .from("customers")
        .select("id, name, phone, total_orders, total_spent, loyalty_tier")
        .eq("tenant_id", tenantId);

      if (cancelled) return;
      if (error || !rows) {
        setStats({ totalCustomers: 0, repeatRate: 0, avgLifetimeValue: 0 });
        setTopCustomers([]);
        setLoading(false);
        return;
      }

      const totalCustomers = rows.length;
      const repeatCustomers = rows.filter(
        (r) => (r.total_orders || 0) > 1
      ).length;
      const repeatRate =
        totalCustomers > 0
          ? Math.round((repeatCustomers / totalCustomers) * 100)
          : 0;
      const totalSpent = rows.reduce(
        (s, r) => s + (Number(r.total_spent) || 0),
        0
      );
      const avgLifetimeValue =
        totalCustomers > 0 ? totalSpent / totalCustomers : 0;

      setStats({ totalCustomers, repeatRate, avgLifetimeValue });

      // Top customers by total_spent
      const top: TopCustomer[] = [...rows]
        .sort(
          (a, b) =>
            (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0)
        )
        .slice(0, 10)
        .map((r) => ({
          name: r.name || "Unknown",
          phone: r.phone || "",
          visits: r.total_orders || 0,
          totalSpent: Number(r.total_spent) || 0,
          avgOrder:
            r.total_orders > 0
              ? Math.round((Number(r.total_spent) || 0) / r.total_orders)
              : 0,
          tier: r.loyalty_tier || "bronze",
        }));

      setTopCustomers(top);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return { stats, topCustomers, loading };
}
