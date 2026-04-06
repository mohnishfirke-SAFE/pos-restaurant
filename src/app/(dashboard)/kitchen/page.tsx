"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const MOCK_KOTS: KOT[] = [
  {
    id: "kot-1",
    orderNumber: "#1042",
    tableNumber: "T3",
    orderType: "dine_in",
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 60_000),
    items: [
      { id: "i1", name: "Butter Chicken", quantity: 2, modifiers: ["Extra Spicy"], notes: "" },
      { id: "i2", name: "Garlic Naan", quantity: 4, modifiers: [], notes: "" },
      { id: "i3", name: "Dal Makhani", quantity: 1, modifiers: [], notes: "Less salt" },
    ],
  },
  {
    id: "kot-2",
    orderNumber: "#1043",
    tableNumber: null,
    orderType: "takeaway",
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60_000),
    items: [
      { id: "i4", name: "Chicken Biryani", quantity: 1, modifiers: ["No Raita"], notes: "" },
      { id: "i5", name: "Paneer Tikka", quantity: 1, modifiers: [], notes: "" },
    ],
  },
  {
    id: "kot-3",
    orderNumber: "#1040",
    tableNumber: "T7",
    orderType: "dine_in",
    status: "in_progress",
    createdAt: new Date(Date.now() - 12 * 60_000),
    items: [
      { id: "i6", name: "Tandoori Platter", quantity: 1, modifiers: [], notes: "" },
      { id: "i7", name: "Hyderabadi Biryani", quantity: 2, modifiers: ["Extra Salan"], notes: "" },
    ],
  },
  {
    id: "kot-4",
    orderNumber: "#1041",
    tableNumber: null,
    orderType: "delivery",
    status: "in_progress",
    createdAt: new Date(Date.now() - 8 * 60_000),
    items: [
      { id: "i8", name: "Veg Thali", quantity: 3, modifiers: [], notes: "No onion, no garlic" },
    ],
  },
  {
    id: "kot-5",
    orderNumber: "#1038",
    tableNumber: "T1",
    orderType: "dine_in",
    status: "ready",
    createdAt: new Date(Date.now() - 20 * 60_000),
    items: [
      { id: "i9", name: "Masala Dosa", quantity: 2, modifiers: [], notes: "" },
      { id: "i10", name: "Filter Coffee", quantity: 2, modifiers: [], notes: "" },
    ],
  },
  {
    id: "kot-6",
    orderNumber: "#1039",
    tableNumber: null,
    orderType: "takeaway",
    status: "ready",
    createdAt: new Date(Date.now() - 15 * 60_000),
    items: [
      { id: "i11", name: "Chole Bhature", quantity: 1, modifiers: [], notes: "" },
      { id: "i12", name: "Lassi", quantity: 1, modifiers: ["Sweet"], notes: "" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
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
    label: "Aggregator",
    icon: Truck,
    className: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  },
};

function formatElapsed(createdAt: Date): string {
  const diffSec = Math.floor((Date.now() - createdAt.getTime()) / 1000);
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getTimerColor(createdAt: Date): string {
  const mins = (Date.now() - createdAt.getTime()) / 60_000;
  if (mins > 15) return "text-red-400";
  if (mins > 10) return "text-amber-400";
  return "text-green-400";
}

// ---------------------------------------------------------------------------
// KOT Card Component
// ---------------------------------------------------------------------------
function KOTCard({
  kot,
  onAction,
}: {
  kot: KOT;
  onAction: (id: string, newStatus: KotStatus) => void;
}) {
  const [elapsed, setElapsed] = useState(formatElapsed(kot.createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(kot.createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [kot.createdAt]);

  const config = ORDER_TYPE_CONFIG[kot.orderType];
  const TypeIcon = config.icon;

  const actionMap: Record<
    string,
    { label: string; newStatus: KotStatus; icon: typeof Play }
  > = {
    pending: { label: "Start Cooking", newStatus: "in_progress", icon: Play },
    in_progress: { label: "Mark Ready", newStatus: "ready", icon: CheckCircle2 },
    ready: { label: "Served", newStatus: "served", icon: ArrowRight },
  };

  const action = actionMap[kot.status];

  return (
    <Card className="border-zinc-700 bg-zinc-800/80 shadow-lg">
      <CardHeader className="p-4 pb-2">
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
            <Badge variant="outline" className={cn("text-[10px]", config.className)}>
              <TypeIcon className="mr-1 h-3 w-3" />
              {config.label}
            </Badge>
            <div className={cn("flex items-center gap-1 text-xs font-mono font-semibold", getTimerColor(kot.createdAt))}>
              <Clock className="h-3 w-3" />
              {elapsed}
            </div>
          </div>
        </div>
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
            onClick={() => onAction(kot.id, action.newStatus)}
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
  onAction: (id: string, newStatus: KotStatus) => void;
  accentColor: string;
}) {
  return (
    <div className="flex min-w-[320px] flex-1 flex-col">
      {/* Column header */}
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

      {/* Column body */}
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
  const [kots, setKots] = useState<KOT[]>(MOCK_KOTS);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleAction = useCallback(
    (id: string, newStatus: KotStatus) => {
      setKots((prev) =>
        newStatus === "served"
          ? prev.filter((k) => k.id !== id)
          : prev.map((k) => (k.id === id ? { ...k, status: newStatus } : k))
      );

      // Play notification sound if enabled
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
    [soundEnabled]
  );

  const pendingKots = kots.filter((k) => k.status === "pending");
  const inProgressKots = kots.filter((k) => k.status === "in_progress");
  const readyKots = kots.filter((k) => k.status === "ready");

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
            {kots.length} active
          </Badge>
        </div>

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

      {/* Kanban columns */}
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
    </div>
  );
}
