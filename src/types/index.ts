export type { Database, Tables, InsertTables, UpdateTables, Enums, Json } from "@/lib/db/types";

export type UserRole = "super_admin" | "tenant_owner" | "branch_manager" | "cashier" | "waiter" | "kitchen_staff";
export type OrderType = "dine_in" | "takeaway" | "delivery" | "kiosk" | "aggregator";
export type OrderStatus = "draft" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled";
export type KotStatus = "pending" | "in_progress" | "ready" | "served" | "cancelled";
export type PaymentMethod = "cash" | "card" | "upi" | "wallet" | "split" | "online";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "partial";
export type TableStatus = "available" | "occupied" | "reserved" | "cleaning" | "blocked";

export interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  branch_id: string | null;
  role: UserRole;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
}

export interface JWTClaims {
  tenant_id: string;
  branch_id: string | null;
  user_role: UserRole;
}
