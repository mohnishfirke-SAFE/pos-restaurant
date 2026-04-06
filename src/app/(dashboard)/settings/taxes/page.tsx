"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function TaxSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tax Configuration</h1>
        <p className="text-muted-foreground">Configure GST and tax settings</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Required for GST-compliant invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>GSTIN</Label><Input placeholder="22AAAAA0000A1Z5" /></div>
            <div className="grid gap-2"><Label>Legal Business Name</Label><Input placeholder="Your Restaurant Pvt. Ltd." /></div>
            <div className="grid gap-2"><Label>PAN</Label><Input placeholder="AAAAA0000A" /></div>
            <div className="grid gap-2"><Label>State</Label><Input placeholder="Maharashtra" /></div>
            <Button>Save Details</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Default Tax Rates</CardTitle>
            <CardDescription>These can be overridden per menu item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="font-medium">Food Items</p><p className="text-sm text-muted-foreground">Standard GST rate</p></div>
              <div className="w-24"><Input type="number" defaultValue="5" /></div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="font-medium">Beverages (Non-alcoholic)</p><p className="text-sm text-muted-foreground">GST rate</p></div>
              <div className="w-24"><Input type="number" defaultValue="12" /></div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="font-medium">Service Charge</p><p className="text-sm text-muted-foreground">Optional service charge %</p></div>
              <div className="w-24"><Input type="number" defaultValue="0" /></div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="font-medium">Show GST Breakdown</p><p className="text-sm text-muted-foreground">CGST + SGST on receipts</p></div>
              <Switch defaultChecked />
            </div>
            <Button>Save Tax Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
