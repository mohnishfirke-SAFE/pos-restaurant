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
import { Plus, Trash2, UtensilsCrossed, Loader2 } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import {
  useRecipes,
  useSaveRecipe,
  useMenuItemsForSelect,
  useIngredientsForSelect,
} from "@/hooks/use-recipes";
import type { RecipeRow } from "@/hooks/use-recipes";

interface BuilderRow {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
}

export default function RecipesPage() {
  const { tenantUser } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;

  const { data: recipes = [], isLoading } = useRecipes(tenantId);
  const saveRecipe = useSaveRecipe();
  const { data: menuItems = [] } = useMenuItemsForSelect(tenantId);
  const { data: ingredientsList = [] } = useIngredientsForSelect(tenantId);

  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [builderRows, setBuilderRows] = useState<BuilderRow[]>([]);

  function getIngredientById(id: string) {
    return ingredientsList.find((i) => i.id === id);
  }

  function calculateRowCost(row: BuilderRow): number {
    const ingredient = getIngredientById(row.ingredientId);
    if (!ingredient) return 0;
    return row.quantity * ingredient.cost_per_unit;
  }

  function calculateRecipeCostFromRows(rows: BuilderRow[]): number {
    return rows.reduce((sum, row) => sum + calculateRowCost(row), 0);
  }

  function calculateRecipeCostFromDb(rows: RecipeRow[]): number {
    return rows.reduce((sum, row) => {
      const cost = row.ingredients?.cost_per_unit ?? 0;
      return sum + row.quantity_needed * cost;
    }, 0);
  }

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

  function updateBuilderRow(id: string, field: keyof BuilderRow, value: string | number) {
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

  function saveRecipeHandler() {
    if (!tenantId || !selectedMenuItem || builderRows.length === 0) return;

    saveRecipe.mutate(
      {
        tenant_id: tenantId,
        menu_item_id: selectedMenuItem,
        rows: builderRows.map((r) => ({
          ingredient_id: r.ingredientId,
          quantity_needed: r.quantity,
          unit: r.unit,
        })),
      },
      {
        onSuccess: () => {
          setSelectedMenuItem("");
          setBuilderRows([]);
        },
      }
    );
  }

  function loadRecipeForEdit(recipe: { menu_item_id: string; rows: RecipeRow[] }) {
    setSelectedMenuItem(recipe.menu_item_id);
    setBuilderRows(
      recipe.rows.map((r) => ({
        id: crypto.randomUUID(),
        ingredientId: r.ingredient_id,
        quantity: r.quantity_needed,
        unit: r.unit,
      }))
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
                  {menuItems.map((item) => (
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
                            {ingredientsList.map((ing) => (
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
                      Total Cost: {formatINR(calculateRecipeCostFromRows(builderRows))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={saveRecipeHandler}
                  disabled={builderRows.length === 0 || saveRecipe.isPending}
                >
                  {saveRecipe.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
                  key={recipe.menu_item_id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">
                        {recipe.menu_item_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        Cost: {formatINR(calculateRecipeCostFromDb(recipe.rows))}
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
                      {recipe.rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">
                            {row.ingredients?.name ?? "Unknown"}
                          </TableCell>
                          <TableCell>{row.quantity_needed}</TableCell>
                          <TableCell>{row.unit}</TableCell>
                          <TableCell>
                            {row.ingredients
                              ? formatINR(row.ingredients.cost_per_unit)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatINR(
                              row.quantity_needed *
                                (row.ingredients?.cost_per_unit ?? 0)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-right font-semibold"
                        >
                          Total
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatINR(calculateRecipeCostFromDb(recipe.rows))}
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
