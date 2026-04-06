"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Pause,
  Send,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePOSStore, type CartItem } from "@/stores/pos-store";
import { useMenuItems, useMenuCategories } from "@/hooks/use-menu";
import { formatINR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock tables (until a real tables hook is available)
// ---------------------------------------------------------------------------
const MOCK_TABLES = [
  { id: "t1", name: "Table 1" },
  { id: "t2", name: "Table 2" },
  { id: "t3", name: "Table 3" },
  { id: "t4", name: "Table 4" },
  { id: "t5", name: "Table 5" },
  { id: "t6", name: "Table 6" },
  { id: "t7", name: "Table 7" },
  { id: "t8", name: "Table 8" },
  { id: "t9", name: "Table 9" },
  { id: "t10", name: "Table 10" },
];

// ---------------------------------------------------------------------------
// Payment Dialog
// ---------------------------------------------------------------------------
function PaymentDialog({
  open,
  onOpenChange,
  total,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onComplete: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "card" | "upi">("cash");
  const [amountTendered, setAmountTendered] = useState("");

  const changeDue = useMemo(() => {
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - total);
  }, [amountTendered, total]);

  const canComplete =
    method !== "cash" || (parseFloat(amountTendered) || 0) >= total;

  function handleComplete() {
    onComplete();
    onOpenChange(false);
    setMethod("cash");
    setAmountTendered("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Total due: <span className="font-bold">{formatINR(total)}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Payment method buttons */}
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { key: "cash", label: "Cash", icon: Banknote },
              { key: "card", label: "Card", icon: CreditCard },
              { key: "upi", label: "UPI", icon: Smartphone },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={method === key ? "default" : "outline"}
              className="flex h-20 flex-col gap-2"
              onClick={() => setMethod(key)}
            >
              <Icon className="!h-6 !w-6" />
              {label}
            </Button>
          ))}
        </div>

        {/* Cash-specific fields */}
        {method === "cash" && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount Tendered</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                min={0}
                step={0.01}
                autoFocus
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Change Due</span>
              <span className="text-lg font-bold text-green-600">
                {formatINR(changeDue)}
              </span>
            </div>
          </div>
        )}

        {method === "card" && (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            Waiting for card terminal...
          </div>
        )}

        {method === "upi" && (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            Scan QR or enter UPI reference after payment
          </div>
        )}

        <DialogFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={!canComplete}
            onClick={handleComplete}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Complete Payment &mdash; {formatINR(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// POS Terminal Page
// ---------------------------------------------------------------------------
export default function POSTerminalPage() {
  // Store
  const {
    orderType,
    tableId,
    cartItems,
    discountAmount,
    setOrderType,
    setTableId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTaxBreakdown,
    getTotal,
  } = usePOSStore();

  // Menu data
  const { data: categories, isLoading: categoriesLoading } =
    useMenuCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: menuItems, isLoading: itemsLoading } =
    useMenuItems(selectedCategory ?? undefined);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Derived values
  const subtotal = getSubtotal();
  const tax = getTaxBreakdown();
  const total = getTotal();

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [menuItems, searchQuery]);

  // Handlers
  function handleAddItem(item: {
    id: string;
    name: string;
    base_price: number;
    gst_rate?: number;
  }) {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.base_price,
      quantity: 1,
      modifiers: [],
      notes: "",
      gstRate: item.gst_rate ?? 5,
    });
  }

  function handleSendToKitchen() {
    // TODO: integrate with KOT creation via Supabase
    alert("Order sent to kitchen!");
  }

  function handleHold() {
    // TODO: persist held orders
    alert("Order placed on hold.");
  }

  function handlePaymentComplete() {
    clearCart();
  }

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] lg:-m-6">
      {/* ================================================================ */}
      {/* LEFT PANEL - Menu Browser                                        */}
      {/* ================================================================ */}
      <div className="flex flex-1 flex-col overflow-hidden border-r">
        {/* Category pills + search */}
        <div className="space-y-3 border-b p-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categoriesLoading && (
              <span className="text-sm text-muted-foreground">Loading...</span>
            )}
            {categories?.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu items grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {itemsLoading && (
              <p className="col-span-full text-center text-sm text-muted-foreground">
                Loading menu items...
              </p>
            )}

            {!itemsLoading && filteredItems.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground">
                No items found.
              </p>
            )}

            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  "cursor-pointer transition-shadow hover:shadow-md",
                  !item.is_available && "opacity-50"
                )}
                onClick={() =>
                  item.is_available &&
                  handleAddItem(item as { id: string; name: string; base_price: number; gst_rate?: number })
                }
              >
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-sm font-medium leading-tight">
                    {item.name}
                  </span>
                  <span className="mt-1 text-sm font-bold text-primary">
                    {formatINR(item.base_price)}
                  </span>
                  {!item.is_available && (
                    <Badge variant="secondary" className="mt-1.5 text-[10px]">
                      Unavailable
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ================================================================ */}
      {/* RIGHT PANEL - Order / Cart                                       */}
      {/* ================================================================ */}
      <div className="flex w-full max-w-[400px] flex-col bg-muted/30">
        {/* Order type tabs */}
        <div className="space-y-3 border-b p-4">
          <Tabs
            value={orderType}
            onValueChange={(v) =>
              setOrderType(v as "dine_in" | "takeaway" | "delivery")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="dine_in" className="flex-1 gap-1.5">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Dine-in
              </TabsTrigger>
              <TabsTrigger value="takeaway" className="flex-1 gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                Takeaway
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex-1 gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                Delivery
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Table selector (dine-in only) */}
          {orderType === "dine_in" && (
            <Select
              value={tableId ?? ""}
              onValueChange={(v) => setTableId(v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_TABLES.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Cart items */}
        <ScrollArea className="flex-1">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <ShoppingCart className="h-10 w-10" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Tap an item to add it</p>
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {cartItems.map((ci: CartItem) => (
                <div
                  key={ci.id}
                  className="flex items-start gap-2 rounded-lg border bg-background p-3"
                >
                  {/* Item info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ci.name}</p>
                    {ci.modifiers.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {ci.modifiers.map((m) => m.name).join(", ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm font-semibold text-primary">
                      {formatINR(
                        (ci.price +
                          ci.modifiers.reduce((s, m) => s + m.price, 0)) *
                          ci.quantity
                      )}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(ci.id, ci.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {ci.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(ci.id, ci.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeItem(ci.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals + actions */}
        <div className="border-t bg-background p-4">
          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST</span>
              <span>{formatINR(tax.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST</span>
              <span>{formatINR(tax.sgst)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatINR(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleSendToKitchen}
              disabled={cartItems.length === 0}
            >
              <Send className="h-3.5 w-3.5" />
              Kitchen
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleHold}
              disabled={cartItems.length === 0}
            >
              <Pause className="h-3.5 w-3.5" />
              Hold
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => setPaymentOpen(true)}
              disabled={cartItems.length === 0}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Pay
            </Button>
          </div>
        </div>
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
}
