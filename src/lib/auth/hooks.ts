"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole, JWTClaims } from "@/types";

interface TenantUser {
  user_id: string;
  role: UserRole;
  tenant_id: string;
  branch_id: string | null;
  display_name: string;
}

export function useTenantUser(): { tenantUser: TenantUser | null; loading: boolean } {
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setTenantUser(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("tenant_users")
        .select("user_id, role, tenant_id, branch_id, display_name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (!cancelled) {
        setTenantUser(data as TenantUser | null);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tenantUser, loading };
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<ReturnType<typeof Object> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function useJWTClaims(): JWTClaims | null {
  const [claims, setClaims] = useState<JWTClaims | null>(null);

  useEffect(() => {
    const getClaims = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          const payload = JSON.parse(atob(session.access_token.split(".")[1]));
          setClaims({
            tenant_id: payload.tenant_id,
            branch_id: payload.branch_id,
            user_role: payload.user_role,
          });
        } catch {
          setClaims(null);
        }
      }
    };

    getClaims();
  }, []);

  return claims;
}

export function useRole(): UserRole | null {
  const { tenantUser } = useTenantUser();
  return tenantUser?.role ?? null;
}

export function useTenantId(): string | null {
  const { tenantUser } = useTenantUser();
  return tenantUser?.tenant_id ?? null;
}

export function useBranchId(): string | null {
  const { tenantUser } = useTenantUser();
  return tenantUser?.branch_id ?? null;
}
