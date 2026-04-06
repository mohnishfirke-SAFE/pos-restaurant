-- 00014_indexes_and_functions.sql

-- Performance indexes
CREATE INDEX idx_orders_tenant_branch ON orders(tenant_id, branch_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(tenant_id, branch_id, status) WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_kots_branch_status ON kots(tenant_id, branch_id, status) WHERE status != 'served';
CREATE INDEX idx_menu_items_tenant_cat ON menu_items(tenant_id, category_id, is_active);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX idx_branch_stock_low ON branch_stock(branch_id, ingredient_id) WHERE current_stock <= min_stock_level;
CREATE INDEX idx_reservations_date ON reservations(tenant_id, branch_id, reservation_date);
CREATE INDEX idx_audit_logs_entity ON audit_logs(tenant_id, entity_type, entity_id, created_at DESC);
CREATE INDEX idx_stock_movements_ref ON stock_movements(reference_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenant_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON kots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
