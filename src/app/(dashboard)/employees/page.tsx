"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/lib/auth/hooks";
import { useBranchStore } from "@/stores/branch-store";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  UserPlus,
  Loader2,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

interface StaffMember {
  id: string;
  user_id: string;
  tenant_id: string;
  branch_id: string | null;
  role: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

const ROLE_CONFIG: Record<string, { label: string; className: string; description: string }> = {
  tenant_owner: {
    label: "Owner",
    className: "bg-red-600 hover:bg-red-600/80 text-white",
    description: "Full access to all restaurants and settings",
  },
  branch_manager: {
    label: "Manager",
    className: "bg-blue-600 hover:bg-blue-600/80 text-white",
    description: "Manage one branch — menu, orders, staff, reports",
  },
  cashier: {
    label: "Cashier",
    className: "bg-green-600 hover:bg-green-600/80 text-white",
    description: "POS terminal, payments, and orders",
  },
  waiter: {
    label: "Waiter",
    className: "bg-purple-600 hover:bg-purple-600/80 text-white",
    description: "Tables, order placement, and serving",
  },
  kitchen_staff: {
    label: "Kitchen",
    className: "bg-orange-600 hover:bg-orange-600/80 text-white",
    description: "Kitchen Display System (KDS) access only",
  },
};

export default function EmployeesPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const tenantId = useTenantId();
  const { activeBranchId } = useBranchStore();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!tenantId) return;

    const [staffRes, branchRes] = await Promise.all([
      fetch(`/api/staff/invite?tenant_id=${tenantId}`),
      supabase.from("branches").select("id, name, code").order("name"),
    ]);

    if (staffRes.ok) {
      const data = await staffRes.json();
      setStaff(data);
    }
    if (branchRes.data) {
      setBranches(branchRes.data);
    }
    setLoading(false);
  }, [tenantId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleInvite(formData: FormData) {
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || undefined,
      role: formData.get("role") as string,
      tenant_id: tenantId,
      branch_id: formData.get("branch_id") as string,
    };

    const res = await fetch("/api/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(`${payload.name} can now login with:\nEmail: ${payload.email}\nPassword: ${payload.password}`);
      await loadData();
      setDialogOpen(false);
    } else {
      setError(data.error || "Failed to create staff member");
    }
    setSaving(false);
  }

  async function handleToggleActive(member: StaffMember) {
    await fetch("/api/staff/invite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, is_active: !member.is_active }),
    });
    await loadData();
  }

  async function handleRoleChange(member: StaffMember, newRole: string) {
    await fetch("/api/staff/invite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, role: newRole }),
    });
    await loadData();
  }

  async function handleDelete(member: StaffMember) {
    await fetch(`/api/staff/invite?id=${member.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    await loadData();
  }

  function copyCredentials(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getBranchName(branchId: string | null) {
    if (!branchId) return "All";
    return branches.find((b) => b.id === branchId)?.name || branchId;
  }

  const filteredStaff = staff.filter(
    (s) =>
      s.display_name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = staff.filter((s) => s.is_active).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            {staff.length} total staff — {activeCount} active
          </p>
        </div>
        <Button onClick={() => { setDialogOpen(true); setError(""); setSuccess(""); }}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Success message with credentials */}
      {success && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/10">
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Staff member created successfully!</p>
                <pre className="mt-2 text-sm whitespace-pre-wrap text-green-600 dark:text-green-300">
                  {success}
                </pre>
                <p className="mt-2 text-xs text-muted-foreground">
                  Share these credentials with the staff member. They can login at your POS URL.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyCredentials(success)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSuccess("")}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInvite(new FormData(e.currentTarget));
            }}
          >
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Create a login for a new team member. They&apos;ll use these credentials to access the POS.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="e.g. Rahul Sharma" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="rahul@yourrestaurant.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-0.5 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branch_manager">
                        <div>
                          <div className="font-medium">Manager</div>
                          <div className="text-xs text-muted-foreground">Full branch access</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="cashier">
                        <div>
                          <div className="font-medium">Cashier</div>
                          <div className="text-xs text-muted-foreground">POS & payments</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="waiter">
                        <div>
                          <div className="font-medium">Waiter</div>
                          <div className="text-xs text-muted-foreground">Tables & orders</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="kitchen_staff">
                        <div>
                          <div className="font-medium">Kitchen Staff</div>
                          <div className="text-xs text-muted-foreground">KDS access only</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branch_id">Branch</Label>
                  <Select name="branch_id" defaultValue={activeBranchId || undefined} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" />
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Create Staff Login
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {deleteTarget?.display_name}&apos;s account. They will no longer be able to login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Staff</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or role..."
                className="w-72 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStaff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role] || {
                    label: member.role,
                    className: "bg-gray-500 text-white",
                  };
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.display_name}</div>
                        {member.phone && (
                          <div className="text-xs text-muted-foreground">{member.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.role === "tenant_owner" ? (
                          <Badge className={roleConfig.className}>{roleConfig.label}</Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleRoleChange(member, v)}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <Badge className={roleConfig.className}>{roleConfig.label}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="branch_manager">Manager</SelectItem>
                              <SelectItem value="cashier">Cashier</SelectItem>
                              <SelectItem value="waiter">Waiter</SelectItem>
                              <SelectItem value="kitchen_staff">Kitchen</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getBranchName(member.branch_id)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.phone || "-"}
                      </TableCell>
                      <TableCell>
                        {member.role !== "tenant_owner" ? (
                          <Switch
                            checked={member.is_active}
                            onCheckedChange={() => handleToggleActive(member)}
                          />
                        ) : (
                          <Badge variant="default">Always</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.last_login_at
                          ? new Date(member.last_login_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {member.role !== "tenant_owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(member)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              {staff.length === 0 ? (
                <div>
                  <p className="text-lg font-medium">No staff members yet</p>
                  <p className="mt-1">Click &quot;Add Staff Member&quot; to create logins for your team</p>
                </div>
              ) : (
                <p>No results for &quot;{search}&quot;</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Permissions Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLE_CONFIG)
              .filter(([key]) => key !== "tenant_owner")
              .map(([key, config]) => (
                <div key={key} className="rounded-lg border p-3">
                  <Badge className={config.className}>{config.label}</Badge>
                  <p className="mt-2 text-xs text-muted-foreground">{config.description}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
