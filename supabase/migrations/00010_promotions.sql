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
