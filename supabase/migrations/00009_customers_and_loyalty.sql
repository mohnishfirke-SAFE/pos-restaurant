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
