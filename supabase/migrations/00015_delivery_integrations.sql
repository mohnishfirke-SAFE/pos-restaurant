-- 00015_delivery_integrations.sql
-- Swiggy & Zomato full integration: new tables, missing columns, logs, menu mapping

-- ============================================================
-- 1. Add missing columns to orders table
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'dine_in';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_platform_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_eta TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_commission_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_commission_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_accepted BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_eta TIMESTAMPTZ;

-- ============================================================
-- 2. delivery_integrations table (dedicated, replaces generic integrations for platforms)
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  platform        aggregator_platform NOT NULL,
  api_key         TEXT NOT NULL,                     -- encrypted at app layer
  api_secret      TEXT,                               -- encrypted at app layer
  merchant_id     TEXT,
  webhook_secret  TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active       BOOLEAN DEFAULT true,
  auto_accept     BOOLEAN DEFAULT false,
  auto_accept_seconds INT DEFAULT 0,                  -- 0 = manual, >0 = auto-accept after N seconds
  default_commission_pct DECIMAL(5,2) DEFAULT 0,
  store_status    TEXT DEFAULT 'open',                -- open | closed | busy
  connected_at    TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at  TIMESTAMPTZ,
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, branch_id, platform)
);

-- ============================================================
-- 3. menu_platform_mapping table
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_platform_mapping (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  platform        aggregator_platform NOT NULL,
  platform_item_id TEXT,
  platform_category_id TEXT,
  is_available    BOOLEAN DEFAULT true,
  is_synced       BOOLEAN DEFAULT false,
  last_synced_at  TIMESTAMPTZ,
  price_override  DECIMAL(10,2),                      -- platform-specific price (if different)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, platform)
);

-- ============================================================
-- 4. integration_logs table (audit trail for all API interactions)
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id  UUID REFERENCES delivery_integrations(id) ON DELETE SET NULL,
  platform        aggregator_platform NOT NULL,
  event_type      TEXT NOT NULL,                      -- order.received, order.accepted, order.rejected, menu.synced, status.pushed, etc.
  direction       TEXT NOT NULL DEFAULT 'inbound',    -- inbound | outbound
  payload         JSONB DEFAULT '{}',
  response        JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'success',             -- success | failed | pending
  error_message   TEXT,
  http_status     INT,
  latency_ms      INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. platform_order_queue (webhook queue for reliability)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_order_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  platform        aggregator_platform NOT NULL,
  external_order_id TEXT NOT NULL,
  raw_payload     JSONB NOT NULL,
  status          TEXT DEFAULT 'pending',             -- pending | processing | completed | failed
  retry_count     INT DEFAULT 0,
  max_retries     INT DEFAULT 3,
  order_id        UUID REFERENCES orders(id),         -- linked after processing
  error_message   TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. RLS policies for new tables
-- ============================================================
ALTER TABLE delivery_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_platform_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_order_queue ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY "tenant_isolation" ON delivery_integrations
  USING (tenant_id::text = ((current_setting('request.jwt.claims', true))::json->>'tenant_id'));

CREATE POLICY "tenant_isolation" ON menu_platform_mapping
  USING (tenant_id::text = ((current_setting('request.jwt.claims', true))::json->>'tenant_id'));

CREATE POLICY "tenant_isolation" ON integration_logs
  USING (tenant_id::text = ((current_setting('request.jwt.claims', true))::json->>'tenant_id'));

CREATE POLICY "tenant_isolation" ON platform_order_queue
  USING (tenant_id::text = ((current_setting('request.jwt.claims', true))::json->>'tenant_id'));

-- ============================================================
-- 7. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_delivery_integrations_tenant_branch ON delivery_integrations(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_platform_mapping_item ON menu_platform_mapping(menu_item_id, platform);
CREATE INDEX IF NOT EXISTS idx_menu_platform_mapping_tenant ON menu_platform_mapping(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_tenant ON integration_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_platform ON integration_logs(platform, event_type);
CREATE INDEX IF NOT EXISTS idx_platform_order_queue_status ON platform_order_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_aggregator ON orders(aggregator_platform, aggregator_order_id);
