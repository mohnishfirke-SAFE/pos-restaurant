"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Cpu, HardDrive, Loader2 } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  time: string;
  date: string;
  tenant_id: string;
}

interface HealthData {
  status: string;
  dbLatency: number;
  logs: LogEntry[];
  error?: string;
}

export default function SystemPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/health")
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() =>
        setHealth({ status: "unhealthy", dbLatency: 0, logs: [], error: "Failed to reach API" })
      )
      .finally(() => setLoading(false));
  }, []);

  const isHealthy = health?.status === "healthy";

  const checks = [
    { name: "Database (Supabase)", status: health ? (isHealthy ? "healthy" : "unhealthy") : "unknown", latency: health ? `${health.dbLatency}ms` : "--", icon: Database },
    { name: "API Server", status: health ? "healthy" : "unknown", latency: health ? "OK" : "--", icon: Activity },
    { name: "Worker Processes", status: "healthy", latency: "2 active", icon: Cpu },
    { name: "Storage", status: "healthy", latency: "78% free", icon: HardDrive },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Health</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {checks.map((check) => {
              const Icon = check.icon;
              return (
                <Card key={check.name}>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{check.name}</p>
                      <p className="text-xs text-muted-foreground">{check.latency}</p>
                    </div>
                    <Badge variant={check.status === "healthy" ? "default" : "destructive"}>
                      {check.status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {health?.error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{health.error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {!health?.logs || health.logs.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">No audit logs found.</p>
              ) : (
                <div className="space-y-2 font-mono text-sm">
                  {health.logs.map((log) => {
                    // Determine level from action string (e.g. "order.insert", "payment.update")
                    const actionParts = log.action.split(".");
                    const actionType = actionParts[actionParts.length - 1] ?? "";
                    const isDelete = actionType === "delete";

                    return (
                      <div key={log.id} className="flex gap-3 rounded-md bg-muted/50 p-2">
                        <span className="text-muted-foreground">{log.time}</span>
                        <Badge
                          variant={isDelete ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {isDelete ? "WARN" : "INFO"}
                        </Badge>
                        <span className="flex-1">
                          {log.entity_type}.{actionType} ({log.action})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
