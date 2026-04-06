"use client";

import { useState } from "react";
import { useMenuItems, useMenuCategories, useCreateMenuItem, useDeleteMenuItem, useToggleMenuItemAvailability } from "@/hooks/use-menu";
import { useTenantId } from "@/lib/auth/hooks";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";

export default function MenuItemsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: items, isLoading } = useMenuItems(
    categoryFilter !== "all" ? categoryFilter : undefined
  );
  const { data: categories } = useMenuCategories();
  const tenantId = useTenantId();

  const createItem = useCreateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreateItem(formData: FormData) {
    if (!tenantId || !formData.get("category_id")) return;

    await createItem.mutateAsync({
      tenant_id: tenantId,
      category_id: formData.get("category_id") as string,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      base_price: parseFloat(formData.get("base_price") as string),
      gst_rate: parseFloat((formData.get("gst_rate") as string) || "5"),
      is_veg: formData.get("is_veg") === "on",
      preparation_time: parseInt((formData.get("preparation_time") as string) || "15"),
    });

    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Items</h1>
          <p className="text-muted-foreground">
            Manage your restaurant&apos;s menu
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateItem(new FormData(e.currentTarget));
              }}
            >
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
                <DialogDescription>
                  Create a new item for your menu
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select name="category_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="base_price">Price (INR)</Label>
                    <Input
                      id="base_price"
                      name="base_price"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gst_rate">GST Rate (%)</Label>
                    <Select name="gst_rate" defaultValue="5">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="preparation_time">Prep Time (min)</Label>
                    <Input
                      id="preparation_time"
                      name="preparation_time"
                      type="number"
                      defaultValue="15"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch id="is_veg" name="is_veg" defaultChecked />
                    <Label htmlFor="is_veg">Vegetarian</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createItem.isPending}>
                  {createItem.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Items</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="w-64 pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.menu_categories?.name ?? "-"}
                    </TableCell>
                    <TableCell>{formatINR(item.base_price)}</TableCell>
                    <TableCell>{item.gst_rate}%</TableCell>
                    <TableCell>
                      <Badge variant={item.is_veg ? "default" : "destructive"}>
                        {item.is_veg ? "Veg" : "Non-Veg"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={(checked) =>
                          toggleAvailability.mutate({
                            id: item.id,
                            is_available: checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No menu items yet. Click &quot;Add Item&quot; to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
