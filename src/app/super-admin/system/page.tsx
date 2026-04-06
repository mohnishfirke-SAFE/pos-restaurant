"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Cpu, HardDrive } from "lucide-react";

const healthChecks = [
  { name: "Database (Supabase)", status: "healthy", latency: "12ms", icon: Database },
  { name: "API Server", status: "healthy", latency: "45ms", icon: Activity },
  { name: "Worker Processes", status: "healthy", latency: "2 active", icon: Cpu },
  { name: "Storage", status: "healthy", latency: "78% free", icon: HardDrive },
];

const recentLogs = [
  { time: "10:45:23", level: "INFO", message: "Tenant 'Spice Garden' synced menu to Zomato" },
  { time: "10:42:11", level: "WARN", message: "High query latency detected (>200ms) on orders table" },
  { time: "10:38:05", level: "INFO", message: "New tenant 'Chai Point' registered (trial)" },
  { time: "10:35:40", level: "ERROR", message: "Payment webhook timeout for order ORD-MUM01-00089" },
  { time: "10:30:15", level: "INFO", message: "Nightly backup completed successfully" },
];

export default function SystemPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Health</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {healthChecks.map((check) => {
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
      <Card>
        <CardHeader><CardTitle>Recent Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            {recentLogs.map((log, i) => (
              <div key={i} className="flex gap-3 rounded-md bg-muted/50 p-2">
                <span className="text-muted-foreground">{log.time}</span>
                <Badge variant={log.level === "ERROR" ? "destructive" : log.level === "WARN" ? "secondary" : "outline"} className="text-[10px]">
                  {log.level}
                </Badge>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
