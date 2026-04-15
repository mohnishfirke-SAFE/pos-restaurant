"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/utils/currency";
import { downloadCSV } from "@/lib/utils/csv-export";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import { useChannelReport } from "@/hooks/use-reports";
import {
  Download,
  TrendingUp,
  TrendingDown,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  IndianRupee,
  BarChart3,
  Percent,
  Clock,
  Loader2,
} from "lucide-react";

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

export default function ChannelReportsPage() {
  const [period, setPeriod] = useState("today");
  const { tenantUser, loading: authLoading } = useTenantUser();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const tenantId = tenantUser?.tenant_id ?? null;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? null;

  const { data: channels, loading } = useChannelReport(
    tenantId,
    branchId,
    period
  );

  const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);
  const totalOrders = channels.reduce((sum, c) => sum + c.orders, 0);
  const totalCommission = channels.reduce(
    (sum, c) => sum + c.commission,
    0
  );
  const totalNetRevenue = channels.reduce(
    (sum, c) => sum + c.netRevenue,
    0
  );

  const handleExport = () => {
    downloadCSV(
      channels.map((c) => ({
        Channel: c.name,
        Orders: c.orders,
        GrossRevenue: c.revenue,
        CommissionPct: c.commissionPct,
        CommissionAmt: c.commission,
        NetRevenue: c.netRevenue,
        AvgOrder: c.avgOrder,
      })),
      `channel-report-${period}`
    );
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
            Channel Breakdown
          </h1>
          <p className="text-muted-foreground">
            Revenue & performance by sales channel &mdash; Dine-in, Zomato,
            Swiggy, Takeaway
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading || channels.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatINR(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  All channels combined
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Commissions
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-500">
                  -{formatINR(totalCommission)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aggregator platform fees
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatINR(totalNetRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  After commissions
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Across all channels
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Breakdown Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Channel</CardTitle>
          <CardDescription>
            Visual breakdown of revenue share
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No channel data for this period
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((channel) => {
                const pct =
                  totalRevenue > 0
                    ? (channel.revenue / totalRevenue) * 100
                    : 0;
                return (
                  <div key={channel.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {channelLogos[channel.name] ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-black text-white ${channelColors[channel.name] || "bg-gray-500"}`}
                          >
                            {channelLogos[channel.name]}
                          </span>
                        ) : (
                          <div
                            className={`h-3 w-3 rounded-full ${channelColors[channel.name] || "bg-gray-500"}`}
                          />
                        )}
                        <span className="text-sm font-medium">
                          {channel.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {channel.orders} orders
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">
                          {formatINR(channel.revenue)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${channelColors[channel.name] || "bg-gray-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Channel Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No channel data for this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Gross Revenue</TableHead>
                  <TableHead className="text-right">Commission %</TableHead>
                  <TableHead className="text-right">Commission Amt</TableHead>
                  <TableHead className="text-right">Net Revenue</TableHead>
                  <TableHead className="text-right">Avg Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {channelLogos[channel.name] ? (
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-black text-white ${channelColors[channel.name] || "bg-gray-500"}`}
                          >
                            {channelLogos[channel.name]}
                          </span>
                        ) : (
                          <div
                            className={`h-3 w-3 rounded-full ${channelColors[channel.name] || "bg-gray-500"}`}
                          />
                        )}
                        <span className="font-medium">{channel.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {channel.orders}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatINR(channel.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {channel.commissionPct > 0
                        ? `${channel.commissionPct}%`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {channel.commission > 0 ? (
                        <span className="text-red-500">
                          -{formatINR(channel.commission)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatINR(channel.netRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatINR(channel.avgOrder)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totalOrders}</TableCell>
                  <TableCell className="text-right">
                    {formatINR(totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right text-red-500">
                    -{formatINR(totalCommission)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatINR(totalNetRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatINR(
                      totalOrders > 0 ? totalRevenue / totalOrders : 0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
