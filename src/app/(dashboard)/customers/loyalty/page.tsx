"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Gift,
  Settings,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import {
  useLoyaltyConfig,
  useUpdateLoyaltyConfig,
  useLoyaltyTransactions,
  type LoyaltyConfigRow,
} from "@/hooks/use-loyalty";

interface EditConfig {
  pointsPerRupee: number;
  redemptionRate: number;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
}

const DEFAULT_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1000,
  platinum: 2000,
};

const DEFAULT_CONFIG: EditConfig = {
  pointsPerRupee: 1,
  redemptionRate: 0.25,
  bronzeThreshold: 0,
  silverThreshold: 500,
  goldThreshold: 1000,
  platinumThreshold: 2000,
};

export default function LoyaltyPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;

  const { data: config, isLoading: configLoading } =
    useLoyaltyConfig(tenantId);
  const updateConfig = useUpdateLoyaltyConfig();
  const { data: transactions, isLoading: txLoading } =
    useLoyaltyTransactions(tenantId);

  const [editing, setEditing] = useState(false);
  const [editConfig, setEditConfig] = useState<EditConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (config) {
      const thresholds =
        (config.tier_thresholds as typeof DEFAULT_THRESHOLDS) ??
        DEFAULT_THRESHOLDS;
      setEditConfig({
        pointsPerRupee: config.points_per_rupee,
        redemptionRate: config.redemption_rate,
        bronzeThreshold: thresholds.bronze,
        silverThreshold: thresholds.silver,
        goldThreshold: thresholds.gold,
        platinumThreshold: thresholds.platinum,
      });
    }
  }, [config]);

  function startEditing() {
    setEditing(true);
  }

  function saveConfig() {
    if (!tenantId) return;
    updateConfig.mutate(
      {
        tenant_id: tenantId,
        points_per_rupee: editConfig.pointsPerRupee,
        redemption_rate: editConfig.redemptionRate,
        tier_thresholds: {
          bronze: editConfig.bronzeThreshold,
          silver: editConfig.silverThreshold,
          gold: editConfig.goldThreshold,
          platinum: editConfig.platinumThreshold,
        },
        is_active: true,
      },
      {
        onSuccess: () => {
          setEditing(false);
        },
      }
    );
  }

  function cancelEditing() {
    if (config) {
      const thresholds =
        (config.tier_thresholds as typeof DEFAULT_THRESHOLDS) ??
        DEFAULT_THRESHOLDS;
      setEditConfig({
        pointsPerRupee: config.points_per_rupee,
        redemptionRate: config.redemption_rate,
        bronzeThreshold: thresholds.bronze,
        silverThreshold: thresholds.silver,
        goldThreshold: thresholds.gold,
        platinumThreshold: thresholds.platinum,
      });
    }
    setEditing(false);
  }

  const displayTransactions = transactions ?? [];

  // Derive earned/redeemed from points sign: positive = earned, negative = redeemed
  const totalEarned = displayTransactions
    .filter((t) => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);
  const totalRedeemed = displayTransactions
    .filter((t) => t.points < 0)
    .reduce((sum, t) => sum + Math.abs(t.points), 0);
  const earnedCount = displayTransactions.filter((t) => t.points > 0).length;
  const redeemedCount = displayTransactions.filter((t) => t.points < 0).length;

  // Active display values
  const activeConfig = config
    ? {
        pointsPerRupee: config.points_per_rupee,
        redemptionRate: config.redemption_rate,
        bronzeThreshold:
          ((config.tier_thresholds as Record<string, number>)?.bronze as number) ??
          0,
        silverThreshold:
          ((config.tier_thresholds as Record<string, number>)?.silver as number) ??
          500,
        goldThreshold:
          ((config.tier_thresholds as Record<string, number>)?.gold as number) ??
          1000,
        platinumThreshold:
          ((config.tier_thresholds as Record<string, number>)?.platinum as number) ??
          2000,
      }
    : DEFAULT_CONFIG;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Loyalty Program
          </h1>
          <p className="text-muted-foreground">
            Configure loyalty points and view recent transactions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Points Earned (Recent)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  +{totalEarned.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  from {earnedCount} transactions
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Points Redeemed (Recent)
            </CardTitle>
            <Gift className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  -{totalRedeemed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  from {redeemedCount} redemptions
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Redemption Value
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {configLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatINR(activeConfig.redemptionRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  per point redeemed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Program Configuration</CardTitle>
              <CardDescription>
                Set how customers earn and redeem points
              </CardDescription>
            </div>
            {!editing && (
              <Button variant="outline" onClick={startEditing}>
                Edit Settings
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {configLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : editing ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="pointsPerRupee">
                    Points per Rupee Spent
                  </Label>
                  <Input
                    id="pointsPerRupee"
                    type="number"
                    step="0.1"
                    value={editConfig.pointsPerRupee}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        pointsPerRupee: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of loyalty points awarded per INR spent
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="redemptionRate">
                    Redemption Rate (INR per Point)
                  </Label>
                  <Input
                    id="redemptionRate"
                    type="number"
                    step="0.01"
                    value={editConfig.redemptionRate}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        redemptionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    INR discount value for each point redeemed
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold">
                  Tier Thresholds (Points)
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Minimum total points required for each tier
                </p>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bronze">Bronze</Label>
                    <Input
                      id="bronze"
                      type="number"
                      value={editConfig.bronzeThreshold}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          bronzeThreshold: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="silver">Silver</Label>
                    <Input
                      id="silver"
                      type="number"
                      value={editConfig.silverThreshold}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          silverThreshold: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gold">Gold</Label>
                    <Input
                      id="gold"
                      type="number"
                      value={editConfig.goldThreshold}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          goldThreshold: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="platinum">Platinum</Label>
                    <Input
                      id="platinum"
                      type="number"
                      value={editConfig.platinumThreshold}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          platinumThreshold: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button
                  onClick={saveConfig}
                  disabled={updateConfig.isPending}
                >
                  {updateConfig.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    Points per Rupee
                  </div>
                  <div className="text-2xl font-bold">
                    {activeConfig.pointsPerRupee}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    Redemption Rate
                  </div>
                  <div className="text-2xl font-bold">
                    {formatINR(activeConfig.redemptionRate)} / point
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  Tier Thresholds
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Badge>Bronze</Badge>
                    <span className="text-sm">
                      {activeConfig.bronzeThreshold}+ pts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Badge className="bg-slate-400 hover:bg-slate-400/80 text-white">
                      Silver
                    </Badge>
                    <span className="text-sm">
                      {activeConfig.silverThreshold}+ pts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-white">
                      Gold
                    </Badge>
                    <span className="text-sm">
                      {activeConfig.goldThreshold}+ pts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Badge className="bg-purple-600 hover:bg-purple-600/80 text-white">
                      Platinum
                    </Badge>
                    <span className="text-sm">
                      {activeConfig.platinumThreshold}+ pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Loyalty Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTransactions.map((tx) => {
                  const isEarned = tx.points > 0;
                  const customerName =
                    tx.customers?.name ?? "Unknown";
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {new Date(tx.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customerName}
                      </TableCell>
                      <TableCell>
                        {isEarned ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <ArrowUpRight className="h-4 w-4" />
                            Earned
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600">
                            <ArrowDownRight className="h-4 w-4" />
                            Redeemed
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            isEarned
                              ? "font-medium text-green-600"
                              : "font-medium text-orange-600"
                          }
                        >
                          {isEarned ? "+" : "-"}
                          {Math.abs(tx.points)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tx.description}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No loyalty transactions yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
