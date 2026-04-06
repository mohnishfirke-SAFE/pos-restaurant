"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/utils/currency";
import { Search, Plus, MoreHorizontal } from "lucide-react";

const mockTenants = [
  { id: "1", name: "Spice Garden", email: "admin@spicegarden.in", plan: "professional", branches: 3, users: 12, revenue: 850000, status: "active" },
  { id: "2", name: "Tandoor Express", email: "owner@tandoor.in", plan: "starter", branches: 1, users: 4, revenue: 320000, status: "active" },
  { id: "3", name: "Royal Biryani", email: "ceo@royalbiryani.in", plan: "enterprise", branches: 8, users: 45, revenue: 2100000, status: "active" },
  { id: "4", name: "Chai Point", email: "hello@chaipoint.in", plan: "starter", branches: 1, users: 3, revenue: 0, status: "trialing" },
  { id: "5", name: "Dosa Corner", email: "info@dosacorner.in", plan: "professional", branches: 2, users: 8, revenue: 150000, status: "past_due" },
];

const planColors: Record<string, "default" | "secondary" | "destructive"> = {
  starter: "secondary", professional: "default", enterprise: "default",
};

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default", trialing: "secondary", past_due: "destructive", cancelled: "destructive",
};

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Button><Plus className="mr-2 h-4 w-4" />Onboard Tenant</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tenants..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={planColors[t.plan]}>{t.plan}</Badge></TableCell>
                  <TableCell>{t.branches}</TableCell>
                  <TableCell>{t.users}</TableCell>
                  <TableCell>{formatINR(t.revenue)}</TableCell>
                  <TableCell><Badge variant={statusColors[t.status]}>{t.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
