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
