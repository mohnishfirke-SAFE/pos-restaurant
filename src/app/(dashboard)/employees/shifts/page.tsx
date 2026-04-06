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
import { Plus, CalendarDays, List } from "lucide-react";

type ShiftStatus = "scheduled" | "clocked_in" | "clocked_out" | "absent";

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  hoursWorked: number | null;
}

const employees = [
  { id: "emp-1", name: "Arjun Mehta" },
  { id: "emp-2", name: "Kavita Nair" },
  { id: "emp-3", name: "Ravi Shankar" },
  { id: "emp-4", name: "Deepa Joshi" },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekDates = [
  "2026-04-06",
  "2026-04-07",
  "2026-04-08",
  "2026-04-09",
  "2026-04-10",
  "2026-04-11",
  "2026-04-12",
];

const initialShifts: Shift[] = [
  {
    id: "s1",
    employeeId: "emp-1",
    employeeName: "Arjun Mehta",
    date: "2026-04-06",
    startTime: "09:00",
    endTime: "17:00",
    status: "clocked_in",
    hoursWorked: null,
  },
  {
    id: "s2",
    employeeId: "emp-2",
    employeeName: "Kavita Nair",
    date: "2026-04-06",
    startTime: "10:00",
    endTime: "18:00",
    status: "clocked_in",
    hoursWorked: null,
  },
  {
    id: "s3",
    employeeId: "emp-3",
    employeeName: "Ravi Shankar",
    date: "2026-04-06",
    startTime: "14:00",
    endTime: "22:00",
    status: "scheduled",
    hoursWorked: null,
  },
  {
    id: "s4",
    employeeId: "emp-4",
    employeeName: "Deepa Joshi",
    date: "2026-04-06",
    startTime: "09:00",
    endTime: "17:00",
    status: "absent",
    hoursWorked: null,
  },
  {
    id: "s5",
    employeeId: "emp-1",
    employeeName: "Arjun Mehta",
    date: "2026-04-07",
    startTime: "09:00",
    endTime: "17:00",
    status: "scheduled",
    hoursWorked: null,
  },
  {
    id: "s6",
    employeeId: "emp-2",
    employeeName: "Kavita Nair",
    date: "2026-04-07",
    startTime: "10:00",
    endTime: "18:00",
    status: "scheduled",
    hoursWorked: null,
  },
  {
    id: "s7",
    employeeId: "emp-3",
    employeeName: "Ravi Shankar",
    date: "2026-04-07",
    startTime: "14:00",
    endTime: "22:00",
    status: "scheduled",
    hoursWorked: null,
  },
  {
    id: "s8",
    employeeId: "emp-1",
    employeeName: "Arjun Mehta",
    date: "2026-04-08",
    startTime: "09:00",
    endTime: "17:00",
    status: "scheduled",
    hoursWorked: null,
  },
  {
    id: "s9",
    employeeId: "emp-2",
    employeeName: "Kavita Nair",
    date: "2026-04-09",
    startTime: "10:00",
    endTime: "18:00",
    status: "scheduled",
    hoursWorked: null,
  },
  {
    id: "s10",
    employeeId: "emp-3",
    employeeName: "Ravi Shankar",
    date: "2026-04-10",
    startTime: "14:00",
    endTime: "22:00",
    status: "scheduled",
    hoursWorked: null,
  },
  {
    id: "s11",
    employeeId: "emp-4",
    employeeName: "Deepa Joshi",
    date: "2026-04-11",
    startTime: "09:00",
    endTime: "17:00",
    status: "scheduled",
    hoursWorked: null,
  },
  {
    id: "s12",
    employeeId: "emp-1",
    employeeName: "Arjun Mehta",
    date: "2026-04-05",
    startTime: "09:00",
    endTime: "17:00",
    status: "clocked_out",
    hoursWorked: 8,
  },
];

function getStatusBadge(status: ShiftStatus) {
  const config: Record<ShiftStatus, { label: string; className: string }> = {
    scheduled: { label: "Scheduled", className: "bg-blue-600 hover:bg-blue-600/80 text-white" },
    clocked_in: { label: "Clocked In", className: "bg-green-600 hover:bg-green-600/80 text-white" },
    clocked_out: { label: "Clocked Out", className: "bg-gray-500 hover:bg-gray-500/80 text-white" },
    absent: { label: "Absent", className: "bg-red-600 hover:bg-red-600/80 text-white" },
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}

function calculateHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  function handleAddShift(formData: FormData) {
    const employeeId = formData.get("employee") as string;
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;

    const newShift: Shift = {
      id: crypto.randomUUID(),
      employeeId,
      employeeName: employee.name,
      date: formData.get("date") as string,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      status: "scheduled",
      hoursWorked: null,
    };
    setShifts((prev) => [...prev, newShift]);
    setDialogOpen(false);
  }

  function getShiftsForCell(date: string, employeeId: string) {
    return shifts.filter(
      (s) => s.date === date && s.employeeId === employeeId
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddShift(new FormData(e.currentTarget));
            }}
          >
            <DialogHeader>
              <DialogTitle>Add Shift</DialogTitle>
              <DialogDescription>
                Schedule a new shift for an employee
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="employee">Employee</Label>
                <Select name="employee" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" name="startTime" type="time" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" name="endTime" type="time" required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Shift</Button>
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
              <CardTitle>Weekly Schedule (Apr 6 - Apr 12, 2026)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Employee</TableHead>
                      {weekDays.map((day, i) => (
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
                    {employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">
                          {emp.name}
                        </TableCell>
                        {weekDates.map((date) => {
                          const cellShifts = getShiftsForCell(date, emp.id);
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
                                        {s.startTime} - {s.endTime}
                                      </div>
                                      {getStatusBadge(s.status)}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...shifts]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.date}</TableCell>
                        <TableCell className="font-medium">
                          {shift.employeeName}
                        </TableCell>
                        <TableCell>{shift.startTime}</TableCell>
                        <TableCell>{shift.endTime}</TableCell>
                        <TableCell>{getStatusBadge(shift.status)}</TableCell>
                        <TableCell>
                          {shift.hoursWorked !== null
                            ? `${shift.hoursWorked}h`
                            : shift.status === "clocked_in"
                            ? "In progress"
                            : shift.status === "scheduled"
                            ? `${calculateHours(shift.startTime, shift.endTime)}h (planned)`
                            : "-"}
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
