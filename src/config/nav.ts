import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  Grid3X3,
  CalendarDays,
  UtensilsCrossed,
  Package,
  Users,
  UserCog,
  BarChart3,
  Tag,
  Plug,
  Settings,
  Truck,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  children?: NavItem[];
}

export const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "POS Terminal",
    href: "/pos",
    icon: ShoppingCart,
    permission: "orders:write",
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ClipboardList,
    permission: "orders:read",
  },
  {
    title: "Kitchen",
    href: "/kitchen",
    icon: ChefHat,
    permission: "kitchen:read",
  },
  {
    title: "Tables",
    href: "/tables",
    icon: Grid3X3,
    permission: "tables:read",
  },
  {
    title: "Reservations",
    href: "/reservations",
    icon: CalendarDays,
    permission: "reservations:read",
  },
  {
    title: "Menu",
    href: "/menu",
    icon: UtensilsCrossed,
    permission: "menu:read",
    children: [
      { title: "Items", href: "/menu", icon: UtensilsCrossed },
      { title: "Categories", href: "/menu/categories", icon: UtensilsCrossed },
      { title: "Modifiers", href: "/menu/modifiers", icon: UtensilsCrossed },
      { title: "Combos", href: "/menu/combos", icon: UtensilsCrossed },
      { title: "Platform Mapping", href: "/menu/platform-mapping", icon: ArrowLeftRight, permission: "integrations:read" },
    ],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    permission: "inventory:read",
    children: [
      { title: "Stock Overview", href: "/inventory", icon: Package },
      { title: "Ingredients", href: "/inventory/ingredients", icon: Package },
      { title: "Recipes", href: "/inventory/recipes", icon: Package },
      { title: "Purchase Orders", href: "/inventory/purchase-orders", icon: Package },
    ],
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    permission: "customers:read",
  },
  {
    title: "Employees",
    href: "/employees",
    icon: UserCog,
    permission: "employees:read",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: "reports:read",
    children: [
      { title: "Overview", href: "/reports", icon: BarChart3 },
      { title: "Sales", href: "/reports/sales", icon: BarChart3 },
      { title: "Channel Breakdown", href: "/reports/channels", icon: Truck },
      { title: "Customers", href: "/reports/customers", icon: Users },
      { title: "Inventory", href: "/reports/inventory", icon: Package },
      { title: "Staff", href: "/reports/staff", icon: UserCog },
    ],
  },
  {
    title: "Promotions",
    href: "/promotions",
    icon: Tag,
    permission: "promotions:read",
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: Plug,
    permission: "integrations:read",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: "settings:read",
  },
];
