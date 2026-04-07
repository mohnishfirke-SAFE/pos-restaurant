import { NextResponse } from "next/server";
import { Client } from "pg";

// TEMPORARY — runs migration 00015 via direct DB connection from Vercel
// Will be deleted after migration completes
export async function POST(request: Request) {
  const body = await request.json();
  const { secret } = body;
  if (secret !== "migrate-00015-zomato-swiggy") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectRef = "sioshhykphwbuymzvikl";
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || body.db_password || "postgres";

  interface ConnConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    label: string;
  }

  const connections: ConnConfig[] = [
    // New Supabase pooler format (project-ref based hostname)
    { host: `${projectRef}.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: "postgres", label: "pooler-session:5432" },
    { host: `${projectRef}.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}`, password: dbPassword, database: "postgres", label: "pooler-transaction:6543" },
    // Direct connection
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: "postgres", password: dbPassword, database: "postgres", label: "direct:5432" },
    // Old pooler format (region-based) - ap-south-1 most likely for India
    { host: "aws-0-ap-south-1.pooler.supabase.com", port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: "postgres", label: "old-pooler-ap-south-1:5432" },
    { host: "aws-0-ap-south-1.pooler.supabase.com", port: 6543, user: `postgres.${projectRef}`, password: dbPassword, database: "postgres", label: "old-pooler-ap-south-1:6543" },
  ];

  const results: Array<{ step: string; status: string; error?: string }> = [];
  let client: Client | null = null;
  let connError = "";

  for (const conn of connections) {
    try {
      const c = new Client({
        host: conn.host,
        port: conn.port,
        user: conn.user,
        password: conn.password,
        database: conn.database,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      await c.connect();
      client = c;
      results.push({ step: "connect", status: "success", error: conn.label });
      break;
    } catch (err) {
      connError = err instanceof Error ? err.message : String(err);
      results.push({ step: `connect:${conn.label}`, status: "failed", error: connError });
    }
  }

  if (!client) {
    return NextResponse.json({
      success: false,
      total: results.length,
      failed: results.length,
      results,
      hint: "Provide db_password in request body",
    });
  }

  try {

    // Run migration statements one by one
    const statements: Array<{ name: string; sql: string }> = [
      { name: "orders.source", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'dine_in'" },
      { name: "orders.external_platform_status", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_platform_status TEXT" },
      { name: "orders.delivery_partner_name", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_name TEXT" },
      { name: "orders.delivery_partner_phone", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_phone TEXT" },
      { name: "orders.delivery_partner_eta", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_eta TIMESTAMPTZ" },
      { name: "orders.platform_commission_pct", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_commission_pct DECIMAL(5,2) DEFAULT 0" },
      { name: "orders.platform_commission_amount", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_commission_amount DECIMAL(10,2) DEFAULT 0" },
      { name: "orders.auto_accepted", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_accepted BOOLEAN DEFAULT false" },
      { name: "orders.accepted_at", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ" },
      { name: "orders.rejected_at", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ" },
      { name: "orders.rejection_reason", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT" },
      { name: "orders.pickup_eta", sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_eta TIMESTAMPTZ" },
      {
        name: "delivery_integrations",
        sql: `CREATE TABLE IF NOT EXISTS delivery_integrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
          platform aggregator_platform NOT NULL,
          api_key TEXT NOT NULL,
          api_secret TEXT,
          merchant_id TEXT,
          webhook_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
          is_active BOOLEAN DEFAULT true,
          auto_accept BOOLEAN DEFAULT false,
          auto_accept_seconds INT DEFAULT 0,
          default_commission_pct DECIMAL(5,2) DEFAULT 0,
          store_status TEXT DEFAULT 'open',
          connected_at TIMESTAMPTZ DEFAULT NOW(),
          last_synced_at TIMESTAMPTZ,
          config JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(tenant_id, branch_id, platform)
        )`,
      },
      {
        name: "menu_platform_mapping",
        sql: `CREATE TABLE IF NOT EXISTS menu_platform_mapping (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
          platform aggregator_platform NOT NULL,
          platform_item_id TEXT,
          platform_category_id TEXT,
          is_available BOOLEAN DEFAULT true,
          is_synced BOOLEAN DEFAULT false,
          last_synced_at TIMESTAMPTZ,
          price_override DECIMAL(10,2),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(menu_item_id, platform)
        )`,
      },
      {
        name: "integration_logs",
        sql: `CREATE TABLE IF NOT EXISTS integration_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          integration_id UUID REFERENCES delivery_integrations(id) ON DELETE SET NULL,
          platform aggregator_platform NOT NULL,
          event_type TEXT NOT NULL,
          direction TEXT NOT NULL DEFAULT 'inbound',
          payload JSONB DEFAULT '{}',
          response JSONB DEFAULT '{}',
          status TEXT DEFAULT 'success',
          error_message TEXT,
          http_status INT,
          latency_ms INT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
      },
      {
        name: "platform_order_queue",
        sql: `CREATE TABLE IF NOT EXISTS platform_order_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
          platform aggregator_platform NOT NULL,
          external_order_id TEXT NOT NULL,
          raw_payload JSONB NOT NULL,
          status TEXT DEFAULT 'pending',
          retry_count INT DEFAULT 0,
          max_retries INT DEFAULT 3,
          order_id UUID REFERENCES orders(id),
          error_message TEXT,
          processed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
      },
      { name: "rls_delivery_integrations", sql: "ALTER TABLE delivery_integrations ENABLE ROW LEVEL SECURITY" },
      { name: "rls_menu_platform_mapping", sql: "ALTER TABLE menu_platform_mapping ENABLE ROW LEVEL SECURITY" },
      { name: "rls_integration_logs", sql: "ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY" },
      { name: "rls_platform_order_queue", sql: "ALTER TABLE platform_order_queue ENABLE ROW LEVEL SECURITY" },
      {
        name: "policy_delivery_integrations",
        sql: `DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_integrations' AND policyname='tenant_isolation') THEN
            CREATE POLICY "tenant_isolation" ON delivery_integrations USING (tenant_id::text = ((current_setting('request.jwt.claims', true))::json->>'tenant_id'));
          END IF;
        END $$`,
      },
      {
        name: "policy_menu_platform_mapping",
        sql: `DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='menu_platform_mapping' AND policyname='tenant_isolation') THEN
            CREATE POLICY "tenant_isolation" ON menu_platform_mapping USING (tenant_id::text = ((current_setting('request.jwt.claims', true))::json->>'tenant_id'));
          END IF;
        END $$`,
      },
      {
        name: "policy_integration_logs",
        sql: `DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='integration_logs' AND policyname='tenant_isolation') THEN
            CREATE POLICY "tenant_isolation" ON integration_logs USING (tenant_id::text = ((current_setting('request.jwt.claims', true))::json->>'tenant_id'));
          END IF;
        END $$`,
      },
      {
        name: "policy_platform_order_queue",
        sql: `DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_order_queue' AND policyname='tenant_isolation') THEN
            CREATE POLICY "tenant_isolation" ON platform_order_queue USING (tenant_id::text = ((current_setting('request.jwt.claims', true))::json->>'tenant_id'));
          END IF;
        END $$`,
      },
      { name: "idx_delivery_integrations", sql: "CREATE INDEX IF NOT EXISTS idx_delivery_integrations_tenant_branch ON delivery_integrations(tenant_id, branch_id)" },
      { name: "idx_menu_platform_mapping_item", sql: "CREATE INDEX IF NOT EXISTS idx_menu_platform_mapping_item ON menu_platform_mapping(menu_item_id, platform)" },
      { name: "idx_menu_platform_mapping_tenant", sql: "CREATE INDEX IF NOT EXISTS idx_menu_platform_mapping_tenant ON menu_platform_mapping(tenant_id)" },
      { name: "idx_integration_logs_tenant", sql: "CREATE INDEX IF NOT EXISTS idx_integration_logs_tenant ON integration_logs(tenant_id, created_at DESC)" },
      { name: "idx_integration_logs_platform", sql: "CREATE INDEX IF NOT EXISTS idx_integration_logs_platform ON integration_logs(platform, event_type)" },
      { name: "idx_platform_order_queue", sql: "CREATE INDEX IF NOT EXISTS idx_platform_order_queue_status ON platform_order_queue(status, created_at)" },
      { name: "idx_orders_source", sql: "CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source)" },
      { name: "idx_orders_aggregator", sql: "CREATE INDEX IF NOT EXISTS idx_orders_aggregator ON orders(aggregator_platform, aggregator_order_id)" },
    ];

    for (const stmt of statements) {
      try {
        await client.query(stmt.sql);
        results.push({ step: stmt.name, status: "success" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ step: stmt.name, status: "error", error: msg });
      }
    }

    // Verify
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('delivery_integrations','menu_platform_mapping','integration_logs','platform_order_queue') ORDER BY table_name"
    );
    results.push({ step: "verify_tables", status: "success", error: tables.rows.map((r: { table_name: string }) => r.table_name).join(", ") });

    await client.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ step: "connection", status: "error", error: msg });
  }

  const failed = results.filter((r) => r.status === "error");
  return NextResponse.json({
    success: failed.length === 0,
    total: results.length,
    failed: failed.length,
    results,
  });
}
