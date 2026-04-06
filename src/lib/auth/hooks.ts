"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole, JWTClaims } from "@/types";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
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

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}

export function useJWTClaims(): JWTClaims | null {
  const [claims, setClaims] = useState<JWTClaims | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getClaims = async () => {
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
  }, [supabase]);

  return claims;
}

export function useRole(): UserRole | null {
  const claims = useJWTClaims();
  return claims?.user_role ?? null;
}

export function useTenantId(): string | null {
  const claims = useJWTClaims();
  return claims?.tenant_id ?? null;
}

export function useBranchId(): string | null {
  const claims = useJWTClaims();
  return claims?.branch_id ?? null;
}
