"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils/currency";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  LayoutGrid,
  Clock,
  Package,
} from "lucide-react";
import type { OrderStatus, OrderType } from "@/types";

// ---------- helpers ----------

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusBadgeVariant(
  status: OrderStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "confirmed":
    case "preparing":
    case "ready":
    case "served":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function formatOrderType(type: OrderType): string {
  const map: Record<OrderType, string> = {
    dine_in: "Dine-In",
    takeaway: "Takeaway",
    delivery: "Delivery",
    kiosk: "Kiosk",
    aggregator: "Aggregator",
  };
  return map[type] ?? type;
}

function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
}

// ---------- types ----------

interface RecentOrder {
  id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  total: number;
  created_at: string;
  customers: { name: string } | null;
  restaurant_tables: { table_number: string } | null;
}

interface PopularItem {
  menu_items: { name: string } | null;
  quantity: number;
}

interface DashboardData {
  todayRevenue: number;
  todayOrderCount: number;
  avgOrderValue: number;
  activeTables: number;
  recentOrders: RecentOrder[];
  popularItems: PopularItem[];
}

// ---------- component ----------

export default function DashboardPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const { activeBranchId } = useBranchStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!tenantUser?.tenant_id || !activeBranchId) {
      setDataLoading(false);
      return;
    }

    let cancelled = false;
    const tid = tenantUser.tenant_id;
    const bid = activeBranchId;

    async function fetchDashboard() {
      setDataLoading(true);
      setFetchError(null);

      const supabase = createClient();

      try {
        // Run independent queries in parallel
        const [
          ordersRes,
          tablesRes,
          recentOrdersRes,
          popularItemsRes,
        ] = await Promise.all([
          // Today's orders (revenue + count)
          supabase
            .from("orders")
            .select("total")
            .eq("tenant_id", tid)
            .eq("branch_id", bid)
            .gte("created_at", todayStart)
            .in("status", [
              "confirmed",
              "preparing",
              "ready",
              "served",
              "completed",
            ]),

          // Active (occupied) tables
          supabase
            .from("restaurant_tables")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tid)
            .eq("branch_id", bid)
            .eq("status", "occupied"),

          // Recent 10 orders
          supabase
            .from("orders")
            .select(
              "id, order_number, order_type, status, total, created_at, customers(name), restaurant_tables(table_number)"
            )
            .eq("tenant_id", tid)
            .eq("branch_id", bid)
            .order("created_at", { ascending: false })
            .limit(10),

          // Popular items today
          supabase
            .from("order_items")
            .select("menu_items(name), quantity")
            .eq("tenant_id", tid)
            .gte("created_at", todayStart)
            .order("quantity", { ascending: false })
            .limit(5),
        ]);

        if (cancelled) return;

        // Check for errors
        if (ordersRes.error) throw ordersRes.error;
        if (tablesRes.error) throw tablesRes.error;
        if (recentOrdersRes.error) throw recentOrdersRes.error;
        if (popularItemsRes.error) throw popularItemsRes.error;

        // Compute revenue
        const orders = ordersRes.data ?? [];
        const todayRevenue = orders.reduce(
          (sum, o) => sum + (o.total ?? 0),
          0
        );
        const todayOrderCount = orders.length;
        const avgOrderValue =
          todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;

        setData({
          todayRevenue,
          todayOrderCount,
          avgOrderValue,
          activeTables: tablesRes.count ?? 0,
          recentOrders:
            (recentOrdersRes.data ?? []) as unknown as RecentOrder[],
          popularItems:
            (popularItemsRes.data ?? []) as unknown as PopularItem[],
        });
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load dashboard data";
          setFetchError(message);
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [authLoading, tenantUser, activeBranchId, todayStart]);

  // ---------- loading skeletons ----------

  if (authLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your restaurant&apos;s performance
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ---------- no tenant / no branch ----------

  if (!tenantUser?.tenant_id || !activeBranchId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your restaurant&apos;s performance
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Select a branch to view your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- real data ----------

  const stats = [
    {
      title: "Today's Revenue",
      value: formatINR(data?.todayRevenue ?? 0),
      icon: IndianRupee,
      description: "Total sales today",
    },
    {
      title: "Orders",
      value: String(data?.todayOrderCount ?? 0),
      icon: ShoppingCart,
      description: "Orders placed today",
    },
    {
      title: "Avg Order Value",
      value: formatINR(data?.avgOrderValue ?? 0),
      icon: TrendingUp,
      description: "Average order value",
    },
    {
      title: "Active Tables",
      value: String(data?.activeTables ?? 0),
      icon: LayoutGrid,
      description: "Currently occupied",
    },
  ];

  const recentOrders = data?.recentOrders ?? [];
  const popularItems = data?.popularItems ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your restaurant&apos;s performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error banner */}
      {fetchError && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">
              Could not load dashboard data: {fetchError}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No orders yet today. Start taking orders to see them here.
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          #{order.order_number}
                        </span>
                        <Badge
                          variant={statusBadgeVariant(order.status)}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {statusLabel(order.status)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {formatOrderType(order.order_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {order.customers?.name ?? "Walk-in"}
                        </span>
                        {order.restaurant_tables && (
                          <span className="text-xs text-muted-foreground">
                            &middot; Table {order.restaurant_tables.table_number}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          &middot; {formatRelativeTime(order.created_at)}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {formatINR(order.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Popular Items Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No menu items sold yet today.
              </p>
            ) : (
              <div className="space-y-3">
                {popularItems.map((item, idx) => {
                  const name = item.menu_items?.name ?? "Unknown";
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.quantity} sold
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
