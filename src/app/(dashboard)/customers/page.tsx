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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Users,
  Loader2,
} from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import {
  useCustomers,
  useCreateCustomer,
  useCustomerOrders,
} from "@/hooks/use-customers";

type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

function getTierBadge(tier: string) {
  const config: Record<string, { className: string }> = {
    bronze: { className: "" },
    silver: { className: "bg-slate-400 hover:bg-slate-400/80 text-white" },
    gold: { className: "bg-yellow-500 hover:bg-yellow-500/80 text-white" },
    platinum: { className: "bg-purple-600 hover:bg-purple-600/80 text-white" },
  };
  const c = config[tier] || config.bronze;
  return (
    <Badge className={c.className}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </Badge>
  );
}

function formatLastVisit(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CustomerExpandedRow({ customerId }: { customerId: string }) {
  const { data: orders, isLoading } = useCustomerOrders(customerId);

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="py-2 text-sm text-muted-foreground">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      {orders.slice(0, 5).map((order) => (
        <div
          key={order.id}
          className="flex justify-between rounded border bg-background p-3"
        >
          <span>
            Order #{order.order_number} &mdash;{" "}
            {order.order_items
              .map(
                (item) =>
                  `${item.quantity}x item`
              )
              .join(", ")}
          </span>
          <span className="font-medium text-foreground">
            {formatINR(order.total)}
          </span>
        </div>
      ))}
      {orders.length > 5 && (
        <p className="text-xs">+ {orders.length - 5} more orders</p>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: customers, isLoading } = useCustomers(
    tenantId,
    search || undefined
  );
  const createCustomer = useCreateCustomer();

  function handleAddCustomer(formData: FormData) {
    if (!tenantId) return;

    const preferences = formData.get("preferences") as string;
    createCustomer.mutate(
      {
        tenant_id: tenantId,
        name: (formData.get("name") as string) || "",
        phone: (formData.get("phone") as string) || null,
        email: (formData.get("email") as string) || null,
        date_of_birth: (formData.get("dob") as string) || null,
        preferences: preferences ? { notes: preferences } : {},
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      }
    );
  }

  const displayCustomers = customers ?? [];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and loyalty program
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddCustomer(new FormData(e.currentTarget));
            }}
          >
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to your CRM
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" name="dob" type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferences">Preferences</Label>
                <Textarea
                  id="preferences"
                  name="preferences"
                  placeholder="Dietary restrictions, favourite dishes, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createCustomer.isPending}
              >
                {createCustomer.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle>All Customers</CardTitle>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                className="w-72 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Last Visit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayCustomers.map((customer) => (
                  <>
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === customer.id ? null : customer.id
                        )
                      }
                    >
                      <TableCell>
                        {expandedId === customer.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell>{customer.phone ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.email ?? "-"}
                      </TableCell>
                      <TableCell>{customer.total_orders}</TableCell>
                      <TableCell>{formatINR(customer.total_spent)}</TableCell>
                      <TableCell>
                        {customer.loyalty_points.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getTierBadge(customer.loyalty_tier)}
                      </TableCell>
                      <TableCell>
                        {formatLastVisit(customer.last_visit_at)}
                      </TableCell>
                    </TableRow>
                    {expandedId === customer.id && (
                      <TableRow key={`${customer.id}-details`}>
                        <TableCell colSpan={9}>
                          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                            <h4 className="font-semibold text-sm">
                              Order History
                            </h4>
                            <CustomerExpandedRow customerId={customer.id} />
                            {customer.preferences &&
                              typeof customer.preferences === "object" &&
                              "notes" in (customer.preferences as object) && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">
                                    Preferences:{" "}
                                  </span>
                                  <span>
                                    {(customer.preferences as { notes?: string }).notes}
                                  </span>
                                </div>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No customers found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
