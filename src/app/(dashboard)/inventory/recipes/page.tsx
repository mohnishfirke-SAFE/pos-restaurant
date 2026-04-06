"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, UtensilsCrossed } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
}

interface RecipeRow {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  rows: RecipeRow[];
}

const mockIngredients: Ingredient[] = [
  { id: "ing-1", name: "Basmati Rice", unit: "kg", costPerUnit: 85 },
  { id: "ing-2", name: "Chicken Breast", unit: "kg", costPerUnit: 280 },
  { id: "ing-3", name: "Olive Oil", unit: "l", costPerUnit: 650 },
  { id: "ing-4", name: "Tomato Puree", unit: "l", costPerUnit: 120 },
  { id: "ing-5", name: "Paneer", unit: "kg", costPerUnit: 320 },
  { id: "ing-6", name: "Garam Masala", unit: "kg", costPerUnit: 450 },
  { id: "ing-7", name: "Onion", unit: "kg", costPerUnit: 40 },
  { id: "ing-8", name: "Butter", unit: "kg", costPerUnit: 520 },
];

const mockMenuItems = [
  { id: "menu-1", name: "Chicken Biryani" },
  { id: "menu-2", name: "Paneer Butter Masala" },
  { id: "menu-3", name: "Veg Fried Rice" },
  { id: "menu-4", name: "Butter Chicken" },
];

const initialRecipes: Recipe[] = [
  {
    id: "recipe-1",
    menuItemId: "menu-1",
    menuItemName: "Chicken Biryani",
    rows: [
      { id: "r1-1", ingredientId: "ing-1", quantity: 0.3, unit: "kg" },
      { id: "r1-2", ingredientId: "ing-2", quantity: 0.25, unit: "kg" },
      { id: "r1-3", ingredientId: "ing-3", quantity: 0.03, unit: "l" },
      { id: "r1-4", ingredientId: "ing-6", quantity: 0.01, unit: "kg" },
      { id: "r1-5", ingredientId: "ing-7", quantity: 0.15, unit: "kg" },
    ],
  },
  {
    id: "recipe-2",
    menuItemId: "menu-2",
    menuItemName: "Paneer Butter Masala",
    rows: [
      { id: "r2-1", ingredientId: "ing-5", quantity: 0.2, unit: "kg" },
      { id: "r2-2", ingredientId: "ing-4", quantity: 0.15, unit: "l" },
      { id: "r2-3", ingredientId: "ing-8", quantity: 0.05, unit: "kg" },
      { id: "r2-4", ingredientId: "ing-6", quantity: 0.005, unit: "kg" },
      { id: "r2-5", ingredientId: "ing-7", quantity: 0.1, unit: "kg" },
    ],
  },
  {
    id: "recipe-3",
    menuItemId: "menu-4",
    menuItemName: "Butter Chicken",
    rows: [
      { id: "r3-1", ingredientId: "ing-2", quantity: 0.25, unit: "kg" },
      { id: "r3-2", ingredientId: "ing-4", quantity: 0.2, unit: "l" },
      { id: "r3-3", ingredientId: "ing-8", quantity: 0.05, unit: "kg" },
      { id: "r3-4", ingredientId: "ing-6", quantity: 0.008, unit: "kg" },
      { id: "r3-5", ingredientId: "ing-7", quantity: 0.12, unit: "kg" },
    ],
  },
];

function getIngredientById(id: string) {
  return mockIngredients.find((i) => i.id === id);
}

function calculateRowCost(row: RecipeRow): number {
  const ingredient = getIngredientById(row.ingredientId);
  if (!ingredient) return 0;
  return row.quantity * ingredient.costPerUnit;
}

function calculateRecipeCost(rows: RecipeRow[]): number {
  return rows.reduce((sum, row) => sum + calculateRowCost(row), 0);
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [builderRows, setBuilderRows] = useState<RecipeRow[]>([]);

  function addBuilderRow() {
    setBuilderRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ingredientId: "",
        quantity: 0,
        unit: "kg",
      },
    ]);
  }

  function updateBuilderRow(id: string, field: keyof RecipeRow, value: string | number) {
    setBuilderRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === "ingredientId") {
          const ingredient = getIngredientById(value as string);
          return { ...row, ingredientId: value as string, unit: ingredient?.unit ?? row.unit };
        }
        return { ...row, [field]: value };
      })
    );
  }

  function removeBuilderRow(id: string) {
    setBuilderRows((prev) => prev.filter((row) => row.id !== id));
  }

  function saveRecipe() {
    if (!selectedMenuItem || builderRows.length === 0) return;
    const menuItem = mockMenuItems.find((m) => m.id === selectedMenuItem);
    if (!menuItem) return;

    const existingIndex = recipes.findIndex(
      (r) => r.menuItemId === selectedMenuItem
    );

    if (existingIndex >= 0) {
      setRecipes((prev) =>
        prev.map((r) =>
          r.menuItemId === selectedMenuItem
            ? { ...r, rows: builderRows }
            : r
        )
      );
    } else {
      setRecipes((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          menuItemId: selectedMenuItem,
          menuItemName: menuItem.name,
          rows: builderRows,
        },
      ]);
    }

    setSelectedMenuItem("");
    setBuilderRows([]);
  }

  function loadRecipeForEdit(recipe: Recipe) {
    setSelectedMenuItem(recipe.menuItemId);
    setBuilderRows([...recipe.rows]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            Link menu items to their ingredient recipes and view cost breakdowns
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Builder</CardTitle>
          <CardDescription>
            Select a menu item and add the ingredients with quantities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Menu Item</Label>
              <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a menu item" />
                </SelectTrigger>
                <SelectContent>
                  {mockMenuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedMenuItem && (
            <>
              <div className="space-y-3">
                {builderRows.map((row) => {
                  const ingredient = getIngredientById(row.ingredientId);
                  const rowCost = calculateRowCost(row);
                  return (
                    <div
                      key={row.id}
                      className="flex items-end gap-3 rounded-lg border p-3"
                    >
                      <div className="grid flex-1 gap-2">
                        <Label className="text-xs">Ingredient</Label>
                        <Select
                          value={row.ingredientId}
                          onValueChange={(v) =>
                            updateBuilderRow(row.id, "ingredientId", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select ingredient" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockIngredients.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid w-28 gap-2">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={row.quantity}
                          onChange={(e) =>
                            updateBuilderRow(
                              row.id,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="grid w-24 gap-2">
                        <Label className="text-xs">Unit</Label>
                        <Select
                          value={row.unit}
                          onValueChange={(v) =>
                            updateBuilderRow(row.id, "unit", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="l">l</SelectItem>
                            <SelectItem value="pcs">pcs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-28 pb-0.5 text-right text-sm font-medium">
                        {ingredient ? formatINR(rowCost) : "-"}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBuilderRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={addBuilderRow}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Ingredient Row
                </Button>
                <div className="text-right">
                  {builderRows.length > 0 && (
                    <div className="text-lg font-semibold">
                      Total Cost: {formatINR(calculateRecipeCost(builderRows))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={saveRecipe}
                  disabled={builderRows.length === 0}
                >
                  Save Recipe
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          {recipes.length > 0 ? (
            <div className="space-y-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">
                        {recipe.menuItemName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        Cost: {formatINR(calculateRecipeCost(recipe.rows))}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadRecipeForEdit(recipe)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead className="text-right">Line Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipe.rows.map((row) => {
                        const ingredient = getIngredientById(row.ingredientId);
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              {ingredient?.name ?? "Unknown"}
                            </TableCell>
                            <TableCell>{row.quantity}</TableCell>
                            <TableCell>{row.unit}</TableCell>
                            <TableCell>
                              {ingredient
                                ? formatINR(ingredient.costPerUnit)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatINR(calculateRowCost(row))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-right font-semibold"
                        >
                          Total
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatINR(calculateRecipeCost(recipe.rows))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No recipes saved yet. Use the builder above to create one.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
