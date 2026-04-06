import type { UserRole } from "@/types";

// Permission actions
export type Permission =
  | "menu:read"
  | "menu:write"
  | "orders:read"
  | "orders:write"
  | "orders:cancel"
  | "orders:discount"
  | "kitchen:read"
  | "kitchen:write"
  | "tables:read"
  | "tables:write"
  | "reservations:read"
  | "reservations:write"
  | "inventory:read"
  | "inventory:write"
  | "customers:read"
  | "customers:write"
  | "employees:read"
  | "employees:write"
  | "reports:read"
  | "settings:read"
  | "settings:write"
  | "promotions:read"
  | "promotions:write"
  | "payments:read"
  | "payments:write"
  | "payments:refund"
  | "integrations:read"
  | "integrations:write"
  | "branches:read"
  | "branches:write"
  | "billing:read"
  | "billing:write";

// Role-permission matrix
const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    "menu:read", "menu:write", "orders:read", "orders:write", "orders:cancel", "orders:discount",
    "kitchen:read", "kitchen:write", "tables:read", "tables:write",
    "reservations:read", "reservations:write", "inventory:read", "inventory:write",
    "customers:read", "customers:write", "employees:read", "employees:write",
    "reports:read", "settings:read", "settings:write", "promotions:read", "promotions:write",
    "payments:read", "payments:write", "payments:refund",
    "integrations:read", "integrations:write", "branches:read", "branches:write",
    "billing:read", "billing:write",
  ],
  tenant_owner: [
    "menu:read", "menu:write", "orders:read", "orders:write", "orders:cancel", "orders:discount",
    "kitchen:read", "kitchen:write", "tables:read", "tables:write",
    "reservations:read", "reservations:write", "inventory:read", "inventory:write",
    "customers:read", "customers:write", "employees:read", "employees:write",
    "reports:read", "settings:read", "settings:write", "promotions:read", "promotions:write",
    "payments:read", "payments:write", "payments:refund",
    "integrations:read", "integrations:write", "branches:read", "branches:write",
    "billing:read", "billing:write",
  ],
  branch_manager: [
    "menu:read", "menu:write", "orders:read", "orders:write", "orders:cancel", "orders:discount",
    "kitchen:read", "kitchen:write", "tables:read", "tables:write",
    "reservations:read", "reservations:write", "inventory:read", "inventory:write",
    "customers:read", "customers:write", "employees:read", "employees:write",
    "reports:read", "settings:read", "promotions:read", "promotions:write",
    "payments:read", "payments:write", "payments:refund",
  ],
  cashier: [
    "menu:read", "orders:read", "orders:write", "orders:discount",
    "tables:read", "reservations:read",
    "customers:read", "customers:write",
    "payments:read", "payments:write",
  ],
  waiter: [
    "menu:read", "orders:read", "orders:write",
    "tables:read", "tables:write",
    "reservations:read", "reservations:write",
    "customers:read",
  ],
  kitchen_staff: [
    "menu:read", "kitchen:read", "kitchen:write",
    "orders:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}
