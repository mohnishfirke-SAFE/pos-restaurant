"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBranchStore } from "@/stores/branch-store";
import { useTenantId } from "@/lib/auth/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  code: string;
}

export function BranchSwitcher() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const { activeBranchId, setActiveBranch } = useBranchStore();
  const tenantId = useTenantId();
  const supabase = createClient();

  useEffect(() => {
    if (!tenantId) return;

    async function loadBranches() {
      const { data } = await supabase
        .from("branches")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");

      if (data && data.length > 0) {
        setBranches(data);
        if (!activeBranchId) {
          setActiveBranch(data[0].id, data[0].name);
        }
      }
    }

    loadBranches();
  }, [tenantId, supabase, activeBranchId, setActiveBranch]);

  if (branches.length === 0) return null;

  return (
    <Select
      value={activeBranchId ?? undefined}
      onValueChange={(value) => {
        const branch = branches.find((b) => b.id === value);
        if (branch) setActiveBranch(branch.id, branch.name);
      }}
    >
      <SelectTrigger className="w-full">
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name} ({branch.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
