-- 00003_users_and_roles.sql

CREATE TABLE tenant_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id) ON DELETE SET NULL,
  role            user_role NOT NULL DEFAULT 'waiter',
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  pin_code        TEXT,
  phone           TEXT,
  is_active       BOOLEAN DEFAULT true,
  permissions     JSONB DEFAULT '{}',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Custom JWT claims function (called by Supabase Auth hook)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  claims JSONB;
  tenant_user RECORD;
BEGIN
  SELECT tu.tenant_id, tu.branch_id, tu.role
  INTO tenant_user
  FROM tenant_users tu
  WHERE tu.user_id = (event->>'user_id')::UUID
    AND tu.is_active = true
  LIMIT 1;

  claims := event->'claims';
  IF tenant_user IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(tenant_user.tenant_id));
    claims := jsonb_set(claims, '{branch_id}', to_jsonb(tenant_user.branch_id));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(tenant_user.role::text));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;
