"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CombosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Combo Deals</h1>
        <p className="text-muted-foreground">
          Create bundled meal deals and combo offers
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Combo Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Combo deal management will be implemented here. Bundle menu items
            together at a discounted price.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
