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
} from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  currentStock: number;
  minLevel: number;
  unit: string;
  costPerUnit: number;
}

const mockIngredients: Ingredient[] = [
  {
    id: "1",
    name: "Basmati Rice",
    sku: "ING-001",
    barcode: "8901234567890",
    currentStock: 50,
    minLevel: 10,
    unit: "kg",
    costPerUnit: 85,
  },
  {
    id: "2",
    name: "Chicken Breast",
    sku: "ING-002",
    barcode: "8901234567891",
    currentStock: 5,
    minLevel: 8,
    unit: "kg",
    costPerUnit: 280,
  },
  {
    id: "3",
    name: "Olive Oil",
    sku: "ING-003",
    barcode: "8901234567892",
    currentStock: 12,
    minLevel: 5,
    unit: "l",
    costPerUnit: 650,
  },
  {
    id: "4",
    name: "Tomato Puree",
    sku: "ING-004",
    barcode: "8901234567893",
    currentStock: 0,
    minLevel: 3,
    unit: "l",
    costPerUnit: 120,
  },
  {
    id: "5",
    name: "Paneer",
    sku: "ING-005",
    barcode: "8901234567894",
    currentStock: 8,
    minLevel: 5,
    unit: "kg",
    costPerUnit: 320,
  },
  {
    id: "6",
    name: "Garam Masala",
    sku: "ING-006",
    barcode: "8901234567895",
    currentStock: 2,
    minLevel: 2,
    unit: "kg",
    costPerUnit: 450,
  },
];

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
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>(mockIngredients);

  const filteredIngredients = ingredients.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = ingredients.length;
  const lowStockCount = ingredients.filter(
    (i) => i.currentStock <= i.minLevel && i.currentStock > 0
  ).length + ingredients.filter((i) => i.currentStock === 0).length;
  const totalValue = ingredients.reduce(
    (sum, i) => sum + i.currentStock * i.costPerUnit,
    0
  );

  function handleAddIngredient(formData: FormData) {
    const newIngredient: Ingredient = {
      id: crypto.randomUUID(),
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      barcode: formData.get("barcode") as string,
      currentStock: 0,
      minLevel: parseFloat(formData.get("minLevel") as string),
      unit: formData.get("unit") as string,
      costPerUnit: parseFloat(formData.get("costPerUnit") as string),
    };
    setIngredients((prev) => [...prev, newIngredient]);
    setDialogOpen(false);
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
              </div>
              <DialogFooter>
                <Button type="submit">Add Ingredient</Button>
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
          {filteredIngredients.length > 0 ? (
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
                {filteredIngredients.map((item) => {
                  const status = getStockStatus(item.currentStock, item.minLevel);
                  const isLow = status === "Low" || status === "Out of Stock";
                  return (
                    <TableRow
                      key={item.id}
                      className={isLow ? "bg-red-50 dark:bg-red-950/20" : ""}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell>{item.currentStock}</TableCell>
                      <TableCell>{item.minLevel}</TableCell>
                      <TableCell>{item.unit}</TableCell>
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
