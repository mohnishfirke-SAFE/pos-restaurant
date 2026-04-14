"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, CreditCard, Activity } from "lucide-react";
import { useTenantUser } from "@/lib/auth/hooks";

const adminNav = [
  { title: "Overview", href: "/super-admin", icon: LayoutDashboard },
  { title: "Tenants", href: "/super-admin/tenants", icon: Building2 },
  { title: "Billing", href: "/super-admin/billing", icon: CreditCard },
  { title: "System", href: "/super-admin/system", icon: Activity },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenantUser, loading } = useTenantUser();

  useEffect(() => {
    if (!loading && tenantUser && tenantUser.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [loading, tenantUser, router]);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-sidebar-background">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-bold">Super Admin</span>
        </div>
        <nav className="space-y-1 p-2">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="h-4 w-4" />{item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
