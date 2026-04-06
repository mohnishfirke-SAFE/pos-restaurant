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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  CalendarDays,
  ShoppingBag,
  Utensils,
  Truck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrderStatus =
  | "draft"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

type OrderType = "dine-in" | "takeaway" | "delivery";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  table: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  customerName?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-1001",
    type: "dine-in",
    table: "T-4",
    items: [
      { name: "Butter Chicken", quantity: 2, price: 350 },
      { name: "Garlic Naan", quantity: 4, price: 60 },
      { name: "Mango Lassi", quantity: 2, price: 120 },
    ],
    total: 1180,
    status: "preparing",
    createdAt: "2026-04-06T12:30:00",
    customerName: "Rahul Sharma",
  },
  {
    id: "2",
    orderNumber: "ORD-1002",
    type: "takeaway",
    table: null,
    items: [
      { name: "Paneer Tikka", quantity: 1, price: 280 },
      { name: "Dal Makhani", quantity: 1, price: 220 },
    ],
    total: 500,
    status: "ready",
    createdAt: "2026-04-06T12:45:00",
    customerName: "Priya Patel",
  },
  {
    id: "3",
    orderNumber: "ORD-1003",
    type: "delivery",
    table: null,
    items: [
      { name: "Chicken Biryani", quantity: 1, price: 320 },
      { name: "Raita", quantity: 1, price: 60 },
      { name: "Gulab Jamun", quantity: 2, price: 80 },
    ],
    total: 540,
    status: "confirmed",
    createdAt: "2026-04-06T13:00:00",
    customerName: "Amit Verma",
  },
  {
    id: "4",
    orderNumber: "ORD-1004",
    type: "dine-in",
    table: "T-7",
    items: [
      { name: "Tandoori Platter", quantity: 1, price: 650 },
      { name: "Butter Naan", quantity: 2, price: 50 },
      { name: "Sweet Lassi", quantity: 1, price: 100 },
    ],
    total: 850,
    status: "completed",
    createdAt: "2026-04-06T11:15:00",
  },
  {
    id: "5",
    orderNumber: "ORD-1005",
    type: "dine-in",
    table: "T-2",
    items: [
      { name: "Masala Dosa", quantity: 2, price: 150 },
      { name: "Filter Coffee", quantity: 2, price: 80 },
    ],
    total: 460,
    status: "cancelled",
    createdAt: "2026-04-06T10:30:00",
    customerName: "Sneha Reddy",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> =
  {
    draft: {
      label: "Draft",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    preparing: {
      label: "Preparing",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    ready: {
      label: "Ready",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    served: {
      label: "Served",
      className: "bg-purple-100 text-purple-700 border-purple-200",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };

const TYPE_CONFIG: Record<OrderType, { label: string; icon: typeof Utensils }> =
  {
    "dine-in": { label: "Dine-in", icon: Utensils },
    takeaway: { label: "Takeaway", icon: ShoppingBag },
    delivery: { label: "Delivery", icon: Truck },
  };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

type FilterTab = "all" | "active" | "completed" | "cancelled";

function filterOrders(
  orders: Order[],
  tab: FilterTab,
  statusFilter: string,
  search: string
): Order[] {
  let filtered = orders;

  // Tab filter
  if (tab === "active") {
    filtered = filtered.filter((o) =>
      ["draft", "confirmed", "preparing", "ready", "served"].includes(o.status)
    );
  } else if (tab === "completed") {
    filtered = filtered.filter((o) => o.status === "completed");
  } else if (tab === "cancelled") {
    filtered = filtered.filter((o) => o.status === "cancelled");
  }

  // Status dropdown
  if (statusFilter && statusFilter !== "all") {
    filtered = filtered.filter((o) => o.status === statusFilter);
  }

  // Search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.table?.toLowerCase().includes(q)
    );
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = filterOrders(MOCK_ORDERS, tab, statusFilter, search);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track all restaurant orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>Today</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="served">Served</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as FilterTab)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="w-64 pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tab === "all"
              ? "All Orders"
              : tab === "active"
                ? "Active Orders"
                : tab === "completed"
                  ? "Completed Orders"
                  : "Cancelled Orders"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filtered.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const typeInfo = TYPE_CONFIG[order.type];
                  const TypeIcon = typeInfo.icon;
                  const statusInfo = STATUS_CONFIG[order.status];

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.table ?? "-"}</TableCell>
                      <TableCell className="text-center">
                        {order.items.reduce((s, i) => s + i.quantity, 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusInfo.className}
                        >
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTime(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No orders match the current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog
        open={selectedOrder !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent>
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  {TYPE_CONFIG[selectedOrder.type].label} order
                  {selectedOrder.table ? ` at ${selectedOrder.table}` : ""}
                  {" \u00B7 "}
                  {formatTime(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge
                    variant="outline"
                    className={STATUS_CONFIG[selectedOrder.status].className}
                  >
                    {STATUS_CONFIG[selectedOrder.status].label}
                  </Badge>
                </div>

                {selectedOrder.customerName && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Customer:</span>
                    <span className="text-sm">
                      {selectedOrder.customerName}
                    </span>
                  </div>
                )}

                {/* Items */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">Items</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-center">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatINR(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="font-semibold"
                          >
                            Total
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatINR(selectedOrder.total)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
