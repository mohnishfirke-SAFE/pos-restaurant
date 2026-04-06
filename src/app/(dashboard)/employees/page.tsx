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
import { Plus, Search, UserPlus } from "lucide-react";

type Role = "admin" | "manager" | "cashier" | "chef" | "waiter";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  branch: string;
  status: "active" | "inactive";
  lastLogin: string;
}

const mockEmployees: Employee[] = [
  {
    id: "emp-1",
    name: "Arjun Mehta",
    email: "arjun.m@restaurant.com",
    phone: "+91 98765 11111",
    role: "admin",
    branch: "Main Branch",
    status: "active",
    lastLogin: "2026-04-06 09:30",
  },
  {
    id: "emp-2",
    name: "Kavita Nair",
    email: "kavita.n@restaurant.com",
    phone: "+91 98765 22222",
    role: "manager",
    branch: "Main Branch",
    status: "active",
    lastLogin: "2026-04-06 08:15",
  },
  {
    id: "emp-3",
    name: "Ravi Shankar",
    email: "ravi.s@restaurant.com",
    phone: "+91 98765 33333",
    role: "chef",
    branch: "Main Branch",
    status: "active",
    lastLogin: "2026-04-05 18:00",
  },
  {
    id: "emp-4",
    name: "Deepa Joshi",
    email: "deepa.j@restaurant.com",
    phone: "+91 98765 44444",
    role: "cashier",
    branch: "Downtown Outlet",
    status: "inactive",
    lastLogin: "2026-03-28 14:20",
  },
];

const branches = ["Main Branch", "Downtown Outlet", "Mall Kiosk"];

function getRoleBadge(role: Role) {
  const config: Record<Role, { className: string }> = {
    admin: { className: "bg-red-600 hover:bg-red-600/80 text-white" },
    manager: { className: "bg-blue-600 hover:bg-blue-600/80 text-white" },
    cashier: { className: "bg-green-600 hover:bg-green-600/80 text-white" },
    chef: { className: "bg-orange-600 hover:bg-orange-600/80 text-white" },
    waiter: { className: "bg-purple-600 hover:bg-purple-600/80 text-white" },
  };
  return (
    <Badge className={config[role].className}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleInviteEmployee(formData: FormData) {
    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as Role,
      branch: formData.get("branch") as string,
      status: "active",
      lastLogin: "-",
    };
    setEmployees((prev) => [...prev, newEmployee]);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your restaurant staff
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Employee
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInviteEmployee(new FormData(e.currentTarget));
            }}
          >
            <DialogHeader>
              <DialogTitle>Invite Employee</DialogTitle>
              <DialogDescription>
                Send an invitation to a new team member
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                      <SelectItem value="waiter">Waiter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select name="branch" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Send Invitation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Employees</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="w-72 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(employee.role)}</TableCell>
                    <TableCell>{employee.branch}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {employee.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.lastLogin}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No employees found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
