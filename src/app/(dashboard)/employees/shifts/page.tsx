"use client";

import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CalendarDays, List, Loader2 } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import {
  useShifts,
  useCreateShift,
  useDeleteShift,
  useEmployeesForSelect,
} from "@/hooks/use-shifts";

type ShiftStatus = "scheduled" | "clocked_in" | "clocked_out" | "completed" | "cancelled";

function getStatusBadge(status: ShiftStatus) {
  const config: Record<ShiftStatus, { label: string; className: string }> = {
    scheduled: { label: "Scheduled", className: "bg-blue-600 hover:bg-blue-600/80 text-white" },
    clocked_in: { label: "Clocked In", className: "bg-green-600 hover:bg-green-600/80 text-white" },
    clocked_out: { label: "Clocked Out", className: "bg-gray-500 hover:bg-gray-500/80 text-white" },
    completed: { label: "Completed", className: "bg-emerald-700 hover:bg-emerald-700/80 text-white" },
    cancelled: { label: "Cancelled", className: "bg-red-600 hover:bg-red-600/80 text-white" },
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}

function calculateHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export default function ShiftsPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const { activeBranchId } = useBranchStore();

  const tenantId = tenantUser?.tenant_id;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? undefined;

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Form state
  const [formEmployee, setFormEmployee] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");

  const { data: shifts, isLoading: shiftsLoading } = useShifts(tenantId, branchId, weekStart);
  const { data: employees, isLoading: employeesLoading } = useEmployeesForSelect(tenantId);
  const createShift = useCreateShift();
  const deleteShift = useDeleteShift();

  const weekDates = useMemo(() => {
    const start = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekStart]);

  const weekDayLabels = useMemo(() => {
    return weekDates.map((d) => {
      const date = new Date(d + "T00:00:00");
      return date.toLocaleDateString("en-US", { weekday: "short" });
    });
  }, [weekDates]);

  const isLoading = authLoading || shiftsLoading || employeesLoading;

  function handleAddShift(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !branchId || !formEmployee || !formDate || !formStartTime || !formEndTime) return;

    createShift.mutate(
      {
        tenant_id: tenantId,
        branch_id: branchId,
        user_id: formEmployee,
        shift_date: formDate,
        start_time: formStartTime,
        end_time: formEndTime,
        status: "scheduled",
        break_minutes: null,
        notes: null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setFormEmployee("");
          setFormDate("");
          setFormStartTime("");
          setFormEndTime("");
        },
      }
    );
  }

  function getShiftsForCell(date: string, userId: string) {
    return (shifts ?? []).filter(
      (s) => s.shift_date === date && s.user_id === userId
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shift Schedule</h1>
          <p className="text-muted-foreground">
            Plan and manage employee shifts
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Shift
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddShift}>
            <DialogHeader>
              <DialogTitle>Add Shift</DialogTitle>
              <DialogDescription>
                Schedule a new shift for an employee
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="employee">Employee</Label>
                <Select value={formEmployee} onValueChange={setFormEmployee} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {(employees ?? []).map((emp) => (
                      <SelectItem key={emp.id} value={emp.user_id}>
                        {emp.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  type="date"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    type="time"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    type="time"
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createShift.isPending}>
                {createShift.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs
        value={view}
        onValueChange={(v) => setView(v as "calendar" | "list")}
      >
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>
                Weekly Schedule ({weekDates[0]} to {weekDates[6]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Employee</TableHead>
                      {weekDayLabels.map((day, i) => (
                        <TableHead key={day} className="min-w-[130px] text-center">
                          <div>{day}</div>
                          <div className="text-xs font-normal text-muted-foreground">
                            {weekDates[i]}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(employees ?? []).map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">
                          {emp.display_name}
                        </TableCell>
                        {weekDates.map((date) => {
                          const cellShifts = getShiftsForCell(date, emp.user_id);
                          return (
                            <TableCell key={date} className="text-center">
                              {cellShifts.length > 0 ? (
                                <div className="space-y-1">
                                  {cellShifts.map((s) => (
                                    <div
                                      key={s.id}
                                      className="rounded border p-1.5 text-xs space-y-1"
                                    >
                                      <div className="font-medium">
                                        {s.start_time} - {s.end_time}
                                      </div>
                                      {getStatusBadge(s.status as ShiftStatus)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  --
                                </span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hours Worked</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(shifts ?? [])]
                    .sort((a, b) => b.shift_date.localeCompare(a.shift_date))
                    .map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.shift_date}</TableCell>
                        <TableCell className="font-medium">
                          {shift.tenant_users?.display_name ?? "Unknown"}
                        </TableCell>
                        <TableCell>{shift.start_time}</TableCell>
                        <TableCell>{shift.end_time}</TableCell>
                        <TableCell>{getStatusBadge(shift.status as ShiftStatus)}</TableCell>
                        <TableCell>
                          {shift.clock_in_at && shift.clock_out_at
                            ? `${(
                                (new Date(shift.clock_out_at).getTime() -
                                  new Date(shift.clock_in_at).getTime()) /
                                3600000
                              ).toFixed(1)}h`
                            : shift.status === "clocked_in"
                            ? "In progress"
                            : shift.status === "scheduled"
                            ? `${calculateHours(shift.start_time, shift.end_time)}h (planned)`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteShift.mutate(shift.id)}
                            disabled={deleteShift.isPending}
                          >
                            <span className="text-red-500 text-xs">x</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
