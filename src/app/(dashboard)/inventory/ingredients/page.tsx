"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from "@/hooks/use-inventory";

export default function IngredientsPage() {
  const { tenantUser } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;
  const branchId = tenantUser?.branch_id ?? null;

  const { data: ingredients = [], isLoading } = useIngredients(tenantId);
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<{
    id: string;
    name: string;
    sku: string;
    barcode: string;
    unit: string;
    cost_per_unit: number;
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredIngredients = ingredients.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave(formData: FormData) {
    if (!tenantId) return;

    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const barcode = formData.get("barcode") as string;
    const unit = formData.get("unit") as string;
    const cost_per_unit = parseFloat(formData.get("costPerUnit") as string);

    if (editingIngredient) {
      updateIngredient.mutate(
        {
          id: editingIngredient.id,
          tenant_id: tenantId,
          name,
          sku,
          barcode,
          unit,
          cost_per_unit,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingIngredient(null);
          },
        }
      );
    } else {
      if (!branchId) return;
      createIngredient.mutate(
        {
          tenant_id: tenantId,
          branch_id: branchId,
          name,
          sku,
          barcode: barcode || undefined,
          unit,
          cost_per_unit,
          min_stock_level: parseFloat(formData.get("minLevel") as string),
          max_stock_level: parseFloat(formData.get("maxLevel") as string) || 0,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingIngredient(null);
          },
        }
      );
    }
  }

  function handleDelete(id: string) {
    if (!tenantId) return;
    deleteIngredient.mutate(
      { id, tenant_id: tenantId },
      {
        onSuccess: () => {
          setDeleteConfirmId(null);
        },
      }
    );
  }

  function openEditDialog(item: typeof ingredients[number]) {
    setEditingIngredient({
      id: item.id,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode ?? "",
      unit: item.unit,
      cost_per_unit: item.cost_per_unit,
    });
    setDialogOpen(true);
  }

  function openAddDialog() {
    setEditingIngredient(null);
    setDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ingredients</h1>
          <p className="text-muted-foreground">
            Manage your ingredient inventory
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ingredient
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingIngredient(null); }}>
        <DialogContent className="max-w-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(new FormData(e.currentTarget));
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {editingIngredient ? "Edit Ingredient" : "Add Ingredient"}
              </DialogTitle>
              <DialogDescription>
                {editingIngredient
                  ? "Update ingredient details"
                  : "Add a new ingredient to inventory"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingIngredient?.name ?? ""}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    defaultValue={editingIngredient?.sku ?? ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    name="barcode"
                    defaultValue={editingIngredient?.barcode ?? ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    name="unit"
                    defaultValue={editingIngredient?.unit ?? ""}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="g">Gram (g)</SelectItem>
                      <SelectItem value="ml">Millilitre (ml)</SelectItem>
                      <SelectItem value="l">Litre (l)</SelectItem>
                      <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="costPerUnit">Cost/Unit (INR)</Label>
                  <Input
                    id="costPerUnit"
                    name="costPerUnit"
                    type="number"
                    step="0.01"
                    defaultValue={editingIngredient?.cost_per_unit ?? ""}
                    required
                  />
                </div>
              </div>
              {!editingIngredient && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minLevel">Min Level</Label>
                    <Input
                      id="minLevel"
                      name="minLevel"
                      type="number"
                      step="0.01"
                      defaultValue={0}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxLevel">Max Level</Label>
                    <Input
                      id="maxLevel"
                      name="maxLevel"
                      type="number"
                      step="0.01"
                      defaultValue={0}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createIngredient.isPending || updateIngredient.isPending}
              >
                {(createIngredient.isPending || updateIngredient.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingIngredient ? "Save Changes" : "Add Ingredient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ingredient? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteIngredient.isPending}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {deleteIngredient.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Ingredients</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                className="w-80 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIngredients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.barcode || "-"}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatINR(item.cost_per_unit)}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No ingredients found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
