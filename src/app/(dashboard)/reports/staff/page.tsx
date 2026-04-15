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
import { useStaffReport } from "@/hooks/use-reports";
import { Loader2 } from "lucide-react";

export default function StaffReportPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const tenantId = tenantUser?.tenant_id ?? null;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? null;

  const { data: staff, loading } = useStaffReport(tenantId, branchId);

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
          Staff Performance
        </h1>
        <p className="text-muted-foreground">Employee productivity metrics</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No staff order data available for this month
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg Service (min)</TableHead>
                  <TableHead>Hours Worked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.role}</Badge>
                    </TableCell>
                    <TableCell>{s.orders}</TableCell>
                    <TableCell>{formatINR(s.revenue)}</TableCell>
                    <TableCell>{s.avgServiceMin} min</TableCell>
                    <TableCell>{s.hoursWorked} hrs</TableCell>
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
