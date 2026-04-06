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
import { Plus, Search, ChevronDown, ChevronRight, Users } from "lucide-react";

type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  preferences: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  tier: LoyaltyTier;
  lastVisit: string;
}

const mockCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    dob: "1985-06-15",
    preferences: "Prefers non-veg, no peanuts",
    totalOrders: 48,
    totalSpent: 24560,
    loyaltyPoints: 2456,
    tier: "platinum",
    lastVisit: "2026-04-05",
  },
  {
    id: "cust-2",
    name: "Priya Sharma",
    phone: "+91 91234 56789",
    email: "priya.sharma@email.com",
    dob: "1992-11-22",
    preferences: "Vegetarian, prefers mild spice",
    totalOrders: 32,
    totalSpent: 15800,
    loyaltyPoints: 1580,
    tier: "gold",
    lastVisit: "2026-04-03",
  },
  {
    id: "cust-3",
    name: "Amit Patel",
    phone: "+91 87654 32100",
    email: "amit.patel@email.com",
    dob: "1990-03-08",
    preferences: "Loves biryani specials",
    totalOrders: 18,
    totalSpent: 8900,
    loyaltyPoints: 890,
    tier: "silver",
    lastVisit: "2026-03-29",
  },
  {
    id: "cust-4",
    name: "Sneha Reddy",
    phone: "+91 76543 21098",
    email: "sneha.r@email.com",
    dob: "1988-09-14",
    preferences: "Gluten free options",
    totalOrders: 8,
    totalSpent: 3200,
    loyaltyPoints: 320,
    tier: "bronze",
    lastVisit: "2026-03-20",
  },
  {
    id: "cust-5",
    name: "Vikram Singh",
    phone: "+91 65432 10987",
    email: "vikram.s@email.com",
    dob: "1995-01-30",
    preferences: "Regular lunch customer",
    totalOrders: 25,
    totalSpent: 11200,
    loyaltyPoints: 1120,
    tier: "gold",
    lastVisit: "2026-04-06",
  },
];

function getTierBadge(tier: LoyaltyTier) {
  const config: Record<LoyaltyTier, { className: string }> = {
    bronze: { className: "" },
    silver: { className: "bg-slate-400 hover:bg-slate-400/80 text-white" },
    gold: { className: "bg-yellow-500 hover:bg-yellow-500/80 text-white" },
    platinum: { className: "bg-purple-600 hover:bg-purple-600/80 text-white" },
  };
  return (
    <Badge className={config[tier].className}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </Badge>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  function handleAddCustomer(formData: FormData) {
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      dob: formData.get("dob") as string,
      preferences: formData.get("preferences") as string,
      totalOrders: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      tier: "bronze",
      lastVisit: "-",
    };
    setCustomers((prev) => [...prev, newCustomer]);
    setDialogOpen(false);
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
              <Button type="submit">Add Customer</Button>
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
          {filteredCustomers.length > 0 ? (
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
                {filteredCustomers.map((customer) => (
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
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.email}
                      </TableCell>
                      <TableCell>{customer.totalOrders}</TableCell>
                      <TableCell>{formatINR(customer.totalSpent)}</TableCell>
                      <TableCell>{customer.loyaltyPoints.toLocaleString()}</TableCell>
                      <TableCell>{getTierBadge(customer.tier)}</TableCell>
                      <TableCell>{customer.lastVisit}</TableCell>
                    </TableRow>
                    {expandedId === customer.id && (
                      <TableRow key={`${customer.id}-details`}>
                        <TableCell colSpan={9}>
                          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                            <h4 className="font-semibold text-sm">
                              Order History
                            </h4>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex justify-between rounded border bg-background p-3">
                                <span>Order #1042 - Chicken Biryani x2, Butter Naan x4</span>
                                <span className="font-medium text-foreground">{formatINR(860)}</span>
                              </div>
                              <div className="flex justify-between rounded border bg-background p-3">
                                <span>Order #1038 - Paneer Butter Masala, Jeera Rice</span>
                                <span className="font-medium text-foreground">{formatINR(420)}</span>
                              </div>
                              <div className="flex justify-between rounded border bg-background p-3">
                                <span>Order #1025 - Veg Thali, Mango Lassi x2</span>
                                <span className="font-medium text-foreground">{formatINR(350)}</span>
                              </div>
                            </div>
                            {customer.preferences && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">
                                  Preferences:{" "}
                                </span>
                                <span>{customer.preferences}</span>
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
