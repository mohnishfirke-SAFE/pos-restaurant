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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Plus, Users, Clock, ShoppingCart } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";
type TableShape = "square" | "round" | "rectangle";

interface TableData {
  id: string;
  number: string;
  capacity: number;
  floor: string;
  shape: TableShape;
  status: TableStatus;
  // Occupied info
  currentOrderTotal?: number;
  occupiedSince?: string;
  // Reserved info
  reservationName?: string;
  reservationTime?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const FLOORS = ["Ground Floor", "Terrace"];

const MOCK_TABLES: TableData[] = [
  {
    id: "1",
    number: "T-1",
    capacity: 2,
    floor: "Ground Floor",
    shape: "square",
    status: "available",
  },
  {
    id: "2",
    number: "T-2",
    capacity: 4,
    floor: "Ground Floor",
    shape: "square",
    status: "occupied",
    currentOrderTotal: 1180,
    occupiedSince: "2026-04-06T12:30:00",
  },
  {
    id: "3",
    number: "T-3",
    capacity: 6,
    floor: "Ground Floor",
    shape: "rectangle",
    status: "reserved",
    reservationName: "Anita Desai",
    reservationTime: "7:00 PM",
  },
  {
    id: "4",
    number: "T-4",
    capacity: 4,
    floor: "Ground Floor",
    shape: "round",
    status: "occupied",
    currentOrderTotal: 850,
    occupiedSince: "2026-04-06T13:15:00",
  },
  {
    id: "5",
    number: "T-5",
    capacity: 2,
    floor: "Ground Floor",
    shape: "square",
    status: "cleaning",
  },
  {
    id: "6",
    number: "T-6",
    capacity: 8,
    floor: "Terrace",
    shape: "rectangle",
    status: "available",
  },
  {
    id: "7",
    number: "T-7",
    capacity: 4,
    floor: "Terrace",
    shape: "round",
    status: "occupied",
    currentOrderTotal: 620,
    occupiedSince: "2026-04-06T12:50:00",
  },
  {
    id: "8",
    number: "T-8",
    capacity: 2,
    floor: "Terrace",
    shape: "square",
    status: "reserved",
    reservationName: "Vikram Singh",
    reservationTime: "8:30 PM",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<
  TableStatus,
  { border: string; bg: string; label: string; badgeClass: string }
> = {
  available: {
    border: "border-green-400",
    bg: "bg-green-50 dark:bg-green-950/20",
    label: "Available",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  occupied: {
    border: "border-red-400",
    bg: "bg-red-50 dark:bg-red-950/20",
    label: "Occupied",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  reserved: {
    border: "border-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    label: "Reserved",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  cleaning: {
    border: "border-gray-400",
    bg: "bg-gray-50 dark:bg-gray-950/20",
    label: "Cleaning",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

function getElapsedTime(since: string): string {
  const diff = Date.now() - new Date(since).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainder = mins % 60;
  return `${hrs}h ${remainder}m`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TablesPage() {
  const [tables, setTables] = useState<TableData[]>(MOCK_TABLES);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeFloor, setActiveFloor] = useState(FLOORS[0]);

  const floorTables = tables.filter((t) => t.floor === activeFloor);

  // Summary counts
  const summary = {
    total: floorTables.length,
    available: floorTables.filter((t) => t.status === "available").length,
    occupied: floorTables.filter((t) => t.status === "occupied").length,
    reserved: floorTables.filter((t) => t.status === "reserved").length,
  };

  function handleAddTable(formData: FormData) {
    const newTable: TableData = {
      id: crypto.randomUUID(),
      number: formData.get("number") as string,
      capacity: parseInt(formData.get("capacity") as string, 10),
      floor: formData.get("floor") as string,
      shape: (formData.get("shape") as TableShape) || "square",
      status: "available",
    };
    setTables((prev) => [...prev, newTable]);
    setAddDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Floor Plan</h1>
          <p className="text-muted-foreground">
            Manage tables and track occupancy
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTable(new FormData(e.currentTarget));
              }}
            >
              <DialogHeader>
                <DialogTitle>Add Table</DialogTitle>
                <DialogDescription>
                  Add a new table to the floor plan
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="number">Table Number</Label>
                  <Input
                    id="number"
                    name="number"
                    placeholder="e.g. T-9"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={4}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Select name="floor" defaultValue={activeFloor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLOORS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shape">Shape</Label>
                  <Select name="shape" defaultValue="square">
                    <SelectTrigger>
                      <SelectValue placeholder="Select shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="round">Round</SelectItem>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Table</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Total Tables</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {summary.available}
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {summary.occupied}
            </div>
            <p className="text-xs text-muted-foreground">Occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {summary.reserved}
            </div>
            <p className="text-xs text-muted-foreground">Reserved</p>
          </CardContent>
        </Card>
      </div>

      {/* Floor tabs + Grid */}
      <Tabs value={activeFloor} onValueChange={setActiveFloor}>
        <TabsList>
          {FLOORS.map((f) => (
            <TabsTrigger key={f} value={f}>
              {f}
            </TabsTrigger>
          ))}
        </TabsList>

        {FLOORS.map((floor) => (
          <TabsContent key={floor} value={floor}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {tables
                .filter((t) => t.floor === floor)
                .map((table) => {
                  const style = STATUS_STYLES[table.status];
                  return (
                    <Card
                      key={table.id}
                      className={`cursor-pointer border-2 transition-shadow hover:shadow-md ${style.border} ${style.bg}`}
                      onClick={() => setSelectedTable(table)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">
                            {table.number}
                          </span>
                          <Badge
                            variant="outline"
                            className={style.badgeClass}
                          >
                            {style.label}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{table.capacity} seats</span>
                          {table.shape === "round" && (
                            <span className="ml-1 text-xs">(Round)</span>
                          )}
                          {table.shape === "rectangle" && (
                            <span className="ml-1 text-xs">(Rect)</span>
                          )}
                        </div>

                        {/* Occupied details */}
                        {table.status === "occupied" && (
                          <div className="mt-3 space-y-1">
                            {table.currentOrderTotal !== undefined && (
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <ShoppingCart className="h-3.5 w-3.5" />
                                {formatINR(table.currentOrderTotal)}
                              </div>
                            )}
                            {table.occupiedSince && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {getElapsedTime(table.occupiedSince)} elapsed
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reserved details */}
                        {table.status === "reserved" && (
                          <div className="mt-3 space-y-1">
                            {table.reservationName && (
                              <p className="text-sm font-medium">
                                {table.reservationName}
                              </p>
                            )}
                            {table.reservationTime && (
                              <p className="text-xs text-muted-foreground">
                                at {table.reservationTime}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Table Detail Dialog */}
      <Dialog
        open={selectedTable !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTable(null);
        }}
      >
        <DialogContent>
          {selectedTable && (() => {
            const style = STATUS_STYLES[selectedTable.status];
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Table {selectedTable.number}</DialogTitle>
                  <DialogDescription>
                    {selectedTable.capacity} seats &middot;{" "}
                    {selectedTable.floor} &middot;{" "}
                    {selectedTable.shape.charAt(0).toUpperCase() +
                      selectedTable.shape.slice(1)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge
                      variant="outline"
                      className={style.badgeClass}
                    >
                      {style.label}
                    </Badge>
                  </div>

                  {selectedTable.status === "occupied" && (
                    <div className="space-y-2 rounded-md border p-3">
                      <h4 className="text-sm font-medium">Current Order</h4>
                      {selectedTable.currentOrderTotal !== undefined && (
                        <p className="text-lg font-bold">
                          {formatINR(selectedTable.currentOrderTotal)}
                        </p>
                      )}
                      {selectedTable.occupiedSince && (
                        <p className="text-sm text-muted-foreground">
                          Seated for{" "}
                          {getElapsedTime(selectedTable.occupiedSince)}
                        </p>
                      )}
                      <Button className="mt-2 w-full" variant="outline">
                        View Order
                      </Button>
                    </div>
                  )}

                  {selectedTable.status === "reserved" && (
                    <div className="space-y-2 rounded-md border p-3">
                      <h4 className="text-sm font-medium">Reservation</h4>
                      {selectedTable.reservationName && (
                        <p className="text-sm">
                          {selectedTable.reservationName}
                        </p>
                      )}
                      {selectedTable.reservationTime && (
                        <p className="text-sm text-muted-foreground">
                          Reserved for {selectedTable.reservationTime}
                        </p>
                      )}
                      <Button className="mt-2 w-full">Seat Guest</Button>
                    </div>
                  )}

                  {selectedTable.status === "available" && (
                    <Button className="w-full">Start New Order</Button>
                  )}

                  {selectedTable.status === "cleaning" && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        This table is currently being cleaned.
                      </p>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          setTables((prev) =>
                            prev.map((t) =>
                              t.id === selectedTable.id
                                ? { ...t, status: "available" as TableStatus }
                                : t
                            )
                          );
                          setSelectedTable(null);
                        }}
                      >
                        Mark as Available
                      </Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
