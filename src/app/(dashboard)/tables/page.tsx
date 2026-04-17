"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import { Plus, Users, Clock, ShoppingCart, Trash2, Loader2, Wrench, Banknote } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import { useTables, useCreateTable, useUpdateTableStatus, useDeleteTable } from "@/hooks/use-tables";
import { useSettleBill } from "@/hooks/use-billing";
import { PaymentDialog } from "@/components/shared/payment-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TableStatus = "available" | "occupied" | "reserved" | "cleaning" | "blocked";

type TableShape = "square" | "round" | "rectangle";

interface OrderJoin {
  id: string;
  total: number;
  created_at: string;
}

interface TableData {
  id: string;
  table_number: string;
  capacity: number;
  floor: string;
  shape: string;
  status: TableStatus;
  current_order_id: string | null;
  orders: OrderJoin[] | null;
}

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
  blocked: {
    border: "border-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    label: "Inactive",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

/** Normalize the orders join — use current_order_id to find the right order */
function getOrderMeta(
  orders: OrderJoin[] | null | undefined,
  currentOrderId: string | null
): {
  total: number | null;
  createdAt: string | null;
} {
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return { total: null, createdAt: null };
  }
  // Find the current order by ID, or fall back to the first order
  const current = currentOrderId
    ? orders.find((o) => o.id === currentOrderId)
    : orders[0];
  if (!current) return { total: null, createdAt: null };
  return { total: current.total, createdAt: current.created_at };
}

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

const ALL_FLOORS = ["Ground Floor", "First Floor", "Second Floor"];

export default function TablesPage() {
  const router = useRouter();
  const { tenantUser, loading: tenantLoading } = useTenantUser();
  const { activeBranchId } = useBranchStore();

  const branchId = tenantUser?.branch_id || activeBranchId;
  const tenantId = tenantUser?.tenant_id ?? null;

  const { data: tables = [], isLoading, error: tablesError } = useTables(tenantId, branchId);
  const createTable = useCreateTable();
  const updateTableStatus = useUpdateTableStatus();
  const deleteTable = useDeleteTable();

  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);

  const settleBill = useSettleBill();

  // Compute order meta for selected table (used in detail dialog + settle dialog)
  const selectedOrderMeta = useMemo(() => {
    if (!selectedTable) return { total: null, createdAt: null };
    return getOrderMeta(selectedTable.orders, selectedTable.current_order_id);
  }, [selectedTable]);

  // Use ALL_FLOORS as the base, include any custom floors from existing data
  const floors = useMemo(() => {
    const customFloors = tables.length
      ? [...new Set(tables.map((t) => t.floor))].filter((f) => !ALL_FLOORS.includes(f))
      : [];
    return [...ALL_FLOORS, ...customFloors];
  }, [tables]);

  const [activeFloor, setActiveFloor] = useState(floors[0]);

  // Reset active floor when floors change and current is no longer valid
  useMemo(() => {
    if (!floors.includes(activeFloor)) {
      setActiveFloor(floors[0]);
    }
  }, [floors, activeFloor]);

  const floorTables = tables.filter((t) => t.floor === activeFloor);

  // Summary counts
  const summary = {
    total: floorTables.length,
    available: floorTables.filter((t) => t.status === "available").length,
    occupied: floorTables.filter((t) => t.status === "occupied").length,
    reserved: floorTables.filter((t) => t.status === "reserved").length,
  };

  function handleAddTable(formData: FormData) {
    if (!tenantId || !branchId) return;

    const table_number = formData.get("number") as string;
    const capacity = parseInt(formData.get("capacity") as string, 10);
    const floor = formData.get("floor") as string;
    const shape = (formData.get("shape") as string) || "square";

    createTable.mutate(
      {
        tenant_id: tenantId,
        branch_id: branchId,
        table_number,
        capacity,
        floor,
        shape,
        status: "available",
        is_active: true,
      },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
        },
      }
    );
  }

  function handleStartOrder(table: TableData) {
    const id = table.id;
    router.push(`/pos?tableId=${encodeURIComponent(id)}&orderType=dine_in`);
    setSelectedTable(null);
  }

  // Loading state
  if (isLoading || tenantLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-lg text-muted-foreground">Loading tables...</span>
      </div>
    );
  }

  // Error state
  if (tablesError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-lg font-medium text-destructive">Failed to load tables</p>
        <p className="text-sm text-muted-foreground">{tablesError.message}</p>
      </div>
    );
  }

  // No branch selected
  if (!branchId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">No branch selected</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please select a branch to view tables.
        </p>
      </div>
    );
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
                      {ALL_FLOORS.map((f) => (
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
                <Button type="submit" disabled={createTable.isPending}>
                  {createTable.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {createTable.error ? "Retry" : "Add Table"}
                </Button>
                {createTable.error && (
                  <p className="text-xs text-destructive">
                    {createTable.error.message}
                  </p>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {floorTables.filter((t) => t.status === "blocked").length}
            </div>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Floor tabs + Grid */}
      <Tabs value={activeFloor} onValueChange={setActiveFloor}>
        <TabsList>
          {floors.map((f) => (
            <TabsTrigger key={f} value={f}>
              {f}
            </TabsTrigger>
          ))}
        </TabsList>

        {floors.map((floor) => (
          <TabsContent key={floor} value={floor}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {tables
                .filter((t) => t.floor === floor)
                .map((table) => {
                  const status = (table.status || "available") as TableStatus;
                  const style = STATUS_STYLES[status] || STATUS_STYLES.available;
                  const { total: currentOrderTotal, createdAt: occupiedSince } = getOrderMeta(table.orders, table.current_order_id);
                  return (
                    <Card
                      key={table.id}
                      className={`cursor-pointer border-2 transition-shadow hover:shadow-md ${style.border} ${style.bg}`}
                      onClick={() => setSelectedTable(table as unknown as TableData)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">
                            {table.table_number}
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
                            {currentOrderTotal !== null && (
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <ShoppingCart className="h-3.5 w-3.5" />
                                {formatINR(currentOrderTotal)}
                              </div>
                            )}
                            {occupiedSince && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {getElapsedTime(occupiedSince)} elapsed
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reserved details */}
                        {table.status === "reserved" && (
                          <div className="mt-3 space-y-1">
                            <p className="text-sm text-muted-foreground italic">
                              Reserved
                            </p>
                          </div>
                        )}

                        {/* Inactive / Maintenance details */}
                        {table.status === "blocked" && (
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-1 text-sm text-purple-600">
                              <Wrench className="h-3.5 w-3.5" />
                              <span className="italic">Under maintenance</span>
                            </div>
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
            const status = (selectedTable.status || "available") as TableStatus;
            const style = STATUS_STYLES[status] || STATUS_STYLES.available;
            const { total: currentOrderTotal, createdAt: occupiedSince } = selectedOrderMeta;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Table {selectedTable.table_number}</DialogTitle>
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
                      {currentOrderTotal !== null && (
                        <p className="text-lg font-bold">
                          {formatINR(currentOrderTotal)}
                        </p>
                      )}
                      {occupiedSince && (
                        <p className="text-sm text-muted-foreground">
                          Seated for{" "}
                          {getElapsedTime(occupiedSince)}
                        </p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => {
                            router.push("/orders");
                            setSelectedTable(null);
                          }}
                        >
                          View Order
                        </Button>
                        <Button
                          className="flex-1 gap-1.5"
                          disabled={!selectedTable.current_order_id || currentOrderTotal === null}
                          onClick={() => setSettleDialogOpen(true)}
                        >
                          <Banknote className="h-4 w-4" />
                          Settle Bill
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedTable.status === "reserved" && (
                    <div className="space-y-2 rounded-md border p-3">
                      <h4 className="text-sm font-medium">Reservation</h4>
                      <p className="text-sm text-muted-foreground">
                        This table is currently reserved.
                      </p>
                      <Button
                        className="mt-2 w-full"
                        onClick={() => {
                          updateTableStatus.mutate({
                            id: selectedTable.id,
                            status: "occupied",
                          });
                          setSelectedTable(null);
                        }}
                      >
                        Seat Guest
                      </Button>
                    </div>
                  )}

                  {(selectedTable.status === "available" || !selectedTable.status) && (
                    <Button
                      className="w-full"
                      onClick={() => handleStartOrder(selectedTable)}
                    >
                      Start New Order
                    </Button>
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
                          updateTableStatus.mutate({
                            id: selectedTable.id,
                            status: "available",
                          });
                          setSelectedTable(null);
                        }}
                      >
                        Mark as Available
                      </Button>
                    </div>
                  )}

                  {/* Mark as Inactive / Maintenance */}
                  {selectedTable.status === "blocked" ? (
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={() => {
                        updateTableStatus.mutate({
                          id: selectedTable.id,
                          status: "available",
                        });
                        setSelectedTable(null);
                      }}
                    >
                      Reactivate Table
                    </Button>
                  ) : selectedTable.status !== "occupied" ? (
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={() => {
                        updateTableStatus.mutate({
                          id: selectedTable.id,
                          status: "blocked",
                        });
                        setSelectedTable(null);
                      }}
                    >
                      <Wrench className="h-4 w-4" />
                      Mark Inactive / Maintenance
                    </Button>
                  ) : null}
                </div>

                {/* Delete table */}
                <div className="mt-4 border-t pt-4">
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={selectedTable.status === "occupied"}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Table
                  </Button>
                  {selectedTable.status === "occupied" && (
                    <p className="mt-1 text-xs text-muted-foreground text-center">
                      Cannot delete while occupied
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table {selectedTable?.table_number}?</DialogTitle>
            <DialogDescription>
              This will remove the table from the floor plan. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteTable.isPending}
              onClick={() => {
                if (selectedTable) {
                  deleteTable.mutate(selectedTable.id, {
                    onSuccess: () => {
                      setDeleteConfirmOpen(false);
                      setSelectedTable(null);
                    },
                  });
                }
              }}
            >
              {deleteTable.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle Bill Dialog */}
      {selectedTable?.status === "occupied" &&
        selectedTable.current_order_id &&
        selectedOrderMeta.total !== null && (
          <PaymentDialog
            open={settleDialogOpen}
            onOpenChange={setSettleDialogOpen}
            total={selectedOrderMeta.total}
            loading={settleBill.isPending}
            onComplete={(method) => {
              if (!tenantUser || !branchId) return;
              settleBill.mutate(
                {
                  order_id: selectedTable.current_order_id!,
                  tenant_id: tenantUser.tenant_id,
                  branch_id: branchId,
                  method,
                  amount: selectedOrderMeta.total!,
                  user_id: tenantUser.user_id,
                },
                {
                  onSuccess: () => {
                    setSettleDialogOpen(false);
                    setSelectedTable(null);
                  },
                  onError: (err) => {
                    alert(err.message || "Failed to settle bill");
                  },
                }
              );
            }}
          />
        )}
    </div>
  );
}
