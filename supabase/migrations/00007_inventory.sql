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
