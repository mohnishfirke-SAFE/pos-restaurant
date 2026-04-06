"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/utils/currency";
import { CreditCard, Check } from "lucide-react";

const plans = [
  { name: "Starter", price: 2999, features: ["1 Branch", "5 Users", "Basic POS", "Email Support"], current: false },
  { name: "Professional", price: 9999, features: ["5 Branches", "25 Users", "Full POS + KDS", "Integrations", "Priority Support"], current: true },
  { name: "Enterprise", price: 25000, features: ["Unlimited Branches", "Unlimited Users", "White-label", "API Access", "Dedicated Support"], current: false },
];

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription plan</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan: Professional</CardTitle>
              <CardDescription>Your next billing date is May 1, 2026</CardDescription>
            </div>
            <Badge>Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">Visa ending in 4242</span>
          <Button variant="outline" size="sm">Update</Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.current ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {plan.current && <Badge>Current</Badge>}
              </CardTitle>
              <div className="text-2xl font-bold">{formatINR(plan.price)}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />{f}
                  </li>
                ))}
              </ul>
              <Button className="mt-4 w-full" variant={plan.current ? "outline" : "default"} disabled={plan.current}>
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
