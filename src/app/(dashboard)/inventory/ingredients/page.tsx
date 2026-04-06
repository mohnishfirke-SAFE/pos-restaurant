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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  isActive: boolean;
  lastRestocked: string;
  createdAt: string;
}

const initialIngredients: Ingredient[] = [
  {
    id: "1",
    name: "Basmati Rice",
    sku: "ING-001",
    barcode: "8901234567890",
    category: "Grains",
    currentStock: 50,
    minLevel: 10,
    maxLevel: 100,
    unit: "kg",
    costPerUnit: 85,
    supplier: "Agro Supplies Ltd",
    isActive: true,
    lastRestocked: "2026-04-01",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "Chicken Breast",
    sku: "ING-002",
    barcode: "8901234567891",
    category: "Meat",
    currentStock: 5,
    minLevel: 8,
    maxLevel: 40,
    unit: "kg",
    costPerUnit: 280,
    supplier: "Fresh Meats Co",
    isActive: true,
    lastRestocked: "2026-04-03",
    createdAt: "2026-01-15",
  },
  {
    id: "3",
    name: "Olive Oil",
    sku: "ING-003",
    barcode: "8901234567892",
    category: "Oils",
    currentStock: 12,
    minLevel: 5,
    maxLevel: 30,
    unit: "l",
    costPerUnit: 650,
    supplier: "Premium Imports",
    isActive: true,
    lastRestocked: "2026-03-28",
    createdAt: "2026-01-20",
  },
  {
    id: "4",
    name: "Tomato Puree",
    sku: "ING-004",
    barcode: "8901234567893",
    category: "Sauces",
    currentStock: 0,
    minLevel: 3,
    maxLevel: 20,
    unit: "l",
    costPerUnit: 120,
    supplier: "Agro Supplies Ltd",
    isActive: true,
    lastRestocked: "2026-03-15",
    createdAt: "2026-01-20",
  },
  {
    id: "5",
    name: "Paneer",
    sku: "ING-005",
    barcode: "8901234567894",
    category: "Dairy",
    currentStock: 8,
    minLevel: 5,
    maxLevel: 25,
    unit: "kg",
    costPerUnit: 320,
    supplier: "Dairy Fresh",
    isActive: true,
    lastRestocked: "2026-04-02",
    createdAt: "2026-02-01",
  },
  {
    id: "6",
    name: "Garam Masala",
    sku: "ING-006",
    barcode: "8901234567895",
    category: "Spices",
    currentStock: 2,
    minLevel: 2,
    maxLevel: 10,
    unit: "kg",
    costPerUnit: 450,
    supplier: "Spice World",
    isActive: false,
    lastRestocked: "2026-03-20",
    createdAt: "2026-02-10",
  },
];

export default function IngredientsPage() {
  const [search, setSearch] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredIngredients = ingredients.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave(formData: FormData) {
    const data = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      barcode: formData.get("barcode") as string,
      category: formData.get("category") as string,
      unit: formData.get("unit") as string,
      costPerUnit: parseFloat(formData.get("costPerUnit") as string),
      minLevel: parseFloat(formData.get("minLevel") as string),
      maxLevel: parseFloat(formData.get("maxLevel") as string),
      supplier: formData.get("supplier") as string,
    };

    if (editingIngredient) {
      setIngredients((prev) =>
        prev.map((i) =>
          i.id === editingIngredient.id ? { ...i, ...data } : i
        )
      );
    } else {
      const newIngredient: Ingredient = {
        id: crypto.randomUUID(),
        ...data,
        currentStock: 0,
        isActive: true,
        lastRestocked: "-",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setIngredients((prev) => [...prev, newIngredient]);
    }

    setDialogOpen(false);
    setEditingIngredient(null);
  }

  function handleDelete(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setDeleteConfirmId(null);
  }

  function openEditDialog(ingredient: Ingredient) {
    setEditingIngredient(ingredient);
    setDialogOpen(true);
  }

  function openAddDialog() {
    setEditingIngredient(null);
    setDialogOpen(true);
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
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    defaultValue={editingIngredient?.category ?? ""}
                    required
                  />
                </div>
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
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="costPerUnit">Cost/Unit (INR)</Label>
                  <Input
                    id="costPerUnit"
                    name="costPerUnit"
                    type="number"
                    step="0.01"
                    defaultValue={editingIngredient?.costPerUnit ?? ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minLevel">Min Level</Label>
                  <Input
                    id="minLevel"
                    name="minLevel"
                    type="number"
                    step="0.01"
                    defaultValue={editingIngredient?.minLevel ?? ""}
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
                    defaultValue={editingIngredient?.maxLevel ?? ""}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  defaultValue={editingIngredient?.supplier ?? ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
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
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
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
                placeholder="Search by name, SKU, or category..."
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
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min / Max</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Restocked</TableHead>
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
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.currentStock}</TableCell>
                    <TableCell>
                      {item.minLevel} / {item.maxLevel}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatINR(item.costPerUnit)}</TableCell>
                    <TableCell>{item.supplier || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.lastRestocked}</TableCell>
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
