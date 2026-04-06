-- 00013_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions to extract tenant_id and role from JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT (current_setting('request.jwt.claims', true)::JSONB ->> 'tenant_id')::UUID;
$$;

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::JSONB ->> 'user_role';
$$;

-- Tenant isolation policies (applied to all tenant-scoped tables)
CREATE POLICY "tenant_isolation" ON tenants FOR ALL
  USING (id = auth.tenant_id() OR auth.user_role() = 'super_admin');

CREATE POLICY "tenant_isolation" ON branches FOR ALL
  USING (tenant_id = auth.tenant_id() OR auth.user_role() = 'super_admin');

CREATE POLICY "tenant_isolation" ON tenant_users FOR ALL
  USING (tenant_id = auth.tenant_id() OR auth.user_role() = 'super_admin');

CREATE POLICY "tenant_isolation" ON menu_categories FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON menu_items FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON modifier_groups FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON modifiers FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON combo_deals FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON restaurant_tables FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON reservations FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON orders FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON order_items FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON kots FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON payments FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON cash_drawer_sessions FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON customers FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON loyalty_transactions FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON loyalty_config FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON gift_cards FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON promotions FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON ingredients FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON branch_stock FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON recipes FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON stock_movements FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON suppliers FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON purchase_orders FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON shifts FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON attendance_log FOR ALL
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "tenant_isolation" ON audit_logs FOR ALL
  USING (tenant_id = auth.tenant_id() OR auth.user_role() = 'super_admin');

-- Join table policies (no tenant_id directly, use FK)
CREATE POLICY "tenant_isolation" ON menu_item_branches FOR ALL
  USING (EXISTS (
    SELECT 1 FROM menu_items mi WHERE mi.id = menu_item_id AND mi.tenant_id = auth.tenant_id()
  ));

CREATE POLICY "tenant_isolation" ON menu_item_modifier_groups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM menu_items mi WHERE mi.id = menu_item_id AND mi.tenant_id = auth.tenant_id()
  ));

CREATE POLICY "tenant_isolation" ON combo_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM combo_deals cd WHERE cd.id = combo_id AND cd.tenant_id = auth.tenant_id()
  ));

CREATE POLICY "tenant_isolation" ON purchase_order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_id AND po.tenant_id = auth.tenant_id()
  ));
