"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ModifiersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modifier Groups</h1>
        <p className="text-muted-foreground">
          Configure item customization options (size, spice level, add-ons)
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Modifier Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Modifier management will be implemented here. Create groups like
            &quot;Size&quot;, &quot;Spice Level&quot;, &quot;Add-ons&quot; with options and price adjustments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
