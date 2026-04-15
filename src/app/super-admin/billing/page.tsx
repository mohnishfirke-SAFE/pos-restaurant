"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { IndianRupee, TrendingUp, Loader2 } from "lucide-react";

interface Invoice {
  tenant_id: string;
  tenant: string;
  plan: string;
  amount: number;
  status: string;
  date: string;
}

interface BillingData {
  mrr: number;
  activeSubscriptions: number;
  trialingCount: number;
  pastDueCount: number;
  cancelledCount: number;
  churnRate: number;
  mrrByPlan: Record<string, number>;
  invoices: Invoice[];
}

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  paid: "default",
  trialing: "secondary",
  trial: "secondary",
  past_due: "destructive",
  overdue: "destructive",
  cancelled: "destructive",
  paused: "secondary",
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/billing")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Billing & Revenue</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Billing & Revenue</h1>
        <p className="text-muted-foreground">Failed to load billing data.</p>
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{formatINR(data.mrr)}</div>
            <div className="text-xs text-muted-foreground">
              {data.activeSubscriptions} active, {data.trialingCount} trialing
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeSubscriptions}</div>
            <div className="text-xs text-muted-foreground">
              {data.pastDueCount} past due, {data.cancelledCount} cancelled
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.churnRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Breakdown */}
      {Object.keys(data.mrrByPlan).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>MRR by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(data.mrrByPlan).map(([plan, amount]) => (
                <div key={plan} className="flex items-center justify-between rounded-md border p-3">
                  <Badge variant={plan === "enterprise" ? "default" : "secondary"}>{plan}</Badge>
                  <span className="font-semibold">{formatINR(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {data.invoices.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">No invoices yet.</p>
          ) : (
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
                {data.invoices.map((b) => (
                  <TableRow key={b.tenant_id}>
                    <TableCell className="font-medium">{b.tenant}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{b.plan}</Badge>
                    </TableCell>
                    <TableCell>{formatINR(b.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[b.status] ?? "secondary"}>{b.status}</Badge>
                    </TableCell>
                    <TableCell>{b.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
