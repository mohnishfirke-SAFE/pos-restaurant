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
