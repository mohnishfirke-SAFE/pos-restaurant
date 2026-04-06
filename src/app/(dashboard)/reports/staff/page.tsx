"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";

const mockStaff = [
  { name: "Rahul S.", role: "waiter", orders: 128, revenue: 180500, avgTime: 12, rating: 4.5 },
  { name: "Priya M.", role: "cashier", orders: 102, revenue: 142800, avgTime: 8, rating: 4.7 },
  { name: "Amit K.", role: "waiter", orders: 95, revenue: 133000, avgTime: 15, rating: 4.2 },
  { name: "Sunita D.", role: "waiter", orders: 88, revenue: 123200, avgTime: 11, rating: 4.4 },
];

export default function StaffReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Performance</h1>
        <p className="text-muted-foreground">Employee productivity metrics</p>
      </div>
      <Card>
        <CardHeader><CardTitle>This Month</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Avg Service (min)</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStaff.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="secondary">{s.role}</Badge></TableCell>
                  <TableCell>{s.orders}</TableCell>
                  <TableCell>{formatINR(s.revenue)}</TableCell>
                  <TableCell>{s.avgTime} min</TableCell>
                  <TableCell>{s.rating}/5</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
