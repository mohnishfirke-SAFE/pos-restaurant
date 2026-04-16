"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav, type NavItem } from "@/config/nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRole } from "@/lib/auth/hooks";
import { hasPermission } from "@/lib/auth/permissions";
import { BranchSwitcher } from "./branch-switcher";
import { ChevronDown } from "lucide-react";

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
            {filteredNav.map((item) =>
              item.children ? (
                <SidebarGroup
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  role={role}
                />
              ) : (
                <SidebarItem key={item.href} item={item} pathname={pathname} />
              )
            )}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}

function SidebarGroup({
  item,
  pathname,
  role,
}: {
  item: NavItem;
  pathname: string;
  role: string | null;
}) {
  const isChildActive = item.children!.some((child) => pathname === child.href);
  const [open, setOpen] = useState(isChildActive);

  const visibleChildren = item.children!.filter((child) => {
    if (!child.permission) return true;
    if (!role) return false;
    return hasPermission(role as any, child.permission);
  });

  if (visibleChildren.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isChildActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <span className="flex items-center gap-3">
          <item.icon className="h-4 w-4" />
          {item.title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-2">
          {visibleChildren.map((child) => {
            const isActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {child.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = pathname === item.href;

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
      <item.icon className="h-4 w-4" />
      {item.title}
    </Link>
  );
}
