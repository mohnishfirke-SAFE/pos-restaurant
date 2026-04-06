"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — in production, fetched from orders table with aggregation
// ---------------------------------------------------------------------------
const mockChannelData = {
  today: {
    channels: [
      {
        name: "Dine-in",
        icon: UtensilsCrossed,
        color: "bg-blue-500",
        orders: 52,
        revenue: 73500,
        avgOrder: 1413,
        commission: 0,
        netRevenue: 73500,
        change: 8.5,
      },
      {
        name: "Zomato",
        icon: Truck,
        color: "bg-red-600",
        logo: "Z",
        orders: 18,
        revenue: 27000,
        avgOrder: 1500,
        commission: 6750,
        commissionPct: 25,
        netRevenue: 20250,
        change: 15.2,
      },
      {
        name: "Swiggy",
        icon: Truck,
        color: "bg-orange-500",
        logo: "S",
        orders: 12,
        revenue: 16800,
        avgOrder: 1400,
        commission: 3360,
        commissionPct: 20,
        netRevenue: 13440,
        change: -3.1,
      },
      {
        name: "Takeaway",
        icon: ShoppingBag,
        color: "bg-purple-500",
        orders: 7,
        revenue: 8450,
        avgOrder: 1207,
        commission: 0,
        netRevenue: 8450,
        change: 2.0,
      },
    ],
    peakHours: {
      "Dine-in": "12PM - 2PM",
      Zomato: "7PM - 9PM",
      Swiggy: "8PM - 10PM",
      Takeaway: "1PM - 3PM",
    },
    topItemsByChannel: {
      "Dine-in": [
        { name: "Butter Chicken", orders: 15 },
        { name: "Biryani", orders: 12 },
        { name: "Naan", orders: 28 },
      ],
      Zomato: [
        { name: "Chicken Biryani", orders: 8 },
        { name: "Paneer Tikka", orders: 6 },
        { name: "Dal Makhani", orders: 5 },
      ],
      Swiggy: [
        { name: "Veg Thali", orders: 5 },
        { name: "Chole Bhature", orders: 4 },
        { name: "Butter Chicken", orders: 3 },
      ],
    },
  },
};

export default function ChannelReportsPage() {
  const [period, setPeriod] = useState("today");
  const data = mockChannelData.today;

  const totalRevenue = data.channels.reduce((sum, c) => sum + c.revenue, 0);
  const totalOrders = data.channels.reduce((sum, c) => sum + c.orders, 0);
  const totalCommission = data.channels.reduce((sum, c) => sum + c.commission, 0);
  const totalNetRevenue = data.channels.reduce((sum, c) => sum + c.netRevenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channel Breakdown</h1>
          <p className="text-muted-foreground">
            Revenue & performance by sales channel — Dine-in, Zomato, Swiggy, Takeaway
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
          <Button variant="outline" size="sm">
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
            <div className="text-2xl font-bold">{formatINR(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All channels combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Commissions</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">-{formatINR(totalCommission)}</div>
            <p className="text-xs text-muted-foreground">Zomato + Swiggy fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatINR(totalNetRevenue)}</div>
            <p className="text-xs text-muted-foreground">After commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Across all channels</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Breakdown Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Channel</CardTitle>
          <CardDescription>Visual breakdown of revenue share</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.channels.map((channel) => {
              const pct = totalRevenue > 0 ? (channel.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={channel.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {"logo" in channel ? (
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-black text-white ${channel.color}`}
                        >
                          {channel.logo}
                        </span>
                      ) : (
                        <div className={`h-3 w-3 rounded-full ${channel.color}`} />
                      )}
                      <span className="text-sm font-medium">{channel.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {channel.orders} orders
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{formatINR(channel.revenue)}</span>
                      <span className="text-xs text-muted-foreground">({pct.toFixed(1)}%)</span>
                      <div className="flex items-center gap-1 text-xs">
                        {channel.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={channel.change >= 0 ? "text-green-500" : "text-red-500"}>
                          {channel.change >= 0 ? "+" : ""}
                          {channel.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${channel.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Channel Metrics</CardTitle>
        </CardHeader>
        <CardContent>
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
                <TableHead>Peak Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.channels.map((channel) => (
                <TableRow key={channel.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {"logo" in channel ? (
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-black text-white ${channel.color}`}
                        >
                          {channel.logo}
                        </span>
                      ) : (
                        <div className={`h-3 w-3 rounded-full ${channel.color}`} />
                      )}
                      <span className="font-medium">{channel.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{channel.orders}</TableCell>
                  <TableCell className="text-right">{formatINR(channel.revenue)}</TableCell>
                  <TableCell className="text-right">
                    {"commissionPct" in channel ? `${channel.commissionPct}%` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {channel.commission > 0 ? (
                      <span className="text-red-500">-{formatINR(channel.commission)}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatINR(channel.netRevenue)}
                  </TableCell>
                  <TableCell className="text-right">{formatINR(channel.avgOrder)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {data.peakHours[channel.name as keyof typeof data.peakHours] || "-"}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="border-t-2 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{totalOrders}</TableCell>
                <TableCell className="text-right">{formatINR(totalRevenue)}</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right text-red-500">
                  -{formatINR(totalCommission)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatINR(totalNetRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatINR(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Items by Channel */}
      <div className="grid gap-4 lg:grid-cols-3">
        {Object.entries(data.topItemsByChannel).map(([channel, items]) => {
          const channelInfo = data.channels.find((c) => c.name === channel);
          return (
            <Card key={channel}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {channelInfo && "logo" in channelInfo ? (
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-black text-white ${channelInfo.color}`}
                    >
                      {channelInfo.logo}
                    </span>
                  ) : (
                    <div className={`h-3 w-3 rounded-full ${channelInfo?.color || "bg-gray-500"}`} />
                  )}
                  Top Items — {channel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.orders} orders
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
