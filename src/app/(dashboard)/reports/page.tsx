"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { downloadCSV } from "@/lib/utils/csv-export";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import {
  useReportStats,
  useTopItems,
  useHourlyData,
  useChannelReport,
  useStaffReport,
} from "@/hooks/use-reports";
import {
  BarChart3,
  TrendingUp,
  Download,
  IndianRupee,
  ShoppingCart,
  Users,
  Clock,
  Truck,
  Loader2,
} from "lucide-react";

export default function ReportsPage() {
  const [period, setPeriod] = useState("today");
  const { tenantUser, loading: authLoading } = useTenantUser();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const tenantId = tenantUser?.tenant_id ?? null;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? null;

  const { data: stats, loading: statsLoading } = useReportStats(
    tenantId,
    branchId,
    period
  );
  const { data: topItems, loading: topLoading } = useTopItems(
    tenantId,
    branchId,
    period
  );
  const { data: hourlyData, loading: hourlyLoading } = useHourlyData(
    tenantId,
    branchId
  );
  const { data: channelData, loading: channelLoading } = useChannelReport(
    tenantId,
    branchId,
    period
  );
  const { data: staffData, loading: staffLoading } = useStaffReport(
    tenantId,
    branchId
  );

  const isLoading =
    authLoading || statsLoading || topLoading || hourlyLoading || channelLoading || staffLoading;

  const maxHourlyOrders = useMemo(
    () => Math.max(...hourlyData.map((d) => d.orders), 1),
    [hourlyData]
  );

  const channelColors: Record<string, string> = {
    "Dine-in": "bg-blue-500",
    Zomato: "bg-red-600",
    Swiggy: "bg-orange-500",
    Takeaway: "bg-purple-500",
    Delivery: "bg-green-500",
  };

  const channelLogos: Record<string, string> = {
    Zomato: "Z",
    Swiggy: "S",
  };

  const handleExport = () => {
    const exportData = [
      {
        period,
        revenue: stats.revenue,
        orders: stats.orderCount,
        customers: stats.customerCount,
        avgOrderValue: Math.round(stats.avgOrderValue),
      },
    ];
    downloadCSV(exportData, `report-overview-${period}`);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your restaurant performance
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatINR(stats.revenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total for selected period
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.orderCount}</div>
                <p className="text-xs text-muted-foreground">
                  Completed orders
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatINR(stats.avgOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground">Per order average</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.customerCount}
                </div>
                <p className="text-xs text-muted-foreground">Unique customers</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Hourly Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hourly Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : hourlyData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No orders today yet
              </div>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {hourlyData.map((d) => (
                  <div
                    key={d.hour}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-primary transition-all"
                      style={{
                        height: `${(d.orders / maxHourlyOrders) * 100}%`,
                        minHeight: d.orders > 0 ? 4 : 0,
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {d.hour}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : topItems.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No item data for this period
              </div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.orders} orders
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatINR(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Breakdown Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Channel Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {channelLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : channelData.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              No channel data for this period
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {channelData.map((ch) => (
                <div key={ch.name} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {channelLogos[ch.name] ? (
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-black text-white ${channelColors[ch.name] || "bg-gray-500"}`}
                      >
                        {channelLogos[ch.name]}
                      </span>
                    ) : (
                      <div
                        className={`h-3 w-3 rounded-full ${channelColors[ch.name] || "bg-gray-500"}`}
                      />
                    )}
                    <span className="text-sm font-medium">{ch.name}</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatINR(ch.revenue)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{ch.orders} orders</span>
                    {ch.commission > 0 ? (
                      <span className="text-red-500">
                        -{formatINR(ch.commission)} comm.
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-right">
            <a
              href="/reports/channels"
              className="text-xs text-primary hover:underline"
            >
              View detailed channel report &rarr;
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Payment Methods — requires payments table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Payment breakdown available via detailed sales report
            </div>
          </CardContent>
        </Card>

        {/* Order Types */}
        <Card>
          <CardHeader>
            <CardTitle>Order Types</CardTitle>
          </CardHeader>
          <CardContent>
            {channelLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="space-y-3">
                {channelData.map((ch) => {
                  const totalOrders = channelData.reduce(
                    (s, c) => s + c.orders,
                    0
                  );
                  const pct =
                    totalOrders > 0
                      ? Math.round((ch.orders / totalOrders) * 100)
                      : 0;
                  return (
                    <div key={ch.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{ch.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ch.orders} orders
                        </p>
                      </div>
                      <Badge variant="secondary">{pct}%</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {staffLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : staffData.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No staff data this month
              </div>
            ) : (
              <div className="space-y-3">
                {staffData.slice(0, 3).map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.orders} orders
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatINR(s.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
