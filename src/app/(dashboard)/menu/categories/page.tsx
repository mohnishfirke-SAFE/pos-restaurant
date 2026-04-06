"use client";

import { useState } from "react";
import { useMenuCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-menu";
import { useTenantId } from "@/lib/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: categories, isLoading } = useMenuCategories();
  const tenantId = useTenantId();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  async function handleSubmit(formData: FormData) {
    if (!tenantId) return;

    const name = formData.get("name") as string;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (editingId) {
      await updateCategory.mutateAsync({
        id: editingId,
        name,
        slug,
        name_local: (formData.get("name_local") as string) || null,
        sort_order: parseInt((formData.get("sort_order") as string) || "0"),
      });
    } else {
      await createCategory.mutateAsync({
        tenant_id: tenantId,
        name,
        slug,
        name_local: (formData.get("name_local") as string) || null,
        sort_order: parseInt((formData.get("sort_order") as string) || "0"),
      });
    }

    setDialogOpen(false);
    setEditingId(null);
  }

  function handleEdit(category: NonNullable<typeof categories>[number]) {
    setEditingId(category.id);
    setDialogOpen(true);
  }

  const editingCategory = editingId
    ? categories?.find((c) => c.id === editingId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your menu into categories
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingId(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(new FormData(e.currentTarget));
              }}
            >
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Category" : "Add Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Update this category"
                    : "Create a new menu category"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingCategory?.name ?? ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name_local">Local Name (Hindi)</Label>
                  <Input
                    id="name_local"
                    name="name_local"
                    defaultValue={editingCategory?.name_local ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={editingCategory?.sort_order ?? 0}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    createCategory.isPending || updateCategory.isPending
                  }
                >
                  {(createCategory.isPending || updateCategory.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingId ? "Save Changes" : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Local Name</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>{category.name_local ?? "-"}</TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <Badge
                        variant={category.is_active ? "default" : "secondary"}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCategory.mutate(category.id)}
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
              <p>No categories yet. Create your first category.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
