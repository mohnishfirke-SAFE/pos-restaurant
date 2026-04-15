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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  ShoppingBag,
  Utensils,
  Truck,
  Check,
  X,
  Loader2,
  Timer,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrders } from "@/hooks/use-orders";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";

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

type OrderSource = "dine_in" | "takeaway" | "delivery" | "zomato" | "swiggy";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  source: OrderSource;
  table: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  customerName?: string;
  aggregatorOrderId?: string;
  aggregatorPlatform?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  pickupEta?: string;
  commissionPct?: number;
  commissionAmount?: number;
  autoAccepted?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map DB order_type + aggregator_platform to a UI OrderSource */
function mapSource(
  orderType: string,
  aggregatorPlatform?: string | null
): OrderSource {
  if (orderType === "dine_in") return "dine_in";
  if (orderType === "takeaway") return "takeaway";
  if (orderType === "delivery") return "delivery";
  if (orderType === "aggregator") {
    if (aggregatorPlatform === "swiggy") return "swiggy";
    return "zomato"; // default aggregator to zomato
  }
  return "dine_in";
}

/** Format a date string as a relative time label (e.g. "2m ago", "1h ago") */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

/** Transform raw DB rows returned by useOrders into the UI-friendly Order[] */
function transformOrders(raw: any[]): Order[] {
  return raw.map((row) => {
    const source = mapSource(row.order_type, row.aggregator_platform);

    const items: OrderItem[] = (row.order_items ?? []).map((oi: any) => ({
      name: oi.menu_items?.name ?? oi.menu_item_id ?? "Unknown item",
      quantity: oi.quantity,
      price: Number(oi.unit_price ?? 0),
    }));

    return {
      id: row.id,
      orderNumber: row.order_number ?? row.id.slice(0, 8).toUpperCase(),
      source,
      table:
        source === "dine_in" && row.restaurant_tables?.table_number
          ? `T${row.restaurant_tables.table_number}`
          : null,
      items,
      total: Number(row.total ?? 0),
      status: row.status as OrderStatus,
      createdAt: row.created_at,
      customerName: row.customers?.name ?? undefined,
      aggregatorOrderId: row.aggregator_order_id ?? undefined,
      aggregatorPlatform: row.aggregator_platform ?? undefined,
      deliveryPartnerName: row.delivery_partner_name ?? undefined,
      deliveryPartnerPhone: row.delivery_partner_phone ?? undefined,
      pickupEta: row.pickup_eta ?? undefined,
      commissionPct: row.commission_pct ?? undefined,
      commissionAmount: row.commission_amount
        ? Number(row.commission_amount)
        : undefined,
      autoAccepted: row.auto_accepted ?? undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SOURCE_CONFIG: Record<
  OrderSource,
  { label: string; color: string; logo?: string; bgColor?: string }
> = {
  dine_in: {
    label: "Dine-in",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  takeaway: {
    label: "Takeaway",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  delivery: {
    label: "Delivery",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  zomato: {
    label: "Zomato",
    color: "text-white border-red-600",
    logo: "Z",
    bgColor: "bg-red-600",
  },
  swiggy: {
    label: "Swiggy",
    color: "text-white border-orange-500",
    logo: "S",
    bgColor: "bg-orange-500",
  },
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  draft: {
    label: "Pending Accept",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  preparing: {
    label: "Preparing",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  ready: {
    label: "Ready",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  served: {
    label: "Served",
    color: "bg-teal-100 text-teal-700 border-teal-200",
  },
  completed: {
    label: "Completed",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
  },
};

function SourceBadge({ source }: { source: OrderSource }) {
  const config = SOURCE_CONFIG[source];
  if (config.logo) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[10px] font-bold",
          config.color,
          config.bgColor
        )}
      >
        <span className="text-xs font-black">{config.logo}</span>
        {config.label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("text-[10px]", config.color)}>
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OrdersPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const { activeBranchId } = useBranchStore();

  const {
    data: rawOrders = [],
    isLoading: ordersLoading,
  } = useOrders(
    tenantUser?.tenant_id ?? null,
    tenantUser?.branch_id || activeBranchId
  );

  const orders = transformOrders(rawOrders);
  const isLoading = authLoading || ordersLoading;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName?.toLowerCase().includes(search.toLowerCase()) ??
        false);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesChannel =
      channelFilter === "all" ||
      (channelFilter === "online" &&
        (order.source === "zomato" || order.source === "swiggy")) ||
      order.source === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const onlineCount = orders.filter(
    (o) => o.source === "zomato" || o.source === "swiggy"
  ).length;
  const pendingAcceptCount = orders.filter(
    (o) =>
      o.status === "draft" && (o.source === "zomato" || o.source === "swiggy")
  ).length;

  async function handleAcceptOrder(orderId: string) {
    setAccepting(true);
    await fetch("/api/integrations/accept-reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, action: "accept" }),
    });
    setAccepting(false);
    setSelectedOrder(null);
  }

  async function handleRejectOrder(orderId: string, reason: string) {
    setRejecting(true);
    await fetch("/api/integrations/accept-reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        action: "reject",
        rejection_reason: reason,
      }),
    });
    setRejecting(false);
    setSelectedOrder(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage all orders across channels
            {pendingAcceptCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px]">
                {pendingAcceptCount} pending acceptance
              </Badge>
            )}
          </p>
        </div>
      </div>

      {/* Channel filter tabs */}
      <Tabs value={channelFilter} onValueChange={setChannelFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="dine_in">
            <Utensils className="mr-1 h-3.5 w-3.5" />
            Dine-in
          </TabsTrigger>
          <TabsTrigger value="online" className="gap-1">
            <Truck className="mr-1 h-3.5 w-3.5" />
            Online ({onlineCount})
          </TabsTrigger>
          <TabsTrigger value="zomato" className="gap-1">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-red-600 text-[8px] font-black text-white">
              Z
            </span>
            Zomato
          </TabsTrigger>
          <TabsTrigger value="swiggy" className="gap-1">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-orange-500 text-[8px] font-black text-white">
              S
            </span>
            Swiggy
          </TabsTrigger>
          <TabsTrigger value="takeaway">
            <ShoppingBag className="mr-1 h-3.5 w-3.5" />
            Takeaway
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Live Orders</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="w-64 pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Pending Accept</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">
                Loading orders...
              </span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                No orders yet
              </p>
              <p className="text-sm text-muted-foreground/70">
                Orders from all channels will appear here as they come in.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={cn(
                      order.status === "draft" &&
                        "bg-yellow-50/50 dark:bg-yellow-950/10"
                    )}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {order.orderNumber}
                      {order.aggregatorOrderId && (
                        <div className="text-[10px] text-muted-foreground">
                          {order.aggregatorOrderId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <SourceBadge source={order.source} />
                    </TableCell>
                    <TableCell>
                      {order.customerName || "-"}
                      {order.table && (
                        <div className="text-xs text-muted-foreground">
                          {order.table}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.items.length} items
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatINR(order.total)}
                    </TableCell>
                    <TableCell>
                      {order.commissionAmount ? (
                        <span className="text-xs text-red-500">
                          -{formatINR(order.commissionAmount)} (
                          {order.commissionPct}%)
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          STATUS_CONFIG[order.status].color
                        )}
                      >
                        {STATUS_CONFIG[order.status].label}
                      </Badge>
                      {order.autoAccepted && (
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          Auto-accepted
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(order.createdAt)}
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
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedOrder.orderNumber}
                <SourceBadge source={selectedOrder.source} />
              </DialogTitle>
              <DialogDescription>
                {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Customer & Delivery Info */}
              {(selectedOrder.source === "zomato" ||
                selectedOrder.source === "swiggy") && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Platform Details
                  </p>
                  {selectedOrder.aggregatorOrderId && (
                    <div className="text-sm">
                      Platform Order:{" "}
                      <code className="bg-muted px-1 rounded">
                        {selectedOrder.aggregatorOrderId}
                      </code>
                    </div>
                  )}
                  {selectedOrder.customerName && (
                    <div className="text-sm">
                      Customer: {selectedOrder.customerName}
                    </div>
                  )}
                  {selectedOrder.deliveryPartnerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-3.5 w-3.5" />
                      {selectedOrder.deliveryPartnerName}
                      {selectedOrder.deliveryPartnerPhone && (
                        <a
                          href={`tel:${selectedOrder.deliveryPartnerPhone}`}
                          className="text-blue-500 hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                  {selectedOrder.pickupEta && (
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="h-3.5 w-3.5" />
                      Pickup ETA:{" "}
                      {new Date(selectedOrder.pickupEta).toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  )}
                  {selectedOrder.commissionPct !== undefined && (
                    <div className="text-sm text-red-500">
                      Commission: {selectedOrder.commissionPct}% = -
                      {formatINR(selectedOrder.commissionAmount || 0)}
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Items
                </p>
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span>{formatINR(selectedOrder.total)}</span>
                </div>
                {selectedOrder.commissionAmount ? (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Net (after commission)</span>
                    <span>
                      {formatINR(
                        selectedOrder.total - selectedOrder.commissionAmount
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Accept/Reject buttons for pending online orders */}
            {selectedOrder.status === "draft" &&
              (selectedOrder.source === "zomato" ||
                selectedOrder.source === "swiggy") && (
                <DialogFooter className="flex gap-2 sm:justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={rejecting}
                    onClick={() =>
                      handleRejectOrder(selectedOrder.id, "restaurant_busy")
                    }
                  >
                    {rejecting ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-1 h-4 w-4" />
                    )}
                    Reject Order
                  </Button>
                  <Button
                    size="sm"
                    disabled={accepting}
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                  >
                    {accepting ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    Accept Order
                  </Button>
                </DialogFooter>
              )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
