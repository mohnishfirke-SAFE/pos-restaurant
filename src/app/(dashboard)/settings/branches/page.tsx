"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useToggleBranch,
} from "@/hooks/use-branches";
import type { Tables } from "@/lib/db/types";

type Branch = Tables<"branches">;

interface BranchFormData {
  name: string;
  code: string;
  phone: string;
  gstin: string;
}

const emptyForm: BranchFormData = {
  name: "",
  code: "",
  phone: "",
  gstin: "",
};

export default function BranchesPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const { data: branches = [], isLoading: branchesLoading } = useBranches(
    tenantUser?.tenant_id ?? null
  );
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const toggleBranch = useToggleBranch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormData>(emptyForm);

  const isLoading = authLoading || branchesLoading;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingBranch) {
      setForm({
        name: editingBranch.name,
        code: editingBranch.code,
        phone: editingBranch.phone ?? "",
        gstin: editingBranch.gstin ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingBranch]);

  function openCreateDialog() {
    setEditingBranch(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(branch: Branch) {
    setEditingBranch(branch);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!tenantUser?.tenant_id || !form.name.trim()) return;

    if (editingBranch) {
      updateBranch.mutate(
        {
          id: editingBranch.id,
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          phone: form.phone.trim() || null,
          gstin: form.gstin.trim() || null,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingBranch(null);
          },
        }
      );
    } else {
      createBranch.mutate(
        {
          tenant_id: tenantUser.tenant_id,
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          phone: form.phone.trim() || null,
          gstin: form.gstin.trim() || null,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setForm(emptyForm);
          },
        }
      );
    }
  }

  const isMutating = createBranch.isPending || updateBranch.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground">
            Manage your restaurant locations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? "Edit Branch" : "Add New Branch"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="branch-name">Branch Name</Label>
                <Input
                  id="branch-name"
                  placeholder="e.g., Downtown Outlet"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="branch-code">Code</Label>
                  <Input
                    id="branch-code"
                    placeholder="Auto-generated"
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, code: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branch-phone">Phone</Label>
                  <Input
                    id="branch-phone"
                    placeholder="+91"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch-gstin">GSTIN</Label>
                <Input
                  id="branch-gstin"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, gstin: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.name.trim() || isMutating}
              >
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBranch ? "Save Changes" : "Create Branch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Branches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading branches...
              </span>
            </div>
          ) : branches.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No branches found. Add your first branch to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">
                      {branch.name}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {branch.code}
                      </code>
                    </TableCell>
                    <TableCell>{branch.phone || "—"}</TableCell>
                    <TableCell>{branch.gstin || "—"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={branch.is_active}
                        onCheckedChange={(checked) =>
                          toggleBranch.mutate({
                            id: branch.id,
                            is_active: checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(branch)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
