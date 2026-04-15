"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBranchStore } from "@/stores/branch-store";
import { useTenantUser } from "@/lib/auth/hooks";
import {
  ChefHat,
  Clock,
  Volume2,
  VolumeX,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Play,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Timer,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { KotStatus, OrderType } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface KOTItem {
  id: string;
  name: string;
  quantity: number;
  modifiers: string[];
  notes: string;
}

interface KOT {
  id: string;
  orderNumber: string;
  tableNumber: string | null;
  orderType: OrderType;
  status: KotStatus;
  createdAt: Date;
  items: KOTItem[];
  // Platform integration fields
  aggregatorPlatform: string | null;
  customerName: string | null;
  deliveryPartnerName: string | null;
  deliveryPartnerPhone: string | null;
  pickupEta: Date | null;
  aggregatorOrderId: string | null;
  orderId: string;
}

// ---------------------------------------------------------------------------
// Platform config
// ---------------------------------------------------------------------------
const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; logo: string }
> = {
  zomato: {
    label: "Zomato",
    color: "text-white",
    bgColor: "bg-red-600",
    borderColor: "border-red-500",
    logo: "Z",
  },
  swiggy: {
    label: "Swiggy",
    color: "text-white",
    bgColor: "bg-orange-500",
    borderColor: "border-orange-400",
    logo: "S",
  },
};

// ---------------------------------------------------------------------------
// Helpers to map DB rows → KOT interface
// ---------------------------------------------------------------------------
interface DbKot {
  id: string;
  kot_number: string;
  status: KotStatus;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  orders: {
    id: string;
    order_number: string;
    order_type: OrderType;
    table_id: string | null;
    aggregator_platform: string | null;
    aggregator_order_id: string | null;
    restaurant_tables: { table_number: string } | null;
    order_items: {
      id: string;
      menu_item_id: string;
      quantity: number;
      unit_price: number;
      notes: string | null;
      modifiers: unknown;
      menu_items: { name: string } | null;
    }[];
  } | null;
}

function mapDbKotToKOT(kot: DbKot): KOT {
  const order = kot.orders;
  const items = (order?.order_items ?? []).map((oi) => ({
    id: oi.id,
    name: oi.menu_items?.name ?? "Unknown",
    quantity: oi.quantity,
    modifiers: Array.isArray(oi.modifiers)
      ? oi.modifiers.map((m: Record<string, unknown>) => (typeof m === "string" ? m : (m.name as string)) ?? "")
      : [],
    notes: oi.notes ?? "",
  }));

  return {
    id: kot.id,
    orderId: order?.id ?? "",
    orderNumber: order?.order_number ?? kot.kot_number,
    tableNumber: order?.restaurant_tables?.table_number ?? null,
    orderType: order?.order_type ?? "dine_in",
    status: kot.status,
    createdAt: new Date(kot.created_at),
    items,
    aggregatorPlatform: order?.aggregator_platform ?? null,
    customerName: null,
    deliveryPartnerName: null,
    deliveryPartnerPhone: null,
    pickupEta: null,
    aggregatorOrderId: order?.aggregator_order_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Order Type Config
// ---------------------------------------------------------------------------
const ORDER_TYPE_CONFIG: Record<
  OrderType,
  { label: string; icon: typeof UtensilsCrossed; className: string }
> = {
  dine_in: {
    label: "Dine-in",
    icon: UtensilsCrossed,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  takeaway: {
    label: "Takeaway",
    icon: ShoppingBag,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  delivery: {
    label: "Delivery",
    icon: Truck,
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  kiosk: {
    label: "Kiosk",
    icon: ShoppingBag,
    className: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  },
  aggregator: {
    label: "Online",
    icon: Truck,
    className: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatElapsed(createdAt: Date): string {
  const diffSec = Math.floor((Date.now() - createdAt.getTime()) / 1000);
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatEtaCountdown(eta: Date): string {
  const diffMs = eta.getTime() - Date.now();
  if (diffMs <= 0) return "NOW";
  const mins = Math.floor(diffMs / 60_000);
  const secs = Math.floor((diffMs % 60_000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getTimerColor(createdAt: Date): string {
  const mins = (Date.now() - createdAt.getTime()) / 60_000;
  if (mins > 15) return "text-red-400";
  if (mins > 10) return "text-amber-400";
  return "text-green-400";
}

function getEtaColor(eta: Date): string {
  const diffMins = (eta.getTime() - Date.now()) / 60_000;
  if (diffMins <= 2) return "text-red-400";
  if (diffMins <= 5) return "text-amber-400";
  return "text-green-400";
}

// Priority sort: online orders with closer pickup ETA come first
function sortByPriority(kots: KOT[]): KOT[] {
  return [...kots].sort((a, b) => {
    // Online orders with pickup ETA get highest priority
    if (a.pickupEta && b.pickupEta) {
      return a.pickupEta.getTime() - b.pickupEta.getTime();
    }
    if (a.pickupEta && !b.pickupEta) return -1;
    if (!a.pickupEta && b.pickupEta) return 1;
    // Then by creation time (oldest first)
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

// ---------------------------------------------------------------------------
// Platform Badge
// ---------------------------------------------------------------------------
function PlatformBadge({ platform }: { platform: string }) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return null;

  return (
    <div className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold", config.bgColor, config.color)}>
      <span className="text-sm font-black">{config.logo}</span>
      {config.label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KOT Card Component
// ---------------------------------------------------------------------------
function KOTCard({
  kot,
  onAction,
}: {
  kot: KOT;
  onAction: (id: string, newStatus: KotStatus, orderId: string) => void;
}) {
  const [elapsed, setElapsed] = useState(formatElapsed(kot.createdAt));
  const [etaCountdown, setEtaCountdown] = useState(
    kot.pickupEta ? formatEtaCountdown(kot.pickupEta) : null
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(kot.createdAt));
      if (kot.pickupEta) {
        setEtaCountdown(formatEtaCountdown(kot.pickupEta));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [kot.createdAt, kot.pickupEta]);

  const config = ORDER_TYPE_CONFIG[kot.orderType];
  const TypeIcon = config.icon;
  const isOnline = kot.orderType === "aggregator" && kot.aggregatorPlatform;
  const platformConfig = kot.aggregatorPlatform
    ? PLATFORM_CONFIG[kot.aggregatorPlatform]
    : null;

  const actionMap: Record<
    string,
    { label: string; newStatus: KotStatus; icon: typeof Play }
  > = {
    pending: { label: "Start Cooking", newStatus: "in_progress", icon: Play },
    in_progress: { label: "Mark Ready", newStatus: "ready", icon: CheckCircle2 },
    ready: { label: "Picked Up / Served", newStatus: "served", icon: ArrowRight },
  };

  const action = actionMap[kot.status];

  return (
    <Card
      className={cn(
        "shadow-lg",
        isOnline && platformConfig
          ? `border-2 ${platformConfig.borderColor} bg-zinc-800/90`
          : "border-zinc-700 bg-zinc-800/80"
      )}
    >
      <CardHeader className="p-4 pb-2">
        {/* Platform banner for online orders */}
        {isOnline && kot.aggregatorPlatform && (
          <div className="flex items-center justify-between -mt-1 mb-2">
            <PlatformBadge platform={kot.aggregatorPlatform} />
            {kot.aggregatorOrderId && (
              <span className="text-[10px] font-mono text-zinc-500">
                {kot.aggregatorOrderId}
              </span>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-zinc-100">
              {kot.orderNumber}
            </CardTitle>
            {kot.tableNumber && (
              <p className="text-sm text-zinc-400">{kot.tableNumber}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {!isOnline && (
              <Badge variant="outline" className={cn("text-[10px]", config.className)}>
                <TypeIcon className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
            )}
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-mono font-semibold",
                getTimerColor(kot.createdAt)
              )}
            >
              <Clock className="h-3 w-3" />
              {elapsed}
            </div>
          </div>
        </div>

        {/* Delivery partner info + pickup ETA */}
        {isOnline && (
          <div className="mt-2 space-y-1 rounded-md bg-zinc-900/60 p-2">
            {kot.customerName && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{kot.customerName}</span>
              </div>
            )}
            {kot.deliveryPartnerName && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                <Truck className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {kot.deliveryPartnerName}
                </span>
                {kot.deliveryPartnerPhone && (
                  <a href={`tel:${kot.deliveryPartnerPhone}`} className="ml-auto text-blue-400 hover:text-blue-300">
                    <Phone className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            {kot.pickupEta && etaCountdown && (
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-bold",
                  getEtaColor(kot.pickupEta)
                )}
              >
                <Timer className="h-3 w-3 shrink-0" />
                Pickup in: {etaCountdown}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <Separator className="bg-zinc-700" />

      <CardContent className="p-4 pt-3">
        <ul className="space-y-2">
          {kot.items.map((item) => (
            <li key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-zinc-200">
                    {item.name}
                  </span>
                  {item.modifiers.length > 0 && (
                    <p className="text-xs text-amber-400">
                      {item.modifiers.join(", ")}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs italic text-zinc-500">
                      {item.notes}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-zinc-600 text-xs font-bold text-zinc-300"
                >
                  x{item.quantity}
                </Badge>
              </div>
            </li>
          ))}
        </ul>

        {action && (
          <Button
            className={cn(
              "mt-4 w-full gap-2 font-semibold",
              kot.status === "pending" &&
                "bg-blue-600 text-white hover:bg-blue-700",
              kot.status === "in_progress" &&
                "bg-green-600 text-white hover:bg-green-700",
              kot.status === "ready" &&
                "bg-amber-600 text-white hover:bg-amber-700"
            )}
            onClick={() => onAction(kot.id, action.newStatus, kot.orderId)}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Column Component
// ---------------------------------------------------------------------------
function KDSColumn({
  title,
  kots,
  onAction,
  accentColor,
}: {
  title: string;
  kots: KOT[];
  onAction: (id: string, newStatus: KotStatus, orderId: string) => void;
  accentColor: string;
}) {
  return (
    <div className="flex min-w-[320px] flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-700 px-4 py-3">
        <div className={cn("h-2.5 w-2.5 rounded-full", accentColor)} />
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          {title}
        </h2>
        <Badge
          variant="outline"
          className="ml-auto border-zinc-600 text-xs text-zinc-400"
        >
          {kots.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {kots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
              <ChefHat className="mb-2 h-8 w-8" />
              <p className="text-sm">No orders</p>
            </div>
          )}
          {kots.map((kot) => (
            <KOTCard key={kot.id} kot={kot} onAction={onAction} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KDS Page
// ---------------------------------------------------------------------------
export default function KitchenDisplayPage() {
  const [kots, setKots] = useState<KOT[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<"all" | "dine_in" | "swiggy" | "zomato">("all");
  const { activeBranchId } = useBranchStore();
  const { tenantUser } = useTenantUser();
  const supabase = createClient();

  // Fetch KOTs from database + realtime subscription
  useEffect(() => {
    if (!tenantUser) return;
    const branchId = tenantUser.branch_id || activeBranchId;
    if (!branchId) {
      setLoading(false);
      return;
    }

    const fetchKOTs = async () => {
      const { data, error } = await supabase
        .from("kots")
        .select(`
          id,
          kot_number,
          status,
          created_at,
          accepted_at,
          ready_at,
          orders (
            id,
            order_number,
            order_type,
            table_id,
            aggregator_platform,
            aggregator_order_id,
            restaurant_tables ( table_number ),
            order_items (
              id,
              menu_item_id,
              quantity,
              unit_price,
              notes,
              modifiers,
              menu_items ( name )
            )
          )
        `)
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("branch_id", branchId)
        .in("status", ["pending", "in_progress", "ready"])
        .order("created_at", { ascending: false });

      if (!error && data) {
        setKots((data as unknown as DbKot[]).map(mapDbKotToKOT));
      }
      setLoading(false);
    };

    fetchKOTs();

    // Realtime: refetch whenever kots or orders change
    const channel = supabase
      .channel("kds-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kots", filter: `branch_id=eq.${branchId}` },
        () => { fetchKOTs(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `branch_id=eq.${branchId}` },
        () => { fetchKOTs(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantUser, activeBranchId]);

  // Sync KOT status back to platform when kitchen updates
  const syncStatusToPlatform = useCallback(
    async (orderId: string, newStatus: KotStatus) => {
      const statusMap: Record<string, string> = {
        in_progress: "preparing",
        ready: "ready",
        served: "completed",
      };
      const mappedStatus = statusMap[newStatus];
      if (!mappedStatus) return;

      try {
        await fetch("/api/integrations/status-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            new_status: mappedStatus,
          }),
        });
      } catch {
        // Silent fail — logged server-side
      }
    },
    []
  );

  const handleAction = useCallback(
    (id: string, newStatus: KotStatus, orderId: string) => {
      setKots((prev) => {
        const kot = prev.find((k) => k.id === id);
        const isAggregator = kot?.orderType === "aggregator";

        const updated =
          newStatus === "served"
            ? prev.filter((k) => k.id !== id)
            : prev.map((k) =>
                k.id === id ? { ...k, status: newStatus } : k
              );

        // Push status to platform for aggregator orders
        if (isAggregator) {
          syncStatusToPlatform(orderId, newStatus);
        }

        return updated;
      });

      // Update KOT in database
      const timestampField =
        newStatus === "in_progress"
          ? "accepted_at"
          : newStatus === "ready"
            ? "ready_at"
            : null;

      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (timestampField) {
        updatePayload[timestampField] = new Date().toISOString();
      }

      supabase.from("kots").update(updatePayload).eq("id", id).then(() => {});

      // Play notification sound
      if (soundEnabled && typeof window !== "undefined") {
        try {
          const ctx = new AudioContext();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          oscillator.connect(gain);
          gain.connect(ctx.destination);
          oscillator.frequency.value = newStatus === "ready" ? 880 : 660;
          gain.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.15);
        } catch {
          // Audio not available
        }
      }
    },
    [soundEnabled, supabase, syncStatusToPlatform]
  );

  // Filter KOTs
  const filteredKots = kots.filter((k) => {
    if (filter === "all") return true;
    if (filter === "dine_in") return k.orderType !== "aggregator";
    return k.aggregatorPlatform === filter;
  });

  // Sort by priority (online orders with closer pickup ETA first)
  const pendingKots = sortByPriority(filteredKots.filter((k) => k.status === "pending"));
  const inProgressKots = sortByPriority(filteredKots.filter((k) => k.status === "in_progress"));
  const readyKots = sortByPriority(filteredKots.filter((k) => k.status === "ready"));

  // Counts for filter badges
  const onlineCount = kots.filter((k) => k.orderType === "aggregator").length;
  const zomatoCount = kots.filter((k) => k.aggregatorPlatform === "zomato").length;
  const swiggyCount = kots.filter((k) => k.aggregatorPlatform === "swiggy").length;
  const dineInCount = kots.filter((k) => k.orderType !== "aggregator").length;

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col bg-zinc-900 lg:-m-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-3">
        <div className="flex items-center gap-3">
          <ChefHat className="h-6 w-6 text-orange-400" />
          <h1 className="text-lg font-bold text-zinc-100">
            Kitchen Display System
          </h1>
          <Badge
            variant="outline"
            className="border-zinc-600 text-xs text-zinc-400"
          >
            {filteredKots.length} active
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Channel filter tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="bg-zinc-800 border border-zinc-700">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-zinc-700">
                All ({kots.length})
              </TabsTrigger>
              <TabsTrigger value="dine_in" className="text-xs data-[state=active]:bg-zinc-700">
                Dine-in ({dineInCount})
              </TabsTrigger>
              <TabsTrigger value="zomato" className="text-xs data-[state=active]:bg-zinc-700">
                <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded bg-red-600 text-[9px] font-black text-white">Z</span>
                ({zomatoCount})
              </TabsTrigger>
              <TabsTrigger value="swiggy" className="text-xs data-[state=active]:bg-zinc-700">
                <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded bg-orange-500 text-[9px] font-black text-white">S</span>
                ({swiggyCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100"
            onClick={() => setSoundEnabled((prev) => !prev)}
          >
            {soundEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Kanban columns */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <ChefHat className="h-10 w-10 animate-pulse" />
            <p className="text-sm">Loading kitchen orders...</p>
          </div>
        </div>
      ) : (
      <div className="flex flex-1 divide-x divide-zinc-700 overflow-x-auto">
        <KDSColumn
          title="New"
          kots={pendingKots}
          onAction={handleAction}
          accentColor="bg-blue-500"
        />
        <KDSColumn
          title="In Progress"
          kots={inProgressKots}
          onAction={handleAction}
          accentColor="bg-amber-500"
        />
        <KDSColumn
          title="Ready"
          kots={readyKots}
          onAction={handleAction}
          accentColor="bg-green-500"
        />
      </div>
      )}
    </div>
  );
}
