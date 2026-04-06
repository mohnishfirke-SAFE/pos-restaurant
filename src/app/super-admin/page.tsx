"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/currency";
import { Building2, Users, ShoppingCart, IndianRupee } from "lucide-react";

export default function SuperAdminPage() {
  const stats = [
    { title: "Total Tenants", value: "12", icon: Building2, desc: "Active restaurants" },
    { title: "Total Branches", value: "34", icon: Building2, desc: "Across all tenants" },
    { title: "Active Users", value: "156", icon: Users, desc: "Staff accounts" },
    { title: "Platform Revenue", value: formatINR(245000), icon: IndianRupee, desc: "This month's billing" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
