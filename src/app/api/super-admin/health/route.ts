import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  // Test DB connection with a lightweight query
  const { error: dbError } = await supabase.from("tenants").select("id").limit(1);

  const dbLatency = Date.now() - startTime;

  if (dbError) {
    return NextResponse.json({
      status: "unhealthy",
      dbLatency,
      error: dbError.message,
      logs: [],
    });
  }

  // Fetch last 20 audit logs
  const { data: logs, error: logsError } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, created_at, tenant_id")
    .order("created_at", { ascending: false })
    .limit(20);

  if (logsError) {
    return NextResponse.json({
      status: "degraded",
      dbLatency,
      logsError: logsError.message,
      logs: [],
    });
  }

  return NextResponse.json({
    status: "healthy",
    dbLatency,
    logs: (logs ?? []).map((l) => ({
      id: l.id,
      action: l.action,
      entity_type: l.entity_type,
      time: l.created_at
        ? new Date(l.created_at).toLocaleTimeString("en-IN", { hour12: false })
        : "",
      date: l.created_at
        ? new Date(l.created_at).toLocaleDateString("en-IN")
        : "",
      tenant_id: l.tenant_id,
    })),
  });
}
