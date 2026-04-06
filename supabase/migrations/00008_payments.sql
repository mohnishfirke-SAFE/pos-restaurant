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
