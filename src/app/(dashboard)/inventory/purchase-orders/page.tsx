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
import { Plus, Trash2, Eye, FileText } from "lucide-react";

type POStatus = "draft" | "sent" | "partial" | "received" | "cancelled";

interface POLineItem {
  id: string;
  ingredientName: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: POStatus;
  items: POLineItem[];
  total: number;
  expectedDate: string;
  createdAt: string;
}

const mockIngredients = [
  "Basmati Rice",
  "Chicken Breast",
  "Olive Oil",
  "Tomato Puree",
  "Paneer",
  "Garam Masala",
  "Onion",
  "Butter",
];

const mockSuppliers = [
  "Agro Supplies Ltd",
  "Fresh Meats Co",
  "Premium Imports",
  "Dairy Fresh",
  "Spice World",
];

const initialOrders: PurchaseOrder[] = [
  {
    id: "po-1",
    poNumber: "PO-2026-001",
    supplier: "Agro Supplies Ltd",
    status: "received",
    items: [
      { id: "i1", ingredientName: "Basmati Rice", quantity: 50, unitCost: 82 },
      { id: "i2", ingredientName: "Onion", quantity: 30, unitCost: 38 },
    ],
    total: 5240,
    expectedDate: "2026-03-28",
    createdAt: "2026-03-25",
  },
  {
    id: "po-2",
    poNumber: "PO-2026-002",
    supplier: "Fresh Meats Co",
    status: "sent",
    items: [
      { id: "i3", ingredientName: "Chicken Breast", quantity: 25, unitCost: 275 },
    ],
    total: 6875,
    expectedDate: "2026-04-08",
    createdAt: "2026-04-04",
  },
  {
    id: "po-3",
    poNumber: "PO-2026-003",
    supplier: "Premium Imports",
    status: "partial",
    items: [
      { id: "i4", ingredientName: "Olive Oil", quantity: 10, unitCost: 640 },
      { id: "i5", ingredientName: "Butter", quantity: 5, unitCost: 510 },
    ],
    total: 8950,
    expectedDate: "2026-04-10",
    createdAt: "2026-04-02",
  },
  {
    id: "po-4",
    poNumber: "PO-2026-004",
    supplier: "Dairy Fresh",
    status: "draft",
    items: [
      { id: "i6", ingredientName: "Paneer", quantity: 15, unitCost: 310 },
    ],
    total: 4650,
    expectedDate: "2026-04-12",
    createdAt: "2026-04-05",
  },
  {
    id: "po-5",
    poNumber: "PO-2026-005",
    supplier: "Spice World",
    status: "cancelled",
    items: [
      { id: "i7", ingredientName: "Garam Masala", quantity: 5, unitCost: 440 },
    ],
    total: 2200,
    expectedDate: "2026-04-01",
    createdAt: "2026-03-28",
  },
];

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
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);

  const [newSupplier, setNewSupplier] = useState("");
  const [newExpectedDate, setNewExpectedDate] = useState("");
  const [newItems, setNewItems] = useState<POLineItem[]>([
    { id: crypto.randomUUID(), ingredientName: "", quantity: 0, unitCost: 0 },
  ]);

  function addLineItem() {
    setNewItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ingredientName: "", quantity: 0, unitCost: 0 },
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

  function handleCreatePO() {
    if (!newSupplier || newItems.length === 0) return;

    const poNumber = `PO-2026-${String(orders.length + 1).padStart(3, "0")}`;
    const newOrder: PurchaseOrder = {
      id: crypto.randomUUID(),
      poNumber,
      supplier: newSupplier,
      status: "draft",
      items: newItems.filter((i) => i.ingredientName),
      total: calculateTotal(newItems),
      expectedDate: newExpectedDate,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setOrders((prev) => [newOrder, ...prev]);
    setDialogOpen(false);
    resetForm();
  }

  function resetForm() {
    setNewSupplier("");
    setNewExpectedDate("");
    setNewItems([
      { id: crypto.randomUUID(), ingredientName: "", quantity: 0, unitCost: 0 },
    ]);
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
                    {mockSuppliers.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
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

            <div className="space-y-3">
              <Label>Items</Label>
              {newItems.map((item) => (
                <div key={item.id} className="flex items-end gap-3 rounded-lg border p-3">
                  <div className="grid flex-1 gap-2">
                    <Label className="text-xs">Ingredient</Label>
                    <Select
                      value={item.ingredientName}
                      onValueChange={(v) =>
                        updateLineItem(item.id, "ingredientName", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockIngredients.map((ing) => (
                          <SelectItem key={ing} value={ing}>
                            {ing}
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
            <Button onClick={handleCreatePO}>Create Purchase Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewOrder !== null}
        onOpenChange={(open) => { if (!open) setViewOrder(null); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewOrder?.poNumber}</DialogTitle>
            <DialogDescription>
              Purchase order details
            </DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Supplier: </span>
                  <span className="font-medium">{viewOrder.supplier}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  {getStatusBadge(viewOrder.status)}
                </div>
                <div>
                  <span className="text-muted-foreground">Expected: </span>
                  <span className="font-medium">{viewOrder.expectedDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="font-medium">{viewOrder.createdAt}</span>
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
                  {viewOrder.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.ingredientName}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatINR(item.unitCost)}</TableCell>
                      <TableCell className="text-right">
                        {formatINR(item.quantity * item.unitCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatINR(viewOrder.total)}
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
                        {order.poNumber}
                      </div>
                    </TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatINR(order.total)}</TableCell>
                    <TableCell>{order.expectedDate}</TableCell>
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
