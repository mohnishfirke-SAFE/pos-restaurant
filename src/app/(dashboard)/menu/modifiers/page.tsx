"use client";

import { useState, useEffect } from "react";
import { useTenantUser } from "@/lib/auth/hooks";
import {
  useTenantSettings,
  useUpdateTenantSettings,
} from "@/hooks/use-settings";
import { formatINR } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Pencil,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModifierOption {
  id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
  options: ModifierOption[];
}

interface ModifiersConfig {
  groups: ModifierGroup[];
}

const defaultConfig: ModifiersConfig = { groups: [] };

function uid() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ModifiersPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;

  const { data: tenant, isLoading: tenantLoading } =
    useTenantSettings(tenantId);
  const updateTenant = useUpdateTenantSettings();

  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);

  // New group form state
  const [gName, setGName] = useState("");
  const [gRequired, setGRequired] = useState(false);
  const [gMinSelect, setGMinSelect] = useState(0);
  const [gMaxSelect, setGMaxSelect] = useState(1);
  const [gOptions, setGOptions] = useState<ModifierOption[]>([]);

  const isLoading = authLoading || tenantLoading;

  // Populate from tenant settings
  useEffect(() => {
    if (!tenant) return;
    const config = (tenant.settings as Record<string, unknown>)
      ?.modifiers as ModifiersConfig | undefined;
    setGroups(config?.groups ?? defaultConfig.groups);
  }, [tenant]);

  function resetForm() {
    setGName("");
    setGRequired(false);
    setGMinSelect(0);
    setGMaxSelect(1);
    setGOptions([]);
    setEditingGroup(null);
  }

  function openNew() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(group: ModifierGroup) {
    setEditingGroup(group);
    setGName(group.name);
    setGRequired(group.required);
    setGMinSelect(group.min_select);
    setGMaxSelect(group.max_select);
    setGOptions([...group.options]);
    setDialogOpen(true);
  }

  function addOption() {
    setGOptions((prev) => [
      ...prev,
      { id: uid(), name: "", price_adjustment: 0, is_default: false },
    ]);
  }

  function updateOption(
    idx: number,
    patch: Partial<ModifierOption>
  ) {
    setGOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, ...patch } : o))
    );
  }

  function removeOption(idx: number) {
    setGOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSaveGroup() {
    if (!tenant || !gName.trim() || gOptions.length === 0) return;

    const group: ModifierGroup = {
      id: editingGroup?.id ?? uid(),
      name: gName.trim(),
      required: gRequired,
      min_select: gMinSelect,
      max_select: gMaxSelect,
      sort_order: editingGroup?.sort_order ?? groups.length,
      options: gOptions.filter((o) => o.name.trim()),
    };

    const newGroups = editingGroup
      ? groups.map((g) => (g.id === editingGroup.id ? group : g))
      : [...groups, group];

    saveGroups(newGroups);
    setDialogOpen(false);
    resetForm();
  }

  function handleDeleteGroup(id: string) {
    const newGroups = groups.filter((g) => g.id !== id);
    saveGroups(newGroups);
  }

  function handleToggleGroup(id: string, required: boolean) {
    const newGroups = groups.map((g) =>
      g.id === id ? { ...g, required } : g
    );
    saveGroups(newGroups);
  }

  function saveGroups(newGroups: ModifierGroup[]) {
    setGroups(newGroups);
    updateTenant.mutate({
      id: tenant!.id,
      settingsPatch: {
        modifiers: { groups: newGroups },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Modifier Groups
          </h1>
          <p className="text-muted-foreground">
            Configure item customization options (size, spice level, add-ons)
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Modifier Group" : "New Modifier Group"}
              </DialogTitle>
              <DialogDescription>
                {editingGroup
                  ? "Update the modifier group and its options"
                  : "Create a group of options that can be applied to menu items"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Group name */}
              <div className="grid gap-2">
                <Label>Group Name</Label>
                <Input
                  placeholder="e.g. Size, Spice Level, Add-ons"
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                />
              </div>

              {/* Required + selection limits */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={gRequired}
                    onCheckedChange={setGRequired}
                  />
                  <Label>Required</Label>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    className="w-16"
                    min={0}
                    value={gMinSelect}
                    onChange={(e) =>
                      setGMinSelect(parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    className="w-16"
                    min={1}
                    value={gMaxSelect}
                    onChange={(e) =>
                      setGMaxSelect(parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Option
                  </Button>
                </div>

                {gOptions.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No options yet. Click &quot;Add Option&quot; to begin.
                  </p>
                )}

                {gOptions.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2 rounded-md border p-2"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Option name"
                      className="flex-1"
                      value={opt.name}
                      onChange={(e) =>
                        updateOption(idx, { name: e.target.value })
                      }
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">+₹</span>
                      <Input
                        type="number"
                        className="w-20"
                        min={0}
                        value={opt.price_adjustment}
                        onChange={(e) =>
                          updateOption(idx, {
                            price_adjustment: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <Switch
                      checked={opt.is_default}
                      onCheckedChange={(checked) => {
                        // If setting as default, clear other defaults
                        const updated = gOptions.map((o, i) => ({
                          ...o,
                          is_default: i === idx ? checked : false,
                        }));
                        setGOptions(updated);
                      }}
                    />
                    <Label className="text-xs">Default</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeOption(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSaveGroup}
                disabled={
                  updateTenant.isPending ||
                  !gName.trim() ||
                  gOptions.filter((o) => o.name.trim()).length === 0
                }
              >
                {updateTenant.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingGroup ? "Update Group" : "Create Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No modifier groups yet. Click &quot;Add Group&quot; to create one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {group.required && (
                      <Badge variant="default">Required</Badge>
                    )}
                    <Badge variant="outline">
                      Select {group.min_select}–{group.max_select}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={group.required}
                      onCheckedChange={(checked) =>
                        handleToggleGroup(group.id, checked)
                      }
                    />
                    <Label className="text-xs text-muted-foreground">
                      Required
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-1.5"
                    >
                      <span className="text-sm font-medium">{opt.name}</span>
                      {opt.price_adjustment > 0 && (
                        <Badge variant="secondary">
                          +{formatINR(opt.price_adjustment)}
                        </Badge>
                      )}
                      {opt.is_default && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
