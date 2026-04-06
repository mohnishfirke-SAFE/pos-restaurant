"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ExternalLink, RefreshCw, Check, AlertCircle, Copy, Loader2,
  Link2, Unlink, ArrowUpDown, Clock, ShieldCheck, Play, Zap, TestTube2
} from "lucide-react";

interface Integration {
  id: string;
  tenant_id: string;
  branch_id: string;
  platform: string;
  is_active: boolean;
  api_key: string;
  api_secret: string | null;
  merchant_id: string | null;
  webhook_secret: string;
  auto_accept: boolean;
  auto_accept_seconds: number;
  default_commission_pct: number;
  store_status: string;
  last_synced_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
}

const PLATFORMS = [
  {
    id: "zomato",
    name: "Zomato",
    logo: "Z",
    color: "bg-red-600",
    description: "India's leading food delivery platform. Sync menu, receive orders automatically, manage outlet status.",
    features: ["Auto menu sync", "Order injection to KDS", "Item availability toggle", "Outlet open/close", "Auto-accept orders", "Commission tracking"],
    fields: [
      { key: "merchant_id", label: "Restaurant ID", placeholder: "Your Zomato Restaurant ID", type: "text" },
      { key: "api_key", label: "API Key", placeholder: "Zomato POS API Key", type: "password" },
      { key: "api_secret", label: "API Secret", placeholder: "Zomato POS API Secret", type: "password" },
    ],
    docs: "https://www.zomato.com/developer/integration/",
    webhookEvents: ["order.placed", "order.cancelled", "delivery.status_update"],
    defaultCommission: 25,
  },
  {
    id: "swiggy",
    name: "Swiggy",
    logo: "S",
    color: "bg-orange-500",
    description: "Connect via UrbanPiper or direct integration. Receive Swiggy orders and push menu updates.",
    features: ["Order import via middleware", "Menu sync", "Store status", "Availability management", "Auto-accept orders", "Commission tracking"],
    fields: [
      { key: "merchant_id", label: "Vendor/Store ID", placeholder: "Swiggy Vendor ID", type: "text" },
      { key: "middleware", label: "Middleware", placeholder: "Select middleware provider", type: "select", options: ["urbanpiper", "petpooja", "direct"] },
      { key: "api_key", label: "API Key", placeholder: "Middleware API Key", type: "password" },
      { key: "api_secret", label: "API Secret", placeholder: "Middleware API Secret", type: "password" },
    ],
    docs: "https://www.urbanpiper.com/",
    webhookEvents: ["order.placed", "order.cancelled", "delivery.status_update"],
    defaultCommission: 20,
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<string | null>(null);
  const [detailDialog, setDetailDialog] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [simulateResult, setSimulateResult] = useState<Record<string, unknown> | null>(null);

  const tenantId = useTenantId();
  const { activeBranchId } = useBranchStore();
  const supabase = createClient();

  const loadIntegrations = useCallback(async () => {
    const { data } = await supabase
      .from("delivery_integrations")
      .select("*")
      .order("platform");
    if (data) setIntegrations(data as Integration[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  function getIntegration(platformId: string): Integration | undefined {
    return integrations.find((i) => i.platform === platformId);
  }

  async function handleConnect(platformId: string) {
    if (!tenantId || !activeBranchId) return;
    setSaving(true);

    const platform = PLATFORMS.find((p) => p.id === platformId)!;

    const { error } = await supabase.from("delivery_integrations").upsert(
      {
        tenant_id: tenantId,
        branch_id: activeBranchId,
        platform: platformId,
        api_key: formData.api_key || "",
        api_secret: formData.api_secret || null,
        merchant_id: formData.merchant_id || formData.vendor_id || null,
        is_active: true,
        default_commission_pct: platform.defaultCommission,
        config: formData.middleware ? { middleware: formData.middleware } : {},
      },
      { onConflict: "tenant_id,branch_id,platform" }
    );

    if (!error) {
      await loadIntegrations();
      setConnectDialog(null);
      setFormData({});
    }
    setSaving(false);
  }

  async function handleToggle(integration: Integration) {
    await supabase
      .from("delivery_integrations")
      .update({ is_active: !integration.is_active, updated_at: new Date().toISOString() })
      .eq("id", integration.id);
    await loadIntegrations();
  }

  async function handleAutoAcceptToggle(integration: Integration) {
    await supabase
      .from("delivery_integrations")
      .update({
        auto_accept: !integration.auto_accept,
        auto_accept_seconds: !integration.auto_accept ? 30 : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);
    await loadIntegrations();
  }

  async function handleAutoAcceptDelay(integration: Integration, seconds: number) {
    await supabase
      .from("delivery_integrations")
      .update({ auto_accept_seconds: seconds, updated_at: new Date().toISOString() })
      .eq("id", integration.id);
    await loadIntegrations();
  }

  async function handleStoreStatus(integration: Integration, status: string) {
    await supabase
      .from("delivery_integrations")
      .update({ store_status: status, updated_at: new Date().toISOString() })
      .eq("id", integration.id);
    await loadIntegrations();
  }

  async function handleDisconnect(integration: Integration) {
    await supabase.from("delivery_integrations").delete().eq("id", integration.id);
    await loadIntegrations();
    setDetailDialog(null);
  }

  async function handleSync(integration: Integration, action: string) {
    setSyncing(integration.id);
    await fetch("/api/integrations/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ integration_id: integration.id, action }),
    });
    await loadIntegrations();
    setSyncing(null);
  }

  async function handleSimulate(platformId: string) {
    if (!tenantId || !activeBranchId) return;
    setSimulating(platformId);
    setSimulateResult(null);

    try {
      const res = await fetch("/api/integrations/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          branch_id: activeBranchId,
          platform: platformId,
        }),
      });
      const data = await res.json();
      setSimulateResult(data);
    } catch {
      setSimulateResult({ error: "Simulation failed" });
    }
    setSimulating(null);
  }

  function copyWebhookUrl(integration: Integration) {
    const url = `${window.location.origin}/api/webhooks/aggregator?secret=${integration.webhook_secret}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const connectedCount = integrations.filter((i) => i.is_active).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Online Delivery Integrations</h1>
          <p className="text-muted-foreground">
            Connect Zomato & Swiggy to receive orders directly in your POS — {connectedCount} active
          </p>
        </div>
      </div>

      {/* Simulate order banner */}
      {connectedCount > 0 && (
        <Card className="border-dashed border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Test Mode</span>
              <span className="text-sm text-muted-foreground">
                Simulate incoming orders from platforms for testing
              </span>
            </div>
            <div className="flex gap-2">
              {integrations.filter((i) => i.is_active).map((i) => {
                const p = PLATFORMS.find((p) => p.id === i.platform)!;
                return (
                  <Button
                    key={i.platform}
                    size="sm"
                    variant="outline"
                    onClick={() => handleSimulate(i.platform)}
                    disabled={simulating === i.platform}
                  >
                    {simulating === i.platform ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="mr-1 h-3 w-3" />
                    )}
                    Simulate {p.name} Order
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulation result */}
      {simulateResult && (
        <Card className="border-green-500/50">
          <CardContent className="py-3">
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(simulateResult, null, 2)}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setSimulateResult(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Platform Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const integration = getIntegration(platform.id);
          const isConnected = !!integration;

          return (
            <Card key={platform.id} className={isConnected && integration.is_active ? "border-green-500/50" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${platform.color} text-white font-bold text-lg`}>
                      {platform.logo}
                    </div>
                    <div>
                      <CardTitle className="text-base">{platform.name}</CardTitle>
                      {isConnected ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant={integration.is_active ? "default" : "secondary"} className="text-[10px]">
                            {integration.is_active ? (
                              <><Check className="mr-1 h-2.5 w-2.5" />Connected</>
                            ) : (
                              "Paused"
                            )}
                          </Badge>
                          {integration.merchant_id && (
                            <Badge variant="outline" className="text-[10px]">
                              ID: {integration.merchant_id}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              integration.store_status === "open"
                                ? "border-green-500 text-green-600"
                                : integration.store_status === "busy"
                                  ? "border-amber-500 text-amber-600"
                                  : "border-red-500 text-red-600"
                            }`}
                          >
                            Store: {integration.store_status}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="mt-1 text-[10px]">Not Connected</Badge>
                      )}
                    </div>
                  </div>
                  {isConnected && (
                    <Switch
                      checked={integration.is_active}
                      onCheckedChange={() => handleToggle(integration)}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-xs">{platform.description}</CardDescription>
                <Separator />
                <div className="flex flex-wrap gap-1">
                  {platform.features.map((f) => (
                    <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                  ))}
                </div>

                {/* Auto-accept status */}
                {isConnected && (
                  <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium">Auto-accept orders</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.auto_accept && (
                        <span className="text-[10px] text-muted-foreground">
                          {integration.auto_accept_seconds}s delay
                        </span>
                      )}
                      <Switch
                        checked={integration.auto_accept}
                        onCheckedChange={() => handleAutoAcceptToggle(integration)}
                      />
                    </div>
                  </div>
                )}

                {isConnected && integration.last_synced_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last synced: {new Date(integration.last_synced_at).toLocaleString("en-IN")}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {isConnected ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(integration, "menu_sync")}
                        disabled={syncing === integration.id}
                      >
                        {syncing === integration.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1 h-3 w-3" />
                        )}
                        Sync Menu
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDetailDialog(platform.id)}>
                        <ShieldCheck className="mr-1 h-3 w-3" />Settings
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => {
                      setFormData({});
                      setConnectDialog(platform.id);
                    }}>
                      <Link2 className="mr-1 h-3 w-3" />Connect
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild>
                    <a href={platform.docs} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />Docs
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connect Dialog */}
      {connectDialog && (() => {
        const platform = PLATFORMS.find((p) => p.id === connectDialog)!;
        return (
          <Dialog open={!!connectDialog} onOpenChange={() => setConnectDialog(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${platform.color} text-white text-sm font-bold`}>
                    {platform.logo}
                  </div>
                  Connect {platform.name}
                </DialogTitle>
                <DialogDescription>
                  Enter your {platform.name} API credentials to enable integration
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {platform.fields.map((field) => (
                  <div key={field.key} className="grid gap-2">
                    <Label>{field.label}</Label>
                    {field.type === "select" && field.options ? (
                      <Select
                        value={formData[field.key] || ""}
                        onValueChange={(v) => setFormData((prev) => ({ ...prev, [field.key]: v }))}
                      >
                        <SelectTrigger><SelectValue placeholder={field.placeholder} /></SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}

                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs font-medium mb-1">Webhook Events</p>
                  <p className="text-xs text-muted-foreground">
                    After connecting, configure these webhook events in your {platform.name} dashboard:
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {platform.webhookEvents.map((e) => (
                      <Badge key={e} variant="outline" className="text-[10px] font-mono">{e}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConnectDialog(null)}>Cancel</Button>
                <Button onClick={() => handleConnect(platform.id)} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                  Connect {platform.name}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Detail/Settings Dialog */}
      {detailDialog && (() => {
        const platform = PLATFORMS.find((p) => p.id === detailDialog)!;
        const integration = getIntegration(detailDialog);
        if (!integration) return null;

        const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/aggregator?secret=${integration.webhook_secret}`;

        return (
          <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${platform.color} text-white text-sm font-bold`}>
                    {platform.logo}
                  </div>
                  {platform.name} Settings
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Status */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Connection Status</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.is_active ? "Receiving orders and syncing" : "Paused — no data flowing"}
                    </p>
                  </div>
                  <Badge variant={integration.is_active ? "default" : "secondary"}>
                    {integration.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>

                {/* Store Status */}
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">Store Status on {platform.name}</p>
                  <Select
                    value={integration.store_status}
                    onValueChange={(v) => handleStoreStatus(integration, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open — Accepting orders</SelectItem>
                      <SelectItem value="busy">Busy — Longer prep time</SelectItem>
                      <SelectItem value="closed">Closed — Not accepting orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto Accept */}
                <div className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-Accept Orders</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically accept incoming orders after a delay
                      </p>
                    </div>
                    <Switch
                      checked={integration.auto_accept}
                      onCheckedChange={() => handleAutoAcceptToggle(integration)}
                    />
                  </div>
                  {integration.auto_accept && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Accept delay</Label>
                        <span className="text-xs font-mono text-muted-foreground">
                          {integration.auto_accept_seconds} seconds
                        </span>
                      </div>
                      <Slider
                        value={[integration.auto_accept_seconds]}
                        onValueChange={([v]) => handleAutoAcceptDelay(integration, v)}
                        min={0}
                        max={120}
                        step={5}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        0 = instant accept. Higher values give you time to review before auto-acceptance.
                      </p>
                    </div>
                  )}
                </div>

                {/* Commission */}
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Default Commission</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {integration.default_commission_pct}% per order — tracked in Channel Breakdown reports
                  </p>
                </div>

                {/* Merchant ID */}
                {integration.merchant_id && (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">Store / Restaurant ID</p>
                    <p className="mt-1 font-mono text-sm">{integration.merchant_id}</p>
                  </div>
                )}

                {/* Webhook URL */}
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">Webhook URL</p>
                  <p className="text-xs text-muted-foreground">
                    Paste this URL in your {platform.name} partner dashboard to receive orders:
                  </p>
                  <div className="flex gap-2">
                    <Input readOnly value={webhookUrl} className="font-mono text-xs" />
                    <Button size="sm" variant="outline" onClick={() => copyWebhookUrl(integration)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Sync Actions */}
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">Sync Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleSync(integration, "menu_sync")}
                      disabled={syncing === integration.id}>
                      <ArrowUpDown className="mr-1 h-3 w-3" />Push Menu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSync(integration, "pull_orders")}
                      disabled={syncing === integration.id}>
                      <ArrowUpDown className="mr-1 h-3 w-3" />Pull Orders
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSync(integration, "sync_status")}
                      disabled={syncing === integration.id}>
                      <RefreshCw className="mr-1 h-3 w-3" />Sync Status
                    </Button>
                  </div>
                </div>

                {/* Connected Since */}
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Connected Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(integration.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                </div>
              </div>
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="destructive" size="sm" onClick={() => handleDisconnect(integration)}>
                  <Unlink className="mr-1 h-3 w-3" />Disconnect
                </Button>
                <Button variant="outline" onClick={() => setDetailDialog(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
