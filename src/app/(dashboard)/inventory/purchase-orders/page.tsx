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
import { Plus, Trash2, Eye, FileText, Loader2 } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useSuppliers,
  useIngredientsForPO,
} from "@/hooks/use-purchase-orders";
import type { PurchaseOrderRow } from "@/hooks/use-purchase-orders";

type POStatus = "draft" | "sent" | "partial" | "received" | "cancelled";

interface POLineItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unitCost: number;
}

function getStatusBadge(status: POStatus) {
  const config: Record<POStatus, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-500 hover:bg-gray-500/80" },
    sent: { label: "Sent", className: "bg-blue-600 hover:bg-blue-600/80" },
    partial: { label: "Partial", className: "bg-yellow-600 hover:bg-yellow-600/80" },
    received: { label: "Received", className: "bg-green-600 hover:bg-green-600/80" },
    cancelled: { label: "Cancelled", className: "bg-red-600 hover:bg-red-600/80" },
  };
  const { label, className } = config[status];
  return (
    <Badge className={`${className} text-white`}>{label}</Badge>
  );
}

export default function PurchaseOrdersPage() {
  const { tenantUser } = useTenantUser();
  const { activeBranchId } = useBranchStore();
  const tenantId = tenantUser?.tenant_id ?? null;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? null;

  const { data: orders = [], isLoading } = usePurchaseOrders(tenantId, branchId);
  const createPO = useCreatePurchaseOrder();
  const { data: suppliers = [] } = useSuppliers(tenantId);
  const { data: ingredientsList = [] } = useIngredientsForPO(tenantId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrderRow | null>(null);

  const [newSupplier, setNewSupplier] = useState("");
  const [newExpectedDate, setNewExpectedDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newItems, setNewItems] = useState<POLineItem[]>([
    { id: crypto.randomUUID(), ingredientId: "", quantity: 0, unitCost: 0 },
  ]);

  function addLineItem() {
    setNewItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ingredientId: "", quantity: 0, unitCost: 0 },
    ]);
  }

  function updateLineItem(id: string, field: keyof POLineItem, value: string | number) {
    setNewItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function removeLineItem(id: string) {
    setNewItems((prev) => prev.filter((item) => item.id !== id));
  }

  function calculateTotal(items: POLineItem[]) {
    return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  }

  function getIngredientName(id: string) {
    return ingredientsList.find((i) => i.id === id)?.name ?? "Unknown";
  }

  function handleCreatePO() {
    if (!tenantId || !branchId || !newSupplier || newItems.length === 0) return;

    const validItems = newItems.filter((i) => i.ingredientId);
    const poNumber = `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, "0")}`;

    createPO.mutate(
      {
        tenant_id: tenantId,
        branch_id: branchId,
        supplier_id: newSupplier,
        po_number: poNumber,
        status: "draft",
        total_amount: calculateTotal(validItems),
        notes: newNotes || undefined,
        expected_date: newExpectedDate || undefined,
        created_by: tenantUser?.display_name ?? undefined,
        items: validItems.map((item) => ({
          ingredient_id: item.ingredientId,
          quantity_ordered: item.quantity,
          unit_cost: item.unitCost,
          total_cost: item.quantity * item.unitCost,
        })),
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      }
    );
  }

  function resetForm() {
    setNewSupplier("");
    setNewExpectedDate("");
    setNewNotes("");
    setNewItems([
      { id: crypto.randomUUID(), ingredientId: "", quantity: 0, unitCost: 0 },
    ]);
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
          <h1 className="text-2xl font-bold tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-muted-foreground">
            Create and manage purchase orders for ingredients
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New PO
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for your suppliers
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Supplier</Label>
                <Select value={newSupplier} onValueChange={setNewSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Expected Date</Label>
                <Input
                  type="date"
                  value={newExpectedDate}
                  onChange={(e) => setNewExpectedDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>

            <div className="space-y-3">
              <Label>Items</Label>
              {newItems.map((item) => (
                <div key={item.id} className="flex items-end gap-3 rounded-lg border p-3">
                  <div className="grid flex-1 gap-2">
                    <Label className="text-xs">Ingredient</Label>
                    <Select
                      value={item.ingredientId}
                      onValueChange={(v) =>
                        updateLineItem(item.id, "ingredientId", v)
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
                  <div className="grid w-24 gap-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateLineItem(
                          item.id,
                          "quantity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="grid w-28 gap-2">
                    <Label className="text-xs">Unit Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitCost || ""}
                      onChange={(e) =>
                        updateLineItem(
                          item.id,
                          "unitCost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-medium pb-0.5">
                    {formatINR(item.quantity * item.unitCost)}
                  </div>
                  {newItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="text-right text-lg font-semibold">
              Total: {formatINR(calculateTotal(newItems))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePO} disabled={createPO.isPending}>
              {createPO.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewOrder !== null}
        onOpenChange={(open) => { if (!open) setViewOrder(null); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewOrder?.po_number}</DialogTitle>
            <DialogDescription>
              Purchase order details
            </DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Supplier: </span>
                  <span className="font-medium">{viewOrder.suppliers?.name ?? "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  {getStatusBadge(viewOrder.status as POStatus)}
                </div>
                <div>
                  <span className="text-muted-foreground">Expected: </span>
                  <span className="font-medium">{viewOrder.expected_date ?? "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="font-medium">
                    {viewOrder.created_at
                      ? new Date(viewOrder.created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewOrder.purchase_order_items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.ingredients?.name ?? "Unknown"}
                      </TableCell>
                      <TableCell>{item.quantity_ordered}</TableCell>
                      <TableCell>{formatINR(item.unit_cost)}</TableCell>
                      <TableCell className="text-right">
                        {formatINR(item.total_cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatINR(viewOrder.total_amount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {order.po_number}
                      </div>
                    </TableCell>
                    <TableCell>{order.suppliers?.name ?? "-"}</TableCell>
                    <TableCell>{getStatusBadge(order.status as POStatus)}</TableCell>
                    <TableCell>{formatINR(order.total_amount)}</TableCell>
                    <TableCell>
                      {order.expected_date
                        ? new Date(order.expected_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewOrder(order)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No purchase orders yet. Click &quot;New PO&quot; to create one.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
