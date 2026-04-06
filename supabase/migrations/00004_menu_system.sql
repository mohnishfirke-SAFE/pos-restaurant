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
