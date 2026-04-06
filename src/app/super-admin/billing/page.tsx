"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { IndianRupee, TrendingUp } from "lucide-react";

const mockBilling = [
  { tenant: "Royal Biryani", plan: "enterprise", amount: 25000, status: "paid", date: "2026-04-01" },
  { tenant: "Spice Garden", plan: "professional", amount: 9999, status: "paid", date: "2026-04-01" },
  { tenant: "Tandoor Express", plan: "starter", amount: 2999, status: "paid", date: "2026-04-01" },
  { tenant: "Dosa Corner", plan: "professional", amount: 9999, status: "overdue", date: "2026-03-01" },
  { tenant: "Chai Point", plan: "starter", amount: 0, status: "trial", date: "2026-04-15" },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing & Revenue</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">MRR</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(47997)}</div>
            <div className="flex items-center text-xs text-green-600"><TrendingUp className="mr-1 h-3 w-3" />+15% MoM</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Active Subscriptions</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">11</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Churn Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">2.1%</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBilling.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{b.tenant}</TableCell>
                  <TableCell><Badge variant="secondary">{b.plan}</Badge></TableCell>
                  <TableCell>{formatINR(b.amount)}</TableCell>
                  <TableCell><Badge variant={b.status === "paid" ? "default" : b.status === "trial" ? "secondary" : "destructive"}>{b.status}</Badge></TableCell>
                  <TableCell>{b.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
