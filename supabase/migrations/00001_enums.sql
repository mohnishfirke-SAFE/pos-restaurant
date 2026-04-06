-- 00001_enums.sql
-- All enum types used across the POS system

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'tenant_owner',
  'branch_manager',
  'cashier',
  'waiter',
  'kitchen_staff'
);

CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway', 'delivery', 'kiosk', 'aggregator');
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled');
CREATE TYPE kot_status AS ENUM ('pending', 'in_progress', 'ready', 'served', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'wallet', 'split', 'online');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partial');
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved', 'cleaning', 'blocked');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');
CREATE TYPE stock_movement_type AS ENUM ('purchase', 'sale', 'waste', 'transfer', 'adjustment');
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'partial', 'received', 'cancelled');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed', 'bogo', 'happy_hour');
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'paused');
CREATE TYPE aggregator_platform AS ENUM ('zomato', 'swiggy', 'uber_eats');
CREATE TYPE shift_status AS ENUM ('scheduled', 'clocked_in', 'clocked_out', 'absent');
