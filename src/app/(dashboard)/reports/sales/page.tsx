"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/utils/currency";
import { Download } from "lucide-react";

const mockDailySales = [
  { date: "2026-04-06", orders: 89, revenue: 125750, avgOrder: 1413 },
  { date: "2026-04-05", orders: 78, revenue: 110500, avgOrder: 1417 },
  { date: "2026-04-04", orders: 92, revenue: 131800, avgOrder: 1433 },
  { date: "2026-04-03", orders: 65, revenue: 89750, avgOrder: 1381 },
  { date: "2026-04-02", orders: 71, revenue: 98400, avgOrder: 1386 },
  { date: "2026-04-01", orders: 85, revenue: 119000, avgOrder: 1400 },
];

export default function SalesReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground">Detailed daily sales breakdown</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Daily Sales</CardTitle></CardHeader>
        <CardContent>
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
              {mockDailySales.map((d) => (
                <TableRow key={d.date}>
                  <TableCell className="font-medium">{d.date}</TableCell>
                  <TableCell>{d.orders}</TableCell>
                  <TableCell>{formatINR(d.revenue)}</TableCell>
                  <TableCell>{formatINR(d.avgOrder)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
