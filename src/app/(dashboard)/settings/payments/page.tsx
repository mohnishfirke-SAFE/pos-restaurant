"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Banknote, Wallet } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import { useTenantSettings, useUpdateTenantSettings } from "@/hooks/use-settings";

interface PaymentMethods {
  cash: boolean;
  cards: boolean;
  upi: boolean;
  wallets: boolean;
}

interface PaymentSettings {
  razorpay_key_id: string;
  razorpay_key_secret: string;
  cashfree_app_id: string;
  cashfree_secret_key: string;
  methods: PaymentMethods;
}

const defaultMethods: PaymentMethods = {
  cash: true,
  cards: true,
  upi: true,
  wallets: false,
};

export default function PaymentSettingsPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;

  const { data: tenant, isLoading: tenantLoading } = useTenantSettings(tenantId);
  const updateTenant = useUpdateTenantSettings();

  // Razorpay
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");

  // Cashfree
  const [cashfreeAppId, setCashfreeAppId] = useState("");
  const [cashfreeSecretKey, setCashfreeSecretKey] = useState("");

  // Methods
  const [methods, setMethods] = useState<PaymentMethods>(defaultMethods);

  useEffect(() => {
    if (!tenant) return;
    const payments = (tenant.settings as Record<string, unknown>)
      ?.payments as PaymentSettings | undefined;

    setRazorpayKeyId(payments?.razorpay_key_id ?? "");
    setRazorpayKeySecret(payments?.razorpay_key_secret ?? "");
    setCashfreeAppId(payments?.cashfree_app_id ?? "");
    setCashfreeSecretKey(payments?.cashfree_secret_key ?? "");
    setMethods(payments?.methods ?? defaultMethods);
  }, [tenant]);

  const isLoading = authLoading || tenantLoading;

  function handleUpdateRazorpay() {
    if (!tenant) return;
    updateTenant.mutate({
      id: tenant.id,
      settingsPatch: {
        payments: {
          razorpay_key_id: razorpayKeyId,
          razorpay_key_secret: razorpayKeySecret,
        },
      },
    });
  }

  function handleUpdateCashfree() {
    if (!tenant) return;
    updateTenant.mutate({
      id: tenant.id,
      settingsPatch: {
        payments: {
          cashfree_app_id: cashfreeAppId,
          cashfree_secret_key: cashfreeSecretKey,
        },
      },
    });
  }

  function handleToggleMethod(key: keyof PaymentMethods, enabled: boolean) {
    if (!tenant) return;
    const updated = { ...methods, [key]: enabled };
    setMethods(updated);
    updateTenant.mutate({
      id: tenant.id,
      settingsPatch: {
        payments: { methods: updated },
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Settings</h1>
          <p className="text-muted-foreground">Configure payment gateways and methods</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2].map((j) => (
                  <div key={j} className="grid gap-2">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-9 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const razorpayConnected = !!razorpayKeyId;
  const cashfreeConnected = !!cashfreeAppId;

  const methodList = [
    { key: "cash" as const, name: "Cash", icon: Banknote },
    { key: "cards" as const, name: "Cards (Credit/Debit)", icon: CreditCard },
    { key: "upi" as const, name: "UPI / Bharat QR", icon: Smartphone },
    { key: "wallets" as const, name: "Mobile Wallets", icon: Wallet },
  ];

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
              <Badge variant={razorpayConnected ? "default" : "secondary"}>
                {razorpayConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Key ID</Label>
              <Input
                type="password"
                placeholder="rzp_live_xxxxx"
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Key Secret</Label>
              <Input
                type="password"
                placeholder="Enter key secret"
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleUpdateRazorpay}
              disabled={updateTenant.isPending}
            >
              {updateTenant.isPending ? "Saving..." : "Update Keys"}
            </Button>
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
              <Badge variant={cashfreeConnected ? "default" : "secondary"}>
                {cashfreeConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>App ID</Label>
              <Input
                placeholder="Enter Cashfree App ID"
                value={cashfreeAppId}
                onChange={(e) => setCashfreeAppId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Secret Key</Label>
              <Input
                type="password"
                placeholder="Enter secret key"
                value={cashfreeSecretKey}
                onChange={(e) => setCashfreeSecretKey(e.target.value)}
              />
            </div>
            <Button
              onClick={handleUpdateCashfree}
              disabled={updateTenant.isPending}
            >
              {updateTenant.isPending ? "Connecting..." : cashfreeConnected ? "Update Keys" : "Connect"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Enable or disable payment methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {methodList.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{m.name}</span>
                </div>
                <Switch
                  checked={methods[m.key]}
                  onCheckedChange={(checked) =>
                    handleToggleMethod(m.key, checked)
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
