-- Migration: supabase/migrations/00001_enums.sql
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


-- Migration: supabase/migrations/00002_tenants_and_branches.sql
-- 00002_tenants_and_branches.sql

CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  logo_url        TEXT,
  email           TEXT NOT NULL,
  phone           TEXT,
  gstin           TEXT,
  pan             TEXT,
  address         JSONB,
  subscription_plan subscription_plan DEFAULT 'starter',
  subscription_status subscription_status DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  max_branches    INT DEFAULT 1,
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  address         JSONB,
  phone           TEXT,
  email           TEXT,
  gstin           TEXT,
  timezone        TEXT DEFAULT 'Asia/Kolkata',
  currency        TEXT DEFAULT 'INR',
  is_active       BOOLEAN DEFAULT true,
  settings        JSONB DEFAULT '{}',
  operating_hours JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);


-- Migration: supabase/migrations/00003_users_and_roles.sql
-- 00003_users_and_roles.sql

CREATE TABLE tenant_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id) ON DELETE SET NULL,
  role            user_role NOT NULL DEFAULT 'waiter',
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  pin_code        TEXT,
  phone           TEXT,
  is_active       BOOLEAN DEFAULT true,
  permissions     JSONB DEFAULT '{}',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Custom JWT claims function (called by Supabase Auth hook)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  claims JSONB;
  tenant_user RECORD;
BEGIN
  SELECT tu.tenant_id, tu.branch_id, tu.role
  INTO tenant_user
  FROM tenant_users tu
  WHERE tu.user_id = (event->>'user_id')::UUID
    AND tu.is_active = true
  LIMIT 1;

  claims := event->'claims';
  IF tenant_user IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(tenant_user.tenant_id));
    claims := jsonb_set(claims, '{branch_id}', to_jsonb(tenant_user.branch_id));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(tenant_user.role::text));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;


-- Migration: supabase/migrations/00004_menu_system.sql
-- 00004_menu_system.sql

CREATE TABLE menu_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  name_local      TEXT,
  slug            TEXT NOT NULL,
  image_url       TEXT,
  sort_order      INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  parent_id       UUID REFERENCES menu_categories(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES menu_categories(id),
  name            TEXT NOT NULL,
  name_local      TEXT,
  description     TEXT,
  image_url       TEXT,
  base_price      DECIMAL(10,2) NOT NULL,
  hsn_sac_code    TEXT,
  gst_rate        DECIMAL(4,2) DEFAULT 5.00,
  is_veg          BOOLEAN DEFAULT true,
  is_active       BOOLEAN DEFAULT true,
  is_available    BOOLEAN DEFAULT true,
  sort_order      INT DEFAULT 0,
  preparation_time INT DEFAULT 15,
  tags            TEXT[],
  nutritional_info JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_item_branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  price_override  DECIMAL(10,2),
  is_available    BOOLEAN DEFAULT true,
  gst_rate_override DECIMAL(4,2),
  UNIQUE(menu_item_id, branch_id)
);

CREATE TABLE modifier_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  min_selections  INT DEFAULT 0,
  max_selections  INT DEFAULT 1,
  is_required     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modifiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  is_default      BOOLEAN DEFAULT false,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_item_modifier_groups (
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, modifier_group_id)
);

CREATE TABLE combo_deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT,
  combo_price     DECIMAL(10,2) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE combo_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id        UUID NOT NULL REFERENCES combo_deals(id) ON DELETE CASCADE,
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
  quantity        INT DEFAULT 1
);


-- Migration: supabase/migrations/00005_tables_and_reservations.sql
-- 00005_tables_and_reservations.sql

CREATE TABLE restaurant_tables (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  table_number    TEXT NOT NULL,
  capacity        INT NOT NULL DEFAULT 4,
  status          table_status DEFAULT 'available',
  floor           TEXT DEFAULT 'Ground',
  position_x      INT DEFAULT 0,
  position_y      INT DEFAULT 0,
  shape           TEXT DEFAULT 'rectangle',
  is_active       BOOLEAN DEFAULT true,
  current_order_id UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, branch_id, table_number)
);

CREATE TABLE reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  table_id        UUID REFERENCES restaurant_tables(id),
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_email  TEXT,
  party_size      INT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  duration_minutes INT DEFAULT 90,
  status          reservation_status DEFAULT 'pending',
  notes           TEXT,
  customer_id     UUID,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- Migration: supabase/migrations/00006_orders_and_kot.sql
-- 00006_orders_and_kot.sql

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  order_number    TEXT NOT NULL,
  order_type      order_type NOT NULL,
  status          order_status DEFAULT 'draft',
  table_id        UUID REFERENCES restaurant_tables(id),
  customer_id     UUID,
  waiter_id       UUID REFERENCES auth.users(id),
  subtotal        DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_id     UUID,
  tax_amount      DECIMAL(10,2) DEFAULT 0,
  cgst_amount     DECIMAL(10,2) DEFAULT 0,
  sgst_amount     DECIMAL(10,2) DEFAULT 0,
  igst_amount     DECIMAL(10,2) DEFAULT 0,
  service_charge  DECIMAL(10,2) DEFAULT 0,
  total           DECIMAL(10,2) DEFAULT 0,
  aggregator_platform aggregator_platform,
  aggregator_order_id TEXT,
  delivery_address JSONB,
  delivery_notes  TEXT,
  notes           TEXT,
  is_paid         BOOLEAN DEFAULT false,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL,
  total_price     DECIMAL(10,2) NOT NULL,
  notes           TEXT,
  modifiers       JSONB DEFAULT '[]',
  is_cancelled    BOOLEAN DEFAULT false,
  cancelled_reason TEXT,
  kot_id          UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kot_number      TEXT NOT NULL,
  status          kot_status DEFAULT 'pending',
  station         TEXT DEFAULT 'main',
  printed_at      TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  ready_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence generator for order numbers per branch per day
CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID, p_branch_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  branch_code TEXT;
  seq_val INT;
BEGIN
  SELECT code INTO branch_code FROM branches WHERE id = p_branch_id;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(order_number, '-', 3) AS INT)
  ), 0) + 1 INTO seq_val
  FROM orders
  WHERE tenant_id = p_tenant_id AND branch_id = p_branch_id
    AND DATE(created_at) = CURRENT_DATE;
  RETURN 'ORD-' || branch_code || '-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$;


-- Migration: supabase/migrations/00007_inventory.sql
-- 00007_inventory.sql

CREATE TABLE ingredients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  unit            TEXT NOT NULL,
  sku             TEXT,
  barcode         TEXT,
  cost_per_unit   DECIMAL(10,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branch_stock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  current_stock   DECIMAL(10,3) DEFAULT 0,
  min_stock_level DECIMAL(10,3) DEFAULT 0,
  max_stock_level DECIMAL(10,3),
  last_restocked  TIMESTAMPTZ,
  UNIQUE(branch_id, ingredient_id)
);

CREATE TABLE recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_needed DECIMAL(10,3) NOT NULL,
  unit            TEXT NOT NULL,
  UNIQUE(menu_item_id, ingredient_id)
);

CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  movement_type   stock_movement_type NOT NULL,
  quantity        DECIMAL(10,3) NOT NULL,
  reference_id    UUID,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  address         JSONB,
  gstin           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  supplier_id     UUID NOT NULL REFERENCES suppliers(id),
  po_number       TEXT NOT NULL,
  status          po_status DEFAULT 'draft',
  total_amount    DECIMAL(10,2) DEFAULT 0,
  notes           TEXT,
  expected_date   DATE,
  received_date   DATE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
  quantity_ordered DECIMAL(10,3) NOT NULL,
  quantity_received DECIMAL(10,3) DEFAULT 0,
  unit_cost       DECIMAL(10,2) NOT NULL,
  total_cost      DECIMAL(10,2) NOT NULL
);

-- Auto-deduct stock on order completion
CREATE OR REPLACE FUNCTION deduct_stock_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO stock_movements (tenant_id, branch_id, ingredient_id, movement_type, quantity, reference_id)
    SELECT
      NEW.tenant_id,
      NEW.branch_id,
      r.ingredient_id,
      'sale',
      -(r.quantity_needed * oi.quantity),
      NEW.id
    FROM order_items oi
    JOIN recipes r ON r.menu_item_id = oi.menu_item_id
    WHERE oi.order_id = NEW.id AND oi.is_cancelled = false;

    UPDATE branch_stock bs
    SET current_stock = bs.current_stock + sm.quantity
    FROM stock_movements sm
    WHERE sm.reference_id = NEW.id
      AND sm.ingredient_id = bs.ingredient_id
      AND sm.branch_id = bs.branch_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deduct_stock
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_order();


-- Migration: supabase/migrations/00008_payments.sql
-- 00008_payments.sql

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method          payment_method NOT NULL,
  status          payment_status DEFAULT 'pending',
  amount          DECIMAL(10,2) NOT NULL,
  tip_amount      DECIMAL(10,2) DEFAULT 0,
  gateway         TEXT,
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  gateway_response JSONB,
  is_split        BOOLEAN DEFAULT false,
  split_index     INT,
  refund_amount   DECIMAL(10,2),
  refund_reason   TEXT,
  refunded_at     TIMESTAMPTZ,
  is_offline      BOOLEAN DEFAULT false,
  synced_at       TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cash_drawer_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  opening_amount  DECIMAL(10,2) NOT NULL,
  closing_amount  DECIMAL(10,2),
  expected_amount DECIMAL(10,2),
  difference      DECIMAL(10,2),
  opened_at       TIMESTAMPTZ DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  notes           TEXT
);


-- Migration: supabase/migrations/00009_customers_and_loyalty.sql
-- 00009_customers_and_loyalty.sql

CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  date_of_birth   DATE,
  anniversary     DATE,
  address         JSONB,
  preferences     JSONB DEFAULT '{}',
  tags            TEXT[],
  total_orders    INT DEFAULT 0,
  total_spent     DECIMAL(10,2) DEFAULT 0,
  loyalty_points  INT DEFAULT 0,
  loyalty_tier    TEXT DEFAULT 'bronze',
  last_visit_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from orders and reservations to customers
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE reservations ADD CONSTRAINT fk_reservations_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

CREATE TABLE loyalty_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id),
  points          INT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  points_per_rupee DECIMAL(4,2) DEFAULT 1,
  redemption_rate DECIMAL(4,2) DEFAULT 0.25,
  tier_thresholds JSONB DEFAULT '{"silver": 500, "gold": 2000, "platinum": 5000}',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gift_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code            TEXT UNIQUE NOT NULL,
  initial_balance DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  customer_id     UUID REFERENCES customers(id),
  is_active       BOOLEAN DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- Migration: supabase/migrations/00010_promotions.sql
-- 00010_promotions.sql

CREATE TABLE promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  discount_type   discount_type NOT NULL,
  discount_value  DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_discount    DECIMAL(10,2),
  applicable_items UUID[],
  applicable_categories UUID[],
  applicable_branches UUID[],
  coupon_code     TEXT,
  max_uses        INT,
  used_count      INT DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_until     TIMESTAMPTZ NOT NULL,
  happy_hour_days INT[],
  happy_hour_start TIME,
  happy_hour_end  TIME,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from orders to promotions
ALTER TABLE orders ADD CONSTRAINT fk_orders_promotion
  FOREIGN KEY (discount_id) REFERENCES promotions(id) ON DELETE SET NULL;


-- Migration: supabase/migrations/00011_employees_and_shifts.sql
-- 00011_employees_and_shifts.sql

CREATE TABLE shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  shift_date      DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  status          shift_status DEFAULT 'scheduled',
  clock_in_at     TIMESTAMPTZ,
  clock_out_at    TIMESTAMPTZ,
  break_minutes   INT DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  timestamp       TIMESTAMPTZ DEFAULT NOW(),
  location        JSONB
);


-- Migration: supabase/migrations/00012_audit_logs.sql
-- 00012_audit_logs.sql

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  user_id         UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_ARGV[0] || '.' || LOWER(TG_OP),
    TG_ARGV[0],
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn('order');
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn('payment');
CREATE TRIGGER audit_menu_items AFTER INSERT OR UPDATE OR DELETE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn('menu_item');


-- Migration: supabase/migrations/00014_indexes_and_functions.sql
-- 00014_indexes_and_functions.sql

-- Performance indexes
CREATE INDEX idx_orders_tenant_branch ON orders(tenant_id, branch_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(tenant_id, branch_id, status) WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_kots_branch_status ON kots(tenant_id, branch_id, status) WHERE status != 'served';
CREATE INDEX idx_menu_items_tenant_cat ON menu_items(tenant_id, category_id, is_active);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX idx_branch_stock_low ON branch_stock(branch_id, ingredient_id) WHERE current_stock <= min_stock_level;
CREATE INDEX idx_reservations_date ON reservations(tenant_id, branch_id, reservation_date);
CREATE INDEX idx_audit_logs_entity ON audit_logs(tenant_id, entity_type, entity_id, created_at DESC);
CREATE INDEX idx_stock_movements_ref ON stock_movements(reference_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenant_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON kots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();


