"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav, type NavItem } from "@/config/nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRole } from "@/lib/auth/hooks";
import { hasPermission } from "@/lib/auth/permissions";
import { BranchSwitcher } from "./branch-switcher";

export function Sidebar() {
  const pathname = usePathname();
  const role = useRole();

  const filteredNav = mainNav.filter((item) => {
    if (!item.permission) return true;
    if (!role) return false;
    return hasPermission(role, item.permission);
  });

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-sidebar-background lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <span className="text-lg">RestoPOS</span>
          </Link>
        </div>
        <div className="border-b p-3">
          <BranchSwitcher />
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {filteredNav.map((item) => (
              <SidebarItem key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}

function SidebarItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive =
    pathname === item.href ||
    (item.children && item.children.some((child) => pathname === child.href));

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.title}
    </Link>
  );
}
