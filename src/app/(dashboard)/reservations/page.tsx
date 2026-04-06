"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  CalendarDays,
  List,
  Users,
  Phone,
  Mail,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  email?: string;
  partySize: number;
  date: string;
  time: string;
  duration: number; // minutes
  table: string | null;
  status: ReservationStatus;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: "1",
    guestName: "Anita Desai",
    phone: "+91 98765 43210",
    email: "anita.desai@email.com",
    partySize: 4,
    date: "2026-04-06",
    time: "19:00",
    duration: 90,
    table: "T-3",
    status: "confirmed",
    notes: "Anniversary dinner, window seat preferred",
  },
  {
    id: "2",
    guestName: "Vikram Singh",
    phone: "+91 87654 32109",
    partySize: 2,
    date: "2026-04-06",
    time: "20:30",
    duration: 60,
    table: "T-8",
    status: "pending",
  },
  {
    id: "3",
    guestName: "Meera Iyer",
    phone: "+91 76543 21098",
    email: "meera@company.com",
    partySize: 8,
    date: "2026-04-06",
    time: "13:00",
    duration: 120,
    table: "T-6",
    status: "seated",
    notes: "Business lunch, need projector setup",
  },
  {
    id: "4",
    guestName: "Rajesh Kumar",
    phone: "+91 65432 10987",
    partySize: 3,
    date: "2026-04-05",
    time: "19:30",
    duration: 90,
    table: "T-1",
    status: "no_show",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  seated: {
    label: "Seated",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  no_show: {
    label: "No Show",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

type ViewMode = "list" | "calendar";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReservationsPage() {
  const [reservations, setReservations] =
    useState<Reservation[]>(MOCK_RESERVATIONS);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = reservations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.guestName.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.table?.toLowerCase().includes(q)
    );
  });

  // Group reservations by date for calendar view
  const groupedByDate = filtered.reduce<Record<string, Reservation[]>>(
    (acc, r) => {
      if (!acc[r.date]) acc[r.date] = [];
      acc[r.date].push(r);
      return acc;
    },
    {}
  );
  const sortedDates = Object.keys(groupedByDate).sort();

  function handleCreateReservation(formData: FormData) {
    const newReservation: Reservation = {
      id: crypto.randomUUID(),
      guestName: formData.get("guestName") as string,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || undefined,
      partySize: parseInt(formData.get("partySize") as string, 10),
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      duration: parseInt(formData.get("duration") as string, 10) || 90,
      table: null,
      status: "pending",
      notes: (formData.get("notes") as string) || undefined,
    };
    setReservations((prev) => [...prev, newReservation]);
    setDialogOpen(false);
  }

  // Summary
  const todayStr = "2026-04-06";
  const todayReservations = reservations.filter((r) => r.date === todayStr);
  const upcomingCount = todayReservations.filter((r) =>
    ["pending", "confirmed"].includes(r.status)
  ).length;
  const seatedCount = todayReservations.filter(
    (r) => r.status === "seated"
  ).length;
  const totalGuests = todayReservations
    .filter((r) => ["pending", "confirmed", "seated"].includes(r.status))
    .reduce((s, r) => s + r.partySize, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">
            Manage guest reservations and bookings
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateReservation(new FormData(e.currentTarget));
              }}
            >
              <DialogHeader>
                <DialogTitle>New Reservation</DialogTitle>
                <DialogDescription>
                  Book a table for a guest
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input
                    id="guestName"
                    name="guestName"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="partySize">Party Size</Label>
                    <Input
                      id="partySize"
                      name="partySize"
                      type="number"
                      min={1}
                      max={20}
                      defaultValue={2}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Select name="duration" defaultValue="90">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">120 min</SelectItem>
                        <SelectItem value="180">180 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      defaultValue={todayStr}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      defaultValue="19:00"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Special requests, dietary requirements, etc."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Reservation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upcoming</span>
            </div>
            <div className="mt-1 text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Seated Now
              </span>
            </div>
            <div className="mt-1 text-2xl font-bold">{seatedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Expected Guests
              </span>
            </div>
            <div className="mt-1 text-2xl font-bold">{totalGuests}</div>
          </CardContent>
        </Card>
      </div>

      {/* View toggle & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reservations..."
            className="w-64 pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>
              All Reservations
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
                    <TableHead>Guest Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Party Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const statusInfo = STATUS_CONFIG[r.status];
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.guestName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.phone}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.partySize}
                        </TableCell>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell>{formatTime(r.time)}</TableCell>
                        <TableCell>{r.table ?? "Unassigned"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusInfo.className}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>No reservations match the current search.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          {sortedDates.length > 0 ? (
            sortedDates.map((date) => (
              <Card key={date}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {formatDate(date)}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({groupedByDate[date].length} reservation
                      {groupedByDate[date].length !== 1 ? "s" : ""})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupedByDate[date]
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((r) => {
                        const statusInfo = STATUS_CONFIG[r.status];
                        return (
                          <div
                            key={r.id}
                            className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {formatTime(r.time)}
                                </span>
                                <span className="text-muted-foreground">
                                  &middot;
                                </span>
                                <span className="font-medium">
                                  {r.guestName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={statusInfo.className}
                                >
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {r.partySize} guests
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {r.phone}
                                </span>
                                {r.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {r.email}
                                  </span>
                                )}
                              </div>
                              {r.notes && (
                                <p className="text-sm italic text-muted-foreground">
                                  {r.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="whitespace-nowrap text-muted-foreground">
                                {r.table ?? "No table"}
                              </span>
                              <span className="text-muted-foreground">
                                &middot;
                              </span>
                              <span className="whitespace-nowrap text-muted-foreground">
                                {r.duration} min
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No reservations match the current search.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
