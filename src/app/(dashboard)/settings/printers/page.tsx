"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Plus } from "lucide-react";

export default function PrinterSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Printers</h1>
          <p className="text-muted-foreground">Configure receipt and KOT printers</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add Printer</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { name: "Receipt Printer", type: "USB", model: "Epson TM-T82", status: "online" },
          { name: "Kitchen KOT Printer", type: "Network", model: "Epson TM-U220", status: "online" },
        ].map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Printer className="h-5 w-5" />
                  <div><CardTitle className="text-base">{p.name}</CardTitle><CardDescription>{p.model}</CardDescription></div>
                </div>
                <Badge variant={p.status === "online" ? "default" : "destructive"}>{p.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Connection Type</Label>
                <Select defaultValue={p.type.toLowerCase()}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="network">Network (LAN)</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-print receipts</span>
                <Switch defaultChecked />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Test Print</Button>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
