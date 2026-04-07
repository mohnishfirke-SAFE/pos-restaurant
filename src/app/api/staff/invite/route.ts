import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST — Invite a new staff member (creates Supabase auth user + tenant_users entry)
export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name, phone, role, tenant_id, branch_id } = body;

  if (!email || !password || !name || !role || !tenant_id || !branch_id) {
    return NextResponse.json(
      { error: "email, password, name, role, tenant_id, and branch_id are required" },
      { status: 400 }
    );
  }

  const validRoles = ["branch_manager", "cashier", "waiter", "kitchen_staff"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 1. Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm so they can login immediately
    user_metadata: {
      display_name: name,
      phone,
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // 2. Create tenant_users entry linking user to tenant + branch + role
  const { error: linkError } = await supabase.from("tenant_users").insert({
    user_id: authData.user.id,
    tenant_id,
    branch_id,
    role,
    display_name: name,
    phone: phone || null,
    is_active: true,
  });

  if (linkError) {
    // Rollback: delete the auth user if linking fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    user_id: authData.user.id,
    email,
    role,
    message: `Staff member ${name} created. They can login with email: ${email}`,
  });
}

// GET — List all staff for the current tenant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_users")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH — Update staff member (role, branch, active status)
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, role, branch_id, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (role !== undefined) updates.role = role;
  if (branch_id !== undefined) updates.branch_id = branch_id;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase
    .from("tenant_users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — Remove staff member (deactivate auth user + delete tenant_users entry)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get the user_id before deleting
  const { data: staff } = await supabase
    .from("tenant_users")
    .select("user_id")
    .eq("id", id)
    .single();

  // Delete tenant_users entry
  const { error } = await supabase.from("tenant_users").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deactivate the auth user (ban instead of delete to preserve audit trail)
  if (staff?.user_id) {
    await supabase.auth.admin.updateUserById(staff.user_id, {
      ban_duration: "876600h", // ~100 years = effectively permanent
    });
  }

  return NextResponse.json({ success: true });
}
