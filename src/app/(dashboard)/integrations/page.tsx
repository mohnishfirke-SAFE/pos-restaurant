"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, RefreshCw } from "lucide-react";

const integrations = [
  {
    name: "Zomato",
    description: "Sync menu, receive orders, and manage your Zomato listing directly from the POS.",
    status: "disconnected" as const,
    features: ["Menu sync", "Order injection", "Outlet management"],
    logo: "Z",
    color: "bg-red-500",
  },
  {
    name: "Swiggy",
    description: "Connect via UrbanPiper middleware to receive Swiggy orders and sync your menu.",
    status: "disconnected" as const,
    features: ["Order import", "Menu sync", "Availability toggle"],
    logo: "S",
    color: "bg-orange-500",
  },
  {
    name: "Uber Eats",
    description: "Manage Uber Eats store, menu, and orders through the Marketplace API.",
    status: "disconnected" as const,
    features: ["Menu management", "Order flow", "Store hours sync"],
    logo: "U",
    color: "bg-green-600",
  },
  {
    name: "Razorpay",
    description: "Accept payments via cards, UPI, netbanking, and wallets.",
    status: "connected" as const,
    features: ["Card payments", "UPI/QR", "Refunds", "Split payments"],
    logo: "R",
    color: "bg-blue-600",
  },
  {
    name: "SMS Gateway (MSG91)",
    description: "Send order confirmations, reservation reminders, and marketing messages.",
    status: "disconnected" as const,
    features: ["Order SMS", "Booking reminders", "Marketing"],
    logo: "M",
    color: "bg-purple-600",
  },
  {
    name: "Email (SendGrid)",
    description: "Send digital receipts, invoices, and promotional emails.",
    status: "disconnected" as const,
    features: ["Digital receipts", "Invoices", "Campaigns"],
    logo: "E",
    color: "bg-indigo-600",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect third-party services to your POS</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${integration.color} text-white font-bold`}>
                    {integration.logo}
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <Badge variant={integration.status === "connected" ? "default" : "secondary"} className="mt-1">
                      {integration.status === "connected" ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                </div>
                <Switch checked={integration.status === "connected"} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription>{integration.description}</CardDescription>
              <Separator />
              <div className="flex flex-wrap gap-1">
                {integration.features.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant={integration.status === "connected" ? "outline" : "default"}>
                  {integration.status === "connected" ? (
                    <><RefreshCw className="mr-1 h-3 w-3" />Sync Now</>
                  ) : (
                    "Connect"
                  )}
                </Button>
                <Button size="sm" variant="ghost">
                  <ExternalLink className="mr-1 h-3 w-3" />Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
