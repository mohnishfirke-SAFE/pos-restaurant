"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils/currency";
import { Plus, Tag, Percent, Clock, Trash2 } from "lucide-react";

const mockPromotions = [
  { id: "1", name: "Lunch Special", type: "percentage", value: 15, minOrder: 500, code: "LUNCH15", uses: 42, maxUses: 100, validUntil: "2026-04-30", isActive: true, isHappyHour: false },
  { id: "2", name: "Happy Hour", type: "happy_hour", value: 20, minOrder: 0, code: null, uses: 0, maxUses: null, validUntil: "2026-12-31", isActive: true, isHappyHour: true },
  { id: "3", name: "First Order", type: "fixed", value: 200, minOrder: 800, code: "FIRST200", uses: 15, maxUses: 50, validUntil: "2026-06-30", isActive: true, isHappyHour: false },
  { id: "4", name: "Weekend BOGO", type: "bogo", value: 0, minOrder: 0, code: "BOGO", uses: 28, maxUses: null, validUntil: "2026-05-15", isActive: false, isHappyHour: false },
];

export default function PromotionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">Manage discounts, coupons, and happy hours</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Promotion</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Promotion</DialogTitle>
              <DialogDescription>Set up a new discount or offer</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input placeholder="e.g., Weekend Special" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select defaultValue="percentage">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="bogo">Buy One Get One</SelectItem>
                      <SelectItem value="happy_hour">Happy Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Value</Label>
                  <Input type="number" placeholder="e.g., 15" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Min Order (INR)</Label>
                  <Input type="number" defaultValue="0" />
                </div>
                <div className="grid gap-2">
                  <Label>Coupon Code</Label>
                  <Input placeholder="SAVE15" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valid From</Label>
                  <Input type="date" />
                </div>
                <div className="grid gap-2">
                  <Label>Valid Until</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Max Uses (leave empty for unlimited)</Label>
                <Input type="number" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)}>Create Promotion</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All Promotions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPromotions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {p.isHappyHour ? <Clock className="h-4 w-4 text-orange-500" /> : <Tag className="h-4 w-4" />}
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {p.type === "percentage" ? "%" : p.type === "fixed" ? "Fixed" : p.type === "bogo" ? "BOGO" : "Happy Hr"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.type === "percentage" || p.type === "happy_hour" ? `${p.value}%` : p.type === "fixed" ? formatINR(p.value) : "-"}
                  </TableCell>
                  <TableCell>{p.code ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.code}</code> : "-"}</TableCell>
                  <TableCell>{p.uses}{p.maxUses ? `/${p.maxUses}` : ""}</TableCell>
                  <TableCell>{p.validUntil}</TableCell>
                  <TableCell><Switch checked={p.isActive} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
