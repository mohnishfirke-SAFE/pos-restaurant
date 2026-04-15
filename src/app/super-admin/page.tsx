"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/currency";
import { Building2, Users, ShoppingCart, IndianRupee, Loader2 } from "lucide-react";

interface Stats {
  totalTenants: number;
  totalBranches: number;
  activeUsers: number;
  monthlyRevenue: number;
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { title: "Total Tenants", value: String(stats.totalTenants), icon: Building2, desc: "Active restaurants" },
        { title: "Total Branches", value: String(stats.totalBranches), icon: Building2, desc: "Across all tenants" },
        { title: "Active Users", value: String(stats.activeUsers), icon: Users, desc: "Staff accounts" },
        { title: "Platform Revenue", value: formatINR(stats.monthlyRevenue), icon: IndianRupee, desc: "This month's billing" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Overview</h1>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((s) => {
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
      ) : (
        <p className="text-muted-foreground">Failed to load stats.</p>
      )}
    </div>
  );
}
