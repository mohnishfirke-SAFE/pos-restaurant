"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils/currency";
import { Plus, Tag, Percent, Clock, Trash2, Loader2 } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
} from "@/hooks/use-promotions";

export default function PromotionsPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const tenantId = tenantUser?.tenant_id;

  const { data: promotions, isLoading: promotionsLoading } = usePromotions(tenantId);
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();

  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed" | "bogo" | "happy_hour">("percentage");
  const [formValue, setFormValue] = useState("");
  const [formMinOrder, setFormMinOrder] = useState("0");
  const [formCode, setFormCode] = useState("");
  const [formValidFrom, setFormValidFrom] = useState("");
  const [formValidUntil, setFormValidUntil] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");

  function resetForm() {
    setFormName("");
    setFormType("percentage");
    setFormValue("");
    setFormMinOrder("0");
    setFormCode("");
    setFormValidFrom("");
    setFormValidUntil("");
    setFormMaxUses("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !formName || !formValue) return;

    createPromotion.mutate(
      {
        tenant_id: tenantId,
        name: formName,
        description: null,
        discount_type: formType,
        discount_value: parseFloat(formValue) || 0,
        min_order_value: parseFloat(formMinOrder) || null,
        max_discount: null,
        applicable_items: null,
        applicable_categories: null,
        applicable_branches: null,
        coupon_code: formCode || null,
        max_uses: formMaxUses ? parseInt(formMaxUses, 10) : null,
        valid_from: formValidFrom || null,
        valid_until: formValidUntil || null,
        happy_hour_days: null,
        happy_hour_start: null,
        happy_hour_end: null,
        is_active: true,
      } as Parameters<typeof createPromotion.mutate>[0],
      {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      }
    );
  }

  function handleToggleActive(id: string, isActive: boolean) {
    updatePromotion.mutate({ id, is_active: !isActive });
  }

  function handleDelete(id: string) {
    deletePromotion.mutate(id);
  }

  const isLoading = authLoading || promotionsLoading;

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
          <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">Manage discounts, coupons, and happy hours</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Promotion</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Promotion</DialogTitle>
                <DialogDescription>Set up a new discount or offer</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Weekend Special"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as typeof formType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Off</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="bogo">Buy One Get One</SelectItem>
                        <SelectItem value="happy_hour">Happy Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 15"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Min Order (INR)</Label>
                    <Input
                      type="number"
                      value={formMinOrder}
                      onChange={(e) => setFormMinOrder(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Coupon Code</Label>
                    <Input
                      placeholder="SAVE15"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Valid From</Label>
                    <Input
                      type="date"
                      value={formValidFrom}
                      onChange={(e) => setFormValidFrom(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={formValidUntil}
                      onChange={(e) => setFormValidUntil(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Max Uses (leave empty for unlimited)</Label>
                  <Input
                    type="number"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createPromotion.isPending}>
                  {createPromotion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Promotion
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All Promotions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(promotions ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {p.discount_type === "happy_hour" ? <Clock className="h-4 w-4 text-orange-500" /> : <Tag className="h-4 w-4" />}
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {p.discount_type === "percentage" ? "%" : p.discount_type === "fixed" ? "Fixed" : p.discount_type === "bogo" ? "BOGO" : "Happy Hr"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.discount_type === "percentage" || p.discount_type === "happy_hour"
                      ? `${p.discount_value}%`
                      : p.discount_type === "fixed"
                      ? formatINR(p.discount_value)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {p.coupon_code ? (
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.coupon_code}</code>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {p.used_count}{p.max_uses ? `/${p.max_uses}` : ""}
                  </TableCell>
                  <TableCell>{p.valid_until ?? "-"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={() => handleToggleActive(p.id, p.is_active)}
                      disabled={updatePromotion.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p.id)}
                      disabled={deletePromotion.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!promotions || promotions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No promotions created yet
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
