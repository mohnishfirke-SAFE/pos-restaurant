"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

const mockBranches = [
  { id: "1", name: "Main Branch", code: "MAIN", phone: "+91 98765 43210", isActive: true },
  { id: "2", name: "City Center", code: "CC-01", phone: "+91 98765 43211", isActive: true },
  { id: "3", name: "Airport Outlet", code: "AIR-01", phone: "+91 98765 43212", isActive: false },
];

export default function BranchesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground">Manage your restaurant locations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Branch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Branch</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Branch Name</Label><Input placeholder="e.g., Downtown Outlet" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Code</Label><Input placeholder="e.g., DT-01" /></div>
                <div className="grid gap-2"><Label>Phone</Label><Input placeholder="+91" /></div>
              </div>
              <div className="grid gap-2"><Label>GSTIN (if different)</Label><Input /></div>
            </div>
            <DialogFooter><Button onClick={() => setDialogOpen(false)}>Create Branch</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>All Branches</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBranches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{b.code}</code></TableCell>
                  <TableCell>{b.phone}</TableCell>
                  <TableCell><Switch checked={b.isActive} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
