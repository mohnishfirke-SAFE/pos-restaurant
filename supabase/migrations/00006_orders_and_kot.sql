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
