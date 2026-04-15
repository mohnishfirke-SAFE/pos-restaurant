"use client";

import { useMemo } from "react";
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
  Loader2,
} from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
import {
  useTodayAttendance,
  useClockIn,
  useClockOut,
} from "@/hooks/use-attendance";

type AttendanceStatus = "present" | "absent" | "late" | "on_leave";

interface EmployeeRecord {
  userId: string;
  displayName: string;
  role: string;
  status: AttendanceStatus;
  clockIn: string | null;
  clockOut: string | null;
  shiftId: string | null;
  hoursWorked: number | null;
}

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

function formatTime(isoString: string | null): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AttendancePage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const { activeBranchId } = useBranchStore();

  const tenantId = tenantUser?.tenant_id;
  const branchId = activeBranchId ?? tenantUser?.branch_id ?? undefined;

  const { data, isLoading: dataLoading } = useTodayAttendance(tenantId, branchId);
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const isLoading = authLoading || dataLoading;

  // Build per-employee records from attendance logs + shifts
  const records: EmployeeRecord[] = useMemo(() => {
    if (!data) return [];

    const attendance = data.attendance;
    const shifts = data.shifts;

    // Collect unique user IDs from shifts
    const userMap = new Map<
      string,
      {
        displayName: string;
        role: string;
        clockIn: string | null;
        clockOut: string | null;
        shiftId: string | null;
      }
    >();

    // Seed from shifts
    for (const shift of shifts) {
      if (!userMap.has(shift.user_id)) {
        userMap.set(shift.user_id, {
          displayName: "",
          role: "",
          clockIn: shift.clock_in_at,
          clockOut: shift.clock_out_at,
          shiftId: shift.id,
        });
      }
    }

    // Merge attendance log info (display_name, role)
    for (const log of attendance) {
      const existing = userMap.get(log.user_id);
      const displayName = log.tenant_users?.display_name ?? "";
      const role = log.tenant_users?.role ?? "";

      if (existing) {
        if (!existing.displayName) existing.displayName = displayName;
        if (!existing.role) existing.role = role;
        if (log.action === "clock_in" && !existing.clockIn) {
          existing.clockIn = log.timestamp;
        }
        if (log.action === "clock_out" && !existing.clockOut) {
          existing.clockOut = log.timestamp;
        }
      } else {
        userMap.set(log.user_id, {
          displayName,
          role,
          clockIn: log.action === "clock_in" ? log.timestamp : null,
          clockOut: log.action === "clock_out" ? log.timestamp : null,
          shiftId: null,
        });
      }
    }

    return Array.from(userMap.entries()).map(([userId, info]) => {
      const clockInTime = formatTime(info.clockIn);
      const clockOutTime = formatTime(info.clockOut);

      let status: AttendanceStatus = "absent";
      if (info.clockIn && info.clockOut) {
        status = "present";
      } else if (info.clockIn && !info.clockOut) {
        status = "present";
      }

      let hoursWorked: number | null = null;
      if (info.clockIn && info.clockOut) {
        hoursWorked =
          Math.round(
            ((new Date(info.clockOut).getTime() -
              new Date(info.clockIn).getTime()) /
              3600000) *
              100
          ) / 100;
      }

      return {
        userId,
        displayName: info.displayName || "Unknown",
        role: info.role || "-",
        status,
        clockIn: clockInTime,
        clockOut: clockOutTime,
        shiftId: info.shiftId,
        hoursWorked,
      };
    });
  }, [data]);

  const presentCount = records.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  function handleClockIn(record: EmployeeRecord) {
    if (!tenantId || !branchId || !record.shiftId) return;
    clockIn.mutate({
      tenantId,
      branchId,
      userId: record.userId,
      shiftId: record.shiftId,
    });
  }

  function handleClockOut(record: EmployeeRecord) {
    if (!tenantId || !branchId || !record.shiftId) return;
    clockOut.mutate({
      tenantId,
      branchId,
      userId: record.userId,
      shiftId: record.shiftId,
    });
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
                <TableRow key={record.userId}>
                  <TableCell className="font-medium">
                    {record.displayName}
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
                      {!record.clockIn && record.shiftId && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleClockIn(record)}
                          disabled={clockIn.isPending}
                        >
                          {clockIn.isPending ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <LogIn className="mr-1 h-4 w-4" />
                          )}
                          Clock In
                        </Button>
                      )}
                      {record.clockIn && !record.clockOut && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClockOut(record)}
                          disabled={clockOut.isPending}
                        >
                          {clockOut.isPending ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="mr-1 h-4 w-4" />
                          )}
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
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No shifts scheduled for today
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
