"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import { formatINR } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  Link2,
  Unlink,
  Search,
  Check,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  base_price: number;
  is_veg: boolean;
  is_available: boolean;
  menu_categories?: { name: string };
}

interface PlatformMapping {
  id: string;
  menu_item_id: string;
  platform: string;
  platform_item_id: string | null;
  platform_category_id: string | null;
  is_available: boolean;
  is_synced: boolean;
  last_synced_at: string | null;
  price_override: number | null;
}

const PLATFORMS = [
  { id: "zomato", name: "Zomato", color: "bg-red-600", logo: "Z" },
  { id: "swiggy", name: "Swiggy", color: "bg-orange-500", logo: "S" },
];

export default function PlatformMappingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [mappings, setMappings] = useState<PlatformMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [activePlatform, setActivePlatform] = useState("zomato");
  const [editDialog, setEditDialog] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState({
    platform_item_id: "",
    platform_category_id: "",
    price_override: "",
  });

  const tenantId = useTenantId();
  const { activeBranchId } = useBranchStore();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    const [itemsRes, mappingsRes] = await Promise.all([
      supabase
        .from("menu_items")
        .select("id, name, base_price, is_veg, is_available, menu_categories(name)")
        .order("name"),
      supabase
        .from("menu_platform_mapping")
        .select("*")
        .order("created_at"),
    ]);

    if (itemsRes.data) {
      // Supabase may return menu_categories as array from join; normalize to single object
      const normalized = (itemsRes.data as unknown[]).map((raw: unknown) => {
        const item = raw as Record<string, unknown>;
        const cats = item.menu_categories;
        return {
          ...item,
          menu_categories: Array.isArray(cats) ? cats[0] : cats,
        } as MenuItem;
      });
      setMenuItems(normalized);
    }
    if (mappingsRes.data) setMappings(mappingsRes.data as PlatformMapping[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getMappingForItem(itemId: string, platform: string): PlatformMapping | undefined {
    return mappings.find((m) => m.menu_item_id === itemId && m.platform === platform);
  }

  async function togglePlatformAvailability(itemId: string, platform: string, available: boolean) {
    setSaving(itemId);
    const existing = getMappingForItem(itemId, platform);

    if (existing) {
      await supabase
        .from("menu_platform_mapping")
        .update({ is_available: available, is_synced: false, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("menu_platform_mapping").insert({
        tenant_id: tenantId,
        menu_item_id: itemId,
        platform,
        is_available: available,
        is_synced: false,
      });
    }

    await loadData();
    setSaving(null);
  }

  async function saveMappingDetails(itemId: string, platform: string) {
    setSaving(itemId);
    const existing = getMappingForItem(itemId, platform);

    const data = {
      platform_item_id: editForm.platform_item_id || null,
      platform_category_id: editForm.platform_category_id || null,
      price_override: editForm.price_override ? parseFloat(editForm.price_override) : null,
      is_synced: false,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("menu_platform_mapping")
        .update(data)
        .eq("id", existing.id);
    } else {
      await supabase.from("menu_platform_mapping").insert({
        tenant_id: tenantId,
        menu_item_id: itemId,
        platform,
        is_available: true,
        ...data,
      });
    }

    await loadData();
    setSaving(null);
    setEditDialog(null);
  }

  async function syncAllToPlaftorm() {
    setSyncing(true);

    // Get active integration for this platform
    const { data: integration } = await supabase
      .from("delivery_integrations")
      .select("id")
      .eq("branch_id", activeBranchId)
      .eq("platform", activePlatform)
      .eq("is_active", true)
      .single();

    if (integration) {
      await fetch("/api/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integration_id: integration.id,
          action: "menu_sync",
        }),
      });

      // Mark all items as synced
      const platformMappings = mappings.filter(
        (m) => m.platform === activePlatform && m.is_available
      );
      for (const m of platformMappings) {
        await supabase
          .from("menu_platform_mapping")
          .update({ is_synced: true, last_synced_at: new Date().toISOString() })
          .eq("id", m.id);
      }
    }

    await loadData();
    setSyncing(false);
  }

  async function bulkMapAll() {
    setSaving("bulk");
    const unmapped = menuItems.filter(
      (item) => item.is_available && !getMappingForItem(item.id, activePlatform)
    );

    if (unmapped.length > 0) {
      const inserts = unmapped.map((item) => ({
        tenant_id: tenantId,
        menu_item_id: item.id,
        platform: activePlatform,
        is_available: true,
        is_synced: false,
      }));

      await supabase.from("menu_platform_mapping").insert(inserts);
      await loadData();
    }
    setSaving(null);
  }

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const mappedCount = filteredItems.filter(
    (item) => getMappingForItem(item.id, activePlatform)?.is_available
  ).length;
  const unsyncedCount = mappings.filter(
    (m) => m.platform === activePlatform && !m.is_synced && m.is_available
  ).length;

  const platformInfo = PLATFORMS.find((p) => p.id === activePlatform)!;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Menu Mapping</h1>
          <p className="text-muted-foreground">
            Map your POS menu items to Zomato & Swiggy catalogues
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={bulkMapAll} disabled={saving === "bulk"}>
            {saving === "bulk" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Map All Available
          </Button>
          <Button onClick={syncAllToPlaftorm} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpDown className="mr-2 h-4 w-4" />
            )}
            Sync to {platformInfo.name}
            {unsyncedCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px]">
                {unsyncedCount} pending
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs value={activePlatform} onValueChange={setActivePlatform}>
        <TabsList>
          {PLATFORMS.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="gap-2">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-black text-white ${p.color}`}
              >
                {p.logo}
              </span>
              {p.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {PLATFORMS.map((p) => (
          <TabsContent key={p.id} value={p.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-black text-white ${p.color}`}
                      >
                        {p.logo}
                      </span>
                      {p.name} Menu Mapping
                    </CardTitle>
                    <CardDescription>
                      {mappedCount} of {filteredItems.length} items mapped
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      className="w-64 pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>POS Price</TableHead>
                      <TableHead>{p.name} Price</TableHead>
                      <TableHead>{p.name} Item ID</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Synced</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const mapping = getMappingForItem(item.id, p.id);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={item.is_veg ? "default" : "destructive"}
                                className="h-5 w-5 items-center justify-center rounded-full p-0 text-[8px]"
                              >
                                {item.is_veg ? "V" : "N"}
                              </Badge>
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.menu_categories?.name || "-"}
                          </TableCell>
                          <TableCell>{formatINR(item.base_price)}</TableCell>
                          <TableCell>
                            {mapping?.price_override
                              ? formatINR(mapping.price_override)
                              : <span className="text-muted-foreground">Same</span>}
                          </TableCell>
                          <TableCell>
                            {mapping?.platform_item_id ? (
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {mapping.platform_item_id}
                              </code>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not mapped</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={mapping?.is_available ?? false}
                              disabled={saving === item.id}
                              onCheckedChange={(checked) =>
                                togglePlatformAvailability(item.id, p.id, checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {mapping?.is_synced ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : mapping?.is_available ? (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditForm({
                                  platform_item_id: mapping?.platform_item_id || "",
                                  platform_category_id: mapping?.platform_category_id || "",
                                  price_override: mapping?.price_override?.toString() || "",
                                });
                                setEditDialog(item);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Mapping Dialog */}
      {editDialog && (
        <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Map &quot;{editDialog.name}&quot; to {platformInfo.name}
              </DialogTitle>
              <DialogDescription>
                Link this POS item to its {platformInfo.name} catalogue entry
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{platformInfo.name} Item ID</Label>
                <Input
                  placeholder={`${platformInfo.name} catalogue item ID`}
                  value={editForm.platform_item_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, platform_item_id: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your {platformInfo.name} partner dashboard under Menu Management
                </p>
              </div>
              <div className="grid gap-2">
                <Label>{platformInfo.name} Category ID</Label>
                <Input
                  placeholder={`${platformInfo.name} category ID`}
                  value={editForm.platform_category_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, platform_category_id: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Price Override (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Default: ${formatINR(editDialog.base_price)}`}
                  value={editForm.price_override}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, price_override: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Set a different price for {platformInfo.name} (e.g., to cover commission).
                  Leave blank to use POS price.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMappingDetails(editDialog.id, activePlatform)}
                disabled={saving === editDialog.id}
              >
                {saving === editDialog.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Save Mapping
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
