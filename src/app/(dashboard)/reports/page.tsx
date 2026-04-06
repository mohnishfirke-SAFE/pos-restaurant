"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { BarChart3, TrendingUp, TrendingDown, Download, IndianRupee, ShoppingCart, Users, Clock, Truck } from "lucide-react";

const mockStats = {
  revenue: 125750,
  orders: 89,
  avgOrderValue: 1413,
  customers: 62,
  revenueChange: 12.5,
  ordersChange: 8.3,
};

const mockTopItems = [
  { name: "Butter Chicken", orders: 32, revenue: 12800 },
  { name: "Paneer Tikka", orders: 28, revenue: 8400 },
  { name: "Biryani", orders: 25, revenue: 7500 },
  { name: "Dal Makhani", orders: 22, revenue: 5500 },
  { name: "Naan", orders: 45, revenue: 2250 },
];

const mockHourlyData = [
  { hour: "11AM", orders: 5 }, { hour: "12PM", orders: 15 }, { hour: "1PM", orders: 22 },
  { hour: "2PM", orders: 12 }, { hour: "3PM", orders: 4 }, { hour: "4PM", orders: 3 },
  { hour: "5PM", orders: 2 }, { hour: "6PM", orders: 6 }, { hour: "7PM", orders: 18 },
  { hour: "8PM", orders: 25 }, { hour: "9PM", orders: 20 }, { hour: "10PM", orders: 8 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("today");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your restaurant performance</p>
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
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(mockStats.revenue)}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />+{mockStats.revenueChange}% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.orders}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />+{mockStats.ordersChange}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(mockStats.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.customers}</div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />Hourly Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {mockHourlyData.map((d) => (
                <div key={d.hour} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary transition-all"
                    style={{ height: `${(d.orders / 25) * 100}%`, minHeight: 4 }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.hour}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTopItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{formatINR(item.revenue)}</span>
                </div>
              ))}
            </div>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Dine-in", orders: 52, revenue: 73500, color: "bg-blue-500" },
              { name: "Zomato", orders: 18, revenue: 27000, color: "bg-red-600", logo: "Z", commission: 6750 },
              { name: "Swiggy", orders: 12, revenue: 16800, color: "bg-orange-500", logo: "S", commission: 3360 },
              { name: "Takeaway", orders: 7, revenue: 8450, color: "bg-purple-500" },
            ].map((ch) => (
              <div key={ch.name} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {"logo" in ch && ch.logo ? (
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-black text-white ${ch.color}`}>
                      {ch.logo}
                    </span>
                  ) : (
                    <div className={`h-3 w-3 rounded-full ${ch.color}`} />
                  )}
                  <span className="text-sm font-medium">{ch.name}</span>
                </div>
                <div className="text-xl font-bold">{formatINR(ch.revenue)}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{ch.orders} orders</span>
                  {"commission" in ch && ch.commission ? (
                    <span className="text-red-500">-{formatINR(ch.commission)} comm.</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <a href="/reports/channels" className="text-xs text-primary hover:underline">
              View detailed channel report →
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { method: "UPI", pct: 45, color: "bg-blue-500" },
                { method: "Cash", pct: 30, color: "bg-green-500" },
                { method: "Card", pct: 20, color: "bg-purple-500" },
                { method: "Wallet", pct: 5, color: "bg-orange-500" },
              ].map((p) => (
                <div key={p.method} className="flex items-center gap-3">
                  <span className="w-12 text-sm">{p.method}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm text-muted-foreground">{p.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Order Types</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "Dine-in", count: 52, pct: 58 },
                { type: "Takeaway", count: 25, pct: 28 },
                { type: "Delivery", count: 12, pct: 14 },
              ].map((t) => (
                <div key={t.type} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.type}</p>
                    <p className="text-xs text-muted-foreground">{t.count} orders</p>
                  </div>
                  <Badge variant="secondary">{t.pct}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Staff Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Rahul S.", orders: 28, revenue: 39200 },
                { name: "Priya M.", orders: 22, revenue: 30800 },
                { name: "Amit K.", orders: 18, revenue: 25200 },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.orders} orders</p>
                  </div>
                  <span className="text-sm font-medium">{formatINR(s.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
