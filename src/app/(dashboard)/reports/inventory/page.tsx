"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import { useInventoryReport } from "@/hooks/use-reports";
import { Loader2 } from "lucide-react";

export default function InventoryReportPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const tenantId = tenantUser?.tenant_id ?? null;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? null;

  const { data: items, loading } = useInventoryReport(tenantId, branchId);

  const totalUsageCost = items.reduce((s, d) => s + d.cost, 0);
  const totalWastage = items.reduce((s, d) => s + d.wastage, 0);
  const totalUsed = items.reduce((s, d) => s + d.used, 0);
  const wastePct =
    totalUsed > 0 ? ((totalWastage / totalUsed) * 100).toFixed(1) : "0.0";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Inventory Report
        </h1>
        <p className="text-muted-foreground">
          Usage, costs, and wastage analysis
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Usage Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {formatINR(totalUsageCost)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Wastage</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {totalWastage.toFixed(1)} units
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Waste %</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{wastePct}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredient Usage This Week</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No inventory data available. Ensure branch stock and stock movements exist.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Wastage</TableHead>
                  <TableHead>Waste %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>
                      {d.currentStock.toFixed(1)} {d.unit}
                    </TableCell>
                    <TableCell>
                      {d.used.toFixed(1)} {d.unit}
                    </TableCell>
                    <TableCell>{formatINR(d.cost)}</TableCell>
                    <TableCell>
                      {d.wastage.toFixed(1)} {d.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          d.used > 0 && d.wastage / d.used > 0.1
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {d.used > 0
                          ? ((d.wastage / d.used) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </Badge>
                    </TableCell>
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
