"use client";

import { useState } from "react";
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
import { Gift, Settings, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface LoyaltyConfig {
  pointsPerRupee: number;
  redemptionRate: number;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
}

interface LoyaltyTransaction {
  id: string;
  date: string;
  customerName: string;
  type: "earned" | "redeemed";
  points: number;
  description: string;
  orderAmount?: number;
}

const initialConfig: LoyaltyConfig = {
  pointsPerRupee: 1,
  redemptionRate: 0.25,
  bronzeThreshold: 0,
  silverThreshold: 500,
  goldThreshold: 1000,
  platinumThreshold: 2000,
};

const mockTransactions: LoyaltyTransaction[] = [
  {
    id: "tx-1",
    date: "2026-04-06",
    customerName: "Vikram Singh",
    type: "earned",
    points: 45,
    description: "Order #1055",
    orderAmount: 450,
  },
  {
    id: "tx-2",
    date: "2026-04-05",
    customerName: "Rajesh Kumar",
    type: "redeemed",
    points: 200,
    description: "Discount on Order #1052",
  },
  {
    id: "tx-3",
    date: "2026-04-05",
    customerName: "Rajesh Kumar",
    type: "earned",
    points: 86,
    description: "Order #1052",
    orderAmount: 860,
  },
  {
    id: "tx-4",
    date: "2026-04-03",
    customerName: "Priya Sharma",
    type: "earned",
    points: 42,
    description: "Order #1048",
    orderAmount: 420,
  },
  {
    id: "tx-5",
    date: "2026-04-03",
    customerName: "Amit Patel",
    type: "earned",
    points: 55,
    description: "Order #1047",
    orderAmount: 550,
  },
  {
    id: "tx-6",
    date: "2026-04-02",
    customerName: "Sneha Reddy",
    type: "redeemed",
    points: 100,
    description: "Discount on Order #1045",
  },
  {
    id: "tx-7",
    date: "2026-04-01",
    customerName: "Priya Sharma",
    type: "earned",
    points: 38,
    description: "Order #1042",
    orderAmount: 380,
  },
  {
    id: "tx-8",
    date: "2026-03-30",
    customerName: "Vikram Singh",
    type: "redeemed",
    points: 150,
    description: "Discount on Order #1040",
  },
];

export default function LoyaltyPage() {
  const [config, setConfig] = useState<LoyaltyConfig>(initialConfig);
  const [editing, setEditing] = useState(false);
  const [editConfig, setEditConfig] = useState<LoyaltyConfig>(initialConfig);

  function startEditing() {
    setEditConfig({ ...config });
    setEditing(true);
  }

  function saveConfig() {
    setConfig({ ...editConfig });
    setEditing(false);
  }

  function cancelEditing() {
    setEditing(false);
  }

  const totalEarned = mockTransactions
    .filter((t) => t.type === "earned")
    .reduce((sum, t) => sum + t.points, 0);
  const totalRedeemed = mockTransactions
    .filter((t) => t.type === "redeemed")
    .reduce((sum, t) => sum + t.points, 0);

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
            <CardTitle className="text-sm font-medium">Points Earned (Recent)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{totalEarned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              from {mockTransactions.filter((t) => t.type === "earned").length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Redeemed (Recent)</CardTitle>
            <Gift className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              -{totalRedeemed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              from {mockTransactions.filter((t) => t.type === "redeemed").length} redemptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redemption Value</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatINR(config.redemptionRate)}
            </div>
            <p className="text-xs text-muted-foreground">per point redeemed</p>
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
          {editing ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="pointsPerRupee">Points per Rupee Spent</Label>
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
                <Label className="text-base font-semibold">Tier Thresholds (Points)</Label>
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
                <Button onClick={saveConfig}>Save Changes</Button>
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
                    {config.pointsPerRupee}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    Redemption Rate
                  </div>
                  <div className="text-2xl font-bold">
                    {formatINR(config.redemptionRate)} / point
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
                    <span className="text-sm">{config.bronzeThreshold}+ pts</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Badge className="bg-slate-400 hover:bg-slate-400/80 text-white">Silver</Badge>
                    <span className="text-sm">{config.silverThreshold}+ pts</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-white">Gold</Badge>
                    <span className="text-sm">{config.goldThreshold}+ pts</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Badge className="bg-purple-600 hover:bg-purple-600/80 text-white">Platinum</Badge>
                    <span className="text-sm">{config.platinumThreshold}+ pts</span>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell className="font-medium">
                    {tx.customerName}
                  </TableCell>
                  <TableCell>
                    {tx.type === "earned" ? (
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
                        tx.type === "earned"
                          ? "font-medium text-green-600"
                          : "font-medium text-orange-600"
                      }
                    >
                      {tx.type === "earned" ? "+" : "-"}
                      {tx.points}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    {tx.orderAmount ? formatINR(tx.orderAmount) : "-"}
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
