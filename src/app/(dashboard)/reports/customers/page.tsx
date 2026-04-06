"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { Users, Repeat, Star } from "lucide-react";

const mockCustomers = [
  { name: "Rajesh Kumar", visits: 24, spent: 42000, avgOrder: 1750, tier: "gold", favorite: "Butter Chicken" },
  { name: "Anita Sharma", visits: 18, spent: 31500, avgOrder: 1750, tier: "silver", favorite: "Paneer Tikka" },
  { name: "Vikram Singh", visits: 15, spent: 26250, avgOrder: 1750, tier: "silver", favorite: "Biryani" },
  { name: "Meera Patel", visits: 8, spent: 14000, avgOrder: 1750, tier: "bronze", favorite: "Dal Makhani" },
];

export default function CustomerReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Insights</h1>
        <p className="text-muted-foreground">Customer behavior and loyalty analytics</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">248</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Repeat Rate</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">38%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Avg Lifetime Value</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatINR(8500)}</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Avg Order</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Favorite Item</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCustomers.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.visits}</TableCell>
                  <TableCell>{formatINR(c.spent)}</TableCell>
                  <TableCell>{formatINR(c.avgOrder)}</TableCell>
                  <TableCell><Badge>{c.tier}</Badge></TableCell>
                  <TableCell>{c.favorite}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
