"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Receipt,
  CreditCard,
  Printer,
  Wallet,
} from "lucide-react";

const settingsSections = [
  {
    title: "Branches",
    description: "Add, edit, and manage your restaurant outlets/locations.",
    href: "/settings/branches",
    icon: Building2,
  },
  {
    title: "Tax Configuration",
    description: "GST rates, GSTIN, HSN/SAC codes, and inter-state settings.",
    href: "/settings/taxes",
    icon: Receipt,
  },
  {
    title: "Payment Methods",
    description: "Configure Razorpay, UPI, cash, and card payment options.",
    href: "/settings/payments",
    icon: CreditCard,
  },
  {
    title: "Printers",
    description: "Set up kitchen, receipt, and barcode printers.",
    href: "/settings/printers",
    icon: Printer,
  },
  {
    title: "Billing & Subscription",
    description: "Manage your plan, invoices, and subscription details.",
    href: "/settings/billing",
    icon: Wallet,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your restaurant settings
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
