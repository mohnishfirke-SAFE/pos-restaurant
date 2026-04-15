"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTenantUser } from "@/lib/auth/hooks";
import { useTenantSettings, useUpdateTenantSettings } from "@/hooks/use-settings";

interface TaxSettings {
  rates: {
    food: number;
    beverages: number;
    service_charge: number;
  };
  show_gst_breakdown: boolean;
}

const defaultTaxSettings: TaxSettings = {
  rates: { food: 5, beverages: 12, service_charge: 0 },
  show_gst_breakdown: true,
};

export default function TaxSettingsPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;

  const { data: tenant, isLoading: tenantLoading } = useTenantSettings(tenantId);
  const updateTenant = useUpdateTenantSettings();

  // Business details form
  const [gstin, setGstin] = useState("");
  const [legalName, setLegalName] = useState("");
  const [pan, setPan] = useState("");
  const [state, setState] = useState("");

  // Tax rates form
  const [foodRate, setFoodRate] = useState(5);
  const [bevRate, setBevRate] = useState(12);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Populate form when tenant data loads
  useEffect(() => {
    if (!tenant) return;
    setGstin(tenant.gstin ?? "");
    setLegalName(tenant.name ?? "");
    setPan(tenant.pan ?? "");
    setState(
      (tenant.address as Record<string, string>)?.state ?? ""
    );

    const tax = (tenant.settings as Record<string, unknown>)?.tax as
      | TaxSettings
      | undefined;
    const rates = tax?.rates ?? defaultTaxSettings.rates;
    setFoodRate(rates.food);
    setBevRate(rates.beverages);
    setServiceCharge(rates.service_charge);
    setShowBreakdown(
      tax?.show_gst_breakdown ?? defaultTaxSettings.show_gst_breakdown
    );
  }, [tenant]);

  const isLoading = authLoading || tenantLoading;

  function handleSaveDetails() {
    if (!tenant) return;
    updateTenant.mutate({
      id: tenant.id,
      flatFields: {
        gstin,
        pan,
        name: legalName,
        address: {
          ...((tenant.address as Record<string, unknown>) ?? {}),
          state,
        },
      },
    });
  }

  function handleSaveTaxSettings() {
    if (!tenant) return;
    updateTenant.mutate({
      id: tenant.id,
      settingsPatch: {
        tax: {
          rates: {
            food: Number(foodRate),
            beverages: Number(bevRate),
            service_charge: Number(serviceCharge),
          },
          show_gst_breakdown: showBreakdown,
        },
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tax Configuration</h1>
          <p className="text-muted-foreground">Configure GST and tax settings</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-56 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
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
            <div className="grid gap-2">
              <Label>GSTIN</Label>
              <Input
                placeholder="22AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Legal Business Name</Label>
              <Input
                placeholder="Your Restaurant Pvt. Ltd."
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>PAN</Label>
              <Input
                placeholder="AAAAA0000A"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>State</Label>
              <Input
                placeholder="Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveDetails}
              disabled={updateTenant.isPending}
            >
              {updateTenant.isPending ? "Saving..." : "Save Details"}
            </Button>
            {updateTenant.isSuccess && (
              <p className="text-sm text-green-600">Saved successfully</p>
            )}
            {updateTenant.isError && (
              <p className="text-sm text-destructive">
                Failed to save. Please try again.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Default Tax Rates</CardTitle>
            <CardDescription>These can be overridden per menu item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Food Items</p>
                <p className="text-sm text-muted-foreground">Standard GST rate</p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  value={foodRate}
                  onChange={(e) => setFoodRate(Number(e.target.value))}
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Beverages (Non-alcoholic)</p>
                <p className="text-sm text-muted-foreground">GST rate</p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  value={bevRate}
                  onChange={(e) => setBevRate(Number(e.target.value))}
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Service Charge</p>
                <p className="text-sm text-muted-foreground">
                  Optional service charge %
                </p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  value={serviceCharge}
                  onChange={(e) =>
                    setServiceCharge(Number(e.target.value))
                  }
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show GST Breakdown</p>
                <p className="text-sm text-muted-foreground">
                  CGST + SGST on receipts
                </p>
              </div>
              <Switch
                checked={showBreakdown}
                onCheckedChange={setShowBreakdown}
              />
            </div>
            <Button
              onClick={handleSaveTaxSettings}
              disabled={updateTenant.isPending}
            >
              {updateTenant.isPending ? "Saving..." : "Save Tax Settings"}
            </Button>
            {updateTenant.isSuccess && (
              <p className="text-sm text-green-600">Saved successfully</p>
            )}
            {updateTenant.isError && (
              <p className="text-sm text-destructive">
                Failed to save. Please try again.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
