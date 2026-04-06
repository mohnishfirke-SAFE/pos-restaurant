"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Banknote, Wallet } from "lucide-react";

export default function PaymentSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-muted-foreground">Configure payment gateways and methods</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Razorpay</CardTitle>
                  <CardDescription>Cards, UPI, Netbanking, Wallets</CardDescription>
                </div>
              </div>
              <Badge>Connected</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>Key ID</Label><Input type="password" defaultValue="rzp_live_xxxxx" /></div>
            <div className="grid gap-2"><Label>Key Secret</Label><Input type="password" defaultValue="•••••••••••" /></div>
            <Button variant="outline">Update Keys</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Cashfree</CardTitle>
                  <CardDescription>Backup payment gateway</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Not Connected</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>App ID</Label><Input placeholder="Enter Cashfree App ID" /></div>
            <div className="grid gap-2"><Label>Secret Key</Label><Input type="password" placeholder="Enter secret key" /></div>
            <Button>Connect</Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Payment Methods</CardTitle><CardDescription>Enable or disable payment methods</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "Cash", icon: Banknote, enabled: true },
            { name: "Cards (Credit/Debit)", icon: CreditCard, enabled: true },
            { name: "UPI / Bharat QR", icon: Smartphone, enabled: true },
            { name: "Mobile Wallets", icon: Wallet, enabled: false },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.name} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{m.name}</span>
                </div>
                <Switch defaultChecked={m.enabled} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
