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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import {
  useStockOverview,
  useCreateIngredient,
} from "@/hooks/use-inventory";

function getStockStatus(current: number, min: number) {
  if (current === 0) return "Out of Stock";
  if (current <= min) return "Low";
  return "In Stock";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "In Stock":
      return <Badge className="bg-green-600 hover:bg-green-600/80">In Stock</Badge>;
    case "Low":
      return <Badge className="bg-yellow-600 hover:bg-yellow-600/80">Low</Badge>;
    case "Out of Stock":
      return <Badge variant="destructive">Out of Stock</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function InventoryOverviewPage() {
  const { tenantUser } = useTenantUser();
  const { activeBranchId } = useBranchStore();
  const tenantId = tenantUser?.tenant_id ?? null;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? null;

  const { data: stockData = [], isLoading } = useStockOverview(tenantId, branchId);
  const createIngredient = useCreateIngredient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredStock = stockData.filter((item) => {
    const name = item.ingredients?.name ?? "";
    const sku = item.ingredients?.sku ?? "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      sku.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalItems = stockData.length;
  const lowStockCount = stockData.filter(
    (i) => i.current_stock <= i.min_stock_level
  ).length;
  const totalValue = stockData.reduce(
    (sum, i) => sum + i.current_stock * (i.ingredients?.cost_per_unit ?? 0),
    0
  );

  function handleAddIngredient(formData: FormData) {
    if (!tenantId || !branchId) return;
    createIngredient.mutate(
      {
        tenant_id: tenantId,
        branch_id: branchId,
        name: formData.get("name") as string,
        unit: formData.get("unit") as string,
        sku: formData.get("sku") as string,
        barcode: (formData.get("barcode") as string) || undefined,
        cost_per_unit: parseFloat(formData.get("costPerUnit") as string),
        min_stock_level: parseFloat(formData.get("minLevel") as string),
        max_stock_level: parseFloat(formData.get("maxLevel") as string) || 0,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      }
    );
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
          <h1 className="text-2xl font-bold tracking-tight">Inventory Overview</h1>
          <p className="text-muted-foreground">
            Monitor stock levels and manage ingredients
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddIngredient(new FormData(e.currentTarget));
              }}
            >
              <DialogHeader>
                <DialogTitle>Add Ingredient</DialogTitle>
                <DialogDescription>
                  Add a new ingredient to your inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Ingredient Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select name="unit" required>
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
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" name="sku" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" name="barcode" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="costPerUnit">Cost per Unit (INR)</Label>
                    <Input
                      id="costPerUnit"
                      name="costPerUnit"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minLevel">Min Stock Level</Label>
                    <Input
                      id="minLevel"
                      name="minLevel"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxLevel">Max Stock Level</Label>
                  <Input
                    id="maxLevel"
                    name="maxLevel"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createIngredient.isPending}>
                  {createIngredient.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Ingredient
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              ingredients tracked
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              items need restocking
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              current inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Stock Levels</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                className="w-72 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStock.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((item) => {
                  const status = getStockStatus(item.current_stock, item.min_stock_level);
                  const isLow = status === "Low" || status === "Out of Stock";
                  return (
                    <TableRow
                      key={item.id}
                      className={isLow ? "bg-red-50 dark:bg-red-950/20" : ""}
                    >
                      <TableCell className="font-medium">
                        {item.ingredients?.name ?? "Unknown"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.ingredients?.sku ?? "-"}
                      </TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>{item.min_stock_level}</TableCell>
                      <TableCell>{item.ingredients?.unit ?? "-"}</TableCell>
                      <TableCell>{getStatusBadge(status)}</TableCell>
                    </TableRow>
                  );
                })}
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
