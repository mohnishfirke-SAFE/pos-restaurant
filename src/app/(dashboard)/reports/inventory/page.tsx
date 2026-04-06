"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";

const mockData = [
  { name: "Chicken", used: 25, unit: "kg", cost: 5000, wastage: 2.5 },
  { name: "Paneer", used: 15, unit: "kg", cost: 5250, wastage: 1.0 },
  { name: "Rice", used: 40, unit: "kg", cost: 2400, wastage: 3.0 },
  { name: "Oil", used: 10, unit: "L", cost: 1800, wastage: 0.5 },
  { name: "Flour", used: 20, unit: "kg", cost: 800, wastage: 1.5 },
];

export default function InventoryReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Report</h1>
        <p className="text-muted-foreground">Usage, costs, and wastage analysis</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Usage Cost</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatINR(15250)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Wastage</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">8.5 kg</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Food Cost %</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">32%</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Ingredient Usage This Week</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Wastage</TableHead>
                <TableHead>Waste %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((d) => (
                <TableRow key={d.name}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.used} {d.unit}</TableCell>
                  <TableCell>{formatINR(d.cost)}</TableCell>
                  <TableCell>{d.wastage} {d.unit}</TableCell>
                  <TableCell>
                    <Badge variant={d.wastage / d.used > 0.1 ? "destructive" : "secondary"}>
                      {((d.wastage / d.used) * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
