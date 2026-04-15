"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/utils/currency";
import { CreditCard, Check } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";
import { useTenantSettings } from "@/hooks/use-settings";

const plans = [
  {
    key: "starter",
    name: "Starter",
    price: 2999,
    features: ["1 Branch", "5 Users", "Basic POS", "Email Support"],
  },
  {
    key: "professional",
    name: "Professional",
    price: 9999,
    features: [
      "5 Branches",
      "25 Users",
      "Full POS + KDS",
      "Integrations",
      "Priority Support",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 25000,
    features: [
      "Unlimited Branches",
      "Unlimited Users",
      "White-label",
      "API Access",
      "Dedicated Support",
    ],
  },
];

export default function BillingSettingsPage() {
  const { tenantUser, loading: authLoading } = useTenantUser();
  const tenantId = tenantUser?.tenant_id ?? null;

  const { data: tenant, isLoading: tenantLoading } = useTenantSettings(tenantId);

  if (authLoading || tenantLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Billing &amp; Subscription
          </h1>
          <p className="text-muted-foreground">Manage your subscription plan</p>
        </div>
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <div className="h-6 w-56 animate-pulse rounded bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-24 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = tenant?.subscription_plan?.toLowerCase() ?? "starter";
  const planStatus = tenant?.subscription_status ?? "inactive";
  const trialEndsAt = tenant?.trial_ends_at;

  function getStatusBadge() {
    switch (planStatus) {
      case "active":
        return <Badge>Active</Badge>;
      case "trialing":
        return <Badge variant="secondary">Trial</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const currentPlanData = plans.find((p) => p.key === currentPlan);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Billing &amp; Subscription
        </h1>
        <p className="text-muted-foreground">Manage your subscription plan</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Current Plan: {currentPlanData?.name ?? currentPlan}
              </CardTitle>
              <CardDescription>
                {planStatus === "trialing" && trialEndsAt
                  ? `Trial ends on ${formatDate(trialEndsAt)}`
                  : planStatus === "active"
                  ? "Your subscription is active"
                  : planStatus === "past_due"
                  ? "Your subscription payment is overdue"
                  : planStatus === "canceled"
                  ? "Your subscription has been canceled"
                  : "No active subscription"}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {planStatus === "trialing"
              ? "No payment method on file (trial period)"
              : "Manage payment method via billing portal"}
          </span>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          return (
            <Card key={plan.key} className={isCurrent ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <Badge>Current</Badge>}
                </CardTitle>
                <div className="text-2xl font-bold">
                  {formatINR(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent}
                  onClick={() =>
                    alert(
                      "Payment integration is not yet available. Please contact support to upgrade your plan."
                    )
                  }
                >
                  {isCurrent ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
