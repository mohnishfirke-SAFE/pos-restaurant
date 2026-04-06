"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatINR } from "@/lib/utils/currency";
import {
  ShoppingCart,
  IndianRupee,
  Users,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  // These will be fetched from the database later
  const stats = [
    {
      title: "Today's Revenue",
      value: formatINR(0),
      icon: IndianRupee,
      description: "Total sales today",
    },
    {
      title: "Orders",
      value: "0",
      icon: ShoppingCart,
      description: "Orders placed today",
    },
    {
      title: "Customers",
      value: "0",
      icon: Users,
      description: "Unique customers today",
    },
    {
      title: "Avg Order Value",
      value: formatINR(0),
      icon: TrendingUp,
      description: "Average order value",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your restaurant&apos;s performance
        </p>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No orders yet. Start by adding menu items and taking orders.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Popular Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add menu items to see your best sellers here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
