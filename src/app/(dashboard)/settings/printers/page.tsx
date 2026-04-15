"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Printer, Plus } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import { useTenantSettings, useUpdateTenantSettings } from "@/hooks/use-settings";

export interface PrinterConfig {
  name: string;
  type: string;
  model: string;
  auto_print: boolean;
}

const emptyPrinter: PrinterConfig = {
  name: "",
  type: "usb",
  model: "",
  auto_print: false,
};

export default function PrinterSettingsPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;

  const { data: tenant, isLoading: tenantLoading } = useTenantSettings(tenantId);
  const updateTenant = useUpdateTenantSettings();

  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<PrinterConfig>(emptyPrinter);

  useEffect(() => {
    if (!tenant) return;
    const stored = (tenant.settings as Record<string, unknown>)?.printers as
      | PrinterConfig[]
      | undefined;
    setPrinters(stored ?? []);
  }, [tenant]);

  const isLoading = authLoading || tenantLoading;

  function savePrinters(updated: PrinterConfig[]) {
    if (!tenant) return;
    setPrinters(updated);
    updateTenant.mutate({
      id: tenant.id,
      settingsPatch: { printers: updated },
    });
  }

  function handleAddPrinter() {
    setEditingIndex(null);
    setFormData(emptyPrinter);
    setDialogOpen(true);
  }

  function handleConfigure(index: number) {
    setEditingIndex(index);
    setFormData({ ...printers[index] });
    setDialogOpen(true);
  }

  function handleSaveDialog() {
    if (!formData.name.trim() || !formData.model.trim()) return;
    if (editingIndex !== null) {
      const updated = [...printers];
      updated[editingIndex] = formData;
      savePrinters(updated);
    } else {
      savePrinters([...printers, formData]);
    }
    setDialogOpen(false);
  }

  function handleTestPrint(printer: PrinterConfig) {
    alert(`Test print sent to "${printer.name}" (${printer.model}). Check your printer.`);
  }

  function handleDelete(index: number) {
    const updated = printers.filter((_, i) => i !== index);
    savePrinters(updated);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Printers</h1>
            <p className="text-muted-foreground">Configure receipt and KOT printers</p>
          </div>
          <div className="h-9 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                  <div className="space-y-2">
                    <div className="h-5 w-36 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-9 w-full animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Printers</h1>
          <p className="text-muted-foreground">Configure receipt and KOT printers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddPrinter}>
              <Plus className="mr-2 h-4 w-4" />
              Add Printer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Configure Printer" : "Add Printer"}
              </DialogTitle>
              <DialogDescription>
                {editingIndex !== null
                  ? "Update printer settings below."
                  : "Enter details for the new printer."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Printer Name</Label>
                <Input
                  placeholder="e.g. Receipt Printer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Connection Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="network">Network (LAN)</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Model</Label>
                <Input
                  placeholder="e.g. Epson TM-T82"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto-print receipts</Label>
                <Switch
                  checked={formData.auto_print}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, auto_print: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveDialog}
                disabled={
                  updateTenant.isPending ||
                  !formData.name.trim() ||
                  !formData.model.trim()
                }
              >
                {updateTenant.isPending
                  ? "Saving..."
                  : editingIndex !== null
                  ? "Save Changes"
                  : "Add Printer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {printers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Printer className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No printers configured</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add a printer to start printing receipts and KOTs.
            </p>
            <Button onClick={handleAddPrinter}>
              <Plus className="mr-2 h-4 w-4" />
              Add Printer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {printers.map((p, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Printer className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription>{p.model}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="default">
                    {p.type === "usb"
                      ? "USB"
                      : p.type === "network"
                      ? "Network"
                      : "Bluetooth"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-print receipts</span>
                  <Switch
                    checked={p.auto_print}
                    onCheckedChange={(checked) => {
                      const updated = [...printers];
                      updated[index] = { ...updated[index], auto_print: checked };
                      savePrinters(updated);
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestPrint(p)}
                  >
                    Test Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigure(index)}
                  >
                    Configure
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(index)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {updateTenant.isError && (
        <p className="text-sm text-destructive">
          Failed to save printer settings. Please try again.
        </p>
      )}
    </div>
  );
}
