"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
  LogIn,
  LogOut,
  Clock,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

type AttendanceStatus = "present" | "absent" | "late" | "on_leave";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  status: AttendanceStatus;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number | null;
}

const initialRecords: AttendanceRecord[] = [
  {
    id: "att-1",
    employeeId: "emp-1",
    employeeName: "Arjun Mehta",
    role: "Admin",
    status: "present",
    clockIn: "09:02",
    clockOut: null,
    hoursWorked: null,
  },
  {
    id: "att-2",
    employeeId: "emp-2",
    employeeName: "Kavita Nair",
    role: "Manager",
    status: "present",
    clockIn: "08:15",
    clockOut: null,
    hoursWorked: null,
  },
  {
    id: "att-3",
    employeeId: "emp-3",
    employeeName: "Ravi Shankar",
    role: "Chef",
    status: "late",
    clockIn: "14:45",
    clockOut: null,
    hoursWorked: null,
  },
  {
    id: "att-4",
    employeeId: "emp-4",
    employeeName: "Deepa Joshi",
    role: "Cashier",
    status: "absent",
    clockIn: null,
    clockOut: null,
    hoursWorked: null,
  },
];

function getStatusBadge(status: AttendanceStatus) {
  const config: Record<AttendanceStatus, { label: string; className: string }> = {
    present: { label: "Present", className: "bg-green-600 hover:bg-green-600/80 text-white" },
    absent: { label: "Absent", className: "bg-red-600 hover:bg-red-600/80 text-white" },
    late: { label: "Late", className: "bg-yellow-600 hover:bg-yellow-600/80 text-white" },
    on_leave: { label: "On Leave", className: "bg-gray-500 hover:bg-gray-500/80 text-white" },
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function calculateHoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
  return Math.round(diff * 100) / 100;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);

  const presentCount = records.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  function handleClockIn(id: string) {
    const time = getCurrentTime();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, clockIn: time, status: "present" as AttendanceStatus }
          : r
      )
    );
  }

  function handleClockOut(id: string) {
    const time = getCurrentTime();
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id || !r.clockIn) return r;
        const hours = calculateHoursBetween(r.clockIn, time);
        return { ...r, clockOut: time, hoursWorked: hours };
      })
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Today&apos;s attendance - {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">employees scheduled today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {presentCount}
            </div>
            <p className="text-xs text-muted-foreground">clocked in today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {absentCount}
            </div>
            <p className="text-xs text-muted-foreground">not clocked in</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Today&apos;s Attendance</CardTitle>
              <CardDescription>
                Manage clock in and clock out for employees
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.employeeName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.role}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    {record.clockIn ? (
                      <span className="font-mono text-sm">{record.clockIn}</span>
                    ) : (
                      <span className="text-muted-foreground">--:--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.clockOut ? (
                      <span className="font-mono text-sm">{record.clockOut}</span>
                    ) : (
                      <span className="text-muted-foreground">--:--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.hoursWorked !== null ? (
                      <span className="font-medium">
                        {record.hoursWorked}h
                      </span>
                    ) : record.clockIn && !record.clockOut ? (
                      <span className="text-sm text-muted-foreground">
                        In progress
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!record.clockIn && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleClockIn(record.id)}
                        >
                          <LogIn className="mr-1 h-4 w-4" />
                          Clock In
                        </Button>
                      )}
                      {record.clockIn && !record.clockOut && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClockOut(record.id)}
                        >
                          <LogOut className="mr-1 h-4 w-4" />
                          Clock Out
                        </Button>
                      )}
                      {record.clockOut && (
                        <span className="text-sm text-muted-foreground py-1">
                          Shift complete
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
