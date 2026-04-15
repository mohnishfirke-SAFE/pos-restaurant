"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useDailySales } from "@/hooks/use-reports";
import { Download, Loader2 } from "lucide-react";

export default function SalesReportPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const tenantId = tenantUser?.tenant_id ?? null;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? null;

  const { data: dailySales, loading } = useDailySales(tenantId, branchId, 30);

  const handleExport = () => {
    downloadCSV(
      dailySales.map((d) => ({
        Date: d.date,
        Orders: d.orders,
        Revenue: d.revenue,
        AvgOrder: d.avgOrder,
      })),
      "daily-sales-report"
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
          <h1 className="text-2xl font-bold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground">Detailed daily sales breakdown</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={loading || dailySales.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dailySales.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No sales data available for this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySales.map((d) => (
                  <TableRow key={d.date}>
                    <TableCell className="font-medium">{d.date}</TableCell>
                    <TableCell>{d.orders}</TableCell>
                    <TableCell>{formatINR(d.revenue)}</TableCell>
                    <TableCell>{formatINR(d.avgOrder)}</TableCell>
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
