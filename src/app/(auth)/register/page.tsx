"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    restaurantName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          restaurant_name: formData.restaurantName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create tenant and tenant_user via a server action or API route
      const slug = formData.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: tenant, error: tenantError } = await db
        .from("tenants")
        .insert({
          name: formData.restaurantName,
          slug: slug + "-" + Date.now().toString(36),
          email: formData.email,
        })
        .select()
        .single();

      if (tenantError || !tenant) {
        setError("Account created but failed to set up restaurant. Please contact support.");
        setLoading(false);
        return;
      }

      // Create default branch
      const { data: branch } = await db
        .from("branches")
        .insert({
          tenant_id: tenant.id,
          name: "Main Branch",
          code: "MAIN",
        })
        .select()
        .single();

      // Link user to tenant as owner
      await db.from("tenant_users").insert({
        user_id: authData.user.id,
        tenant_id: tenant.id,
        branch_id: branch?.id ?? null,
        role: "tenant_owner",
        display_name: formData.restaurantName,
      });

      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Set up your restaurant on RestoPOS
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <Input
              id="restaurantName"
              placeholder="Your Restaurant Name"
              value={formData.restaurantName}
              onChange={(e) => updateField("restaurantName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@restaurant.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Create Account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
