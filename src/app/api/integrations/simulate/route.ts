import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Mock Order Simulator for Zomato / Swiggy
// Simulates incoming orders during development (since sandbox access is restricted)
// ---------------------------------------------------------------------------

const MOCK_ITEMS = [
  { name: "Butter Chicken", price: 400, external_item_id: "ZMT-001" },
  { name: "Chicken Biryani", price: 350, external_item_id: "ZMT-002" },
  { name: "Paneer Tikka", price: 280, external_item_id: "ZMT-003" },
  { name: "Dal Makhani", price: 250, external_item_id: "ZMT-004" },
  { name: "Garlic Naan", price: 60, external_item_id: "ZMT-005" },
  { name: "Veg Thali", price: 300, external_item_id: "ZMT-006" },
  { name: "Masala Dosa", price: 180, external_item_id: "ZMT-007" },
  { name: "Chole Bhature", price: 200, external_item_id: "ZMT-008" },
  { name: "Tandoori Platter", price: 550, external_item_id: "ZMT-009" },
  { name: "Hyderabadi Biryani", price: 380, external_item_id: "ZMT-010" },
];

const MOCK_CUSTOMERS = [
  { name: "Rahul Kumar", phone: "+91-9876543210" },
  { name: "Priya Sharma", phone: "+91-8765432109" },
  { name: "Amit Patel", phone: "+91-7654321098" },
  { name: "Neha Gupta", phone: "+91-6543210987" },
  { name: "Vikram Singh", phone: "+91-9988776655" },
];

const MOCK_DELIVERY_PARTNERS = [
  { name: "Suresh M.", phone: "+91-9111222333" },
  { name: "Raju D.", phone: "+91-9222333444" },
  { name: "Amit S.", phone: "+91-9333444555" },
  { name: "Vinod K.", phone: "+91-9444555666" },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// POST — Generate a simulated order from Zomato or Swiggy
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { tenant_id, branch_id, platform, event } = body;

  if (!tenant_id || !branch_id) {
    return NextResponse.json(
      { error: "tenant_id and branch_id required" },
      { status: 400 }
    );
  }

  const selectedPlatform = platform || randomItem(["zomato", "swiggy"]);
  const selectedEvent = event || "order.placed";

  // Get webhook URL for this integration
  const { data: integration } = await supabase
    .from("delivery_integrations")
    .select("webhook_secret")
    .eq("branch_id", branch_id)
    .eq("platform", selectedPlatform)
    .eq("is_active", true)
    .single();

  // Generate random order
  const numItems = randomInt(1, 4);
  const items = [];
  const usedItems = new Set<number>();

  for (let i = 0; i < numItems; i++) {
    let idx: number;
    do {
      idx = randomInt(0, MOCK_ITEMS.length - 1);
    } while (usedItems.has(idx));
    usedItems.add(idx);

    const item = MOCK_ITEMS[idx];
    const qty = randomInt(1, 3);
    items.push({
      name: item.name,
      quantity: qty,
      price: item.price,
      total: item.price * qty,
      external_item_id: item.external_item_id,
      modifiers: Math.random() > 0.7
        ? [{ name: "Extra Spicy", price: 20 }]
        : [],
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const taxAmount = Math.round(subtotal * 0.05);
  const total = subtotal + taxAmount;

  const customer = randomItem(MOCK_CUSTOMERS);
  const partner = randomItem(MOCK_DELIVERY_PARTNERS);
  const externalId = `${selectedPlatform === "zomato" ? "ZMT" : "SWG"}-${Date.now().toString(36).toUpperCase()}`;

  const simulatedPayload = {
    platform: selectedPlatform,
    event: selectedEvent,
    order: {
      tenant_id,
      branch_id,
      external_id: externalId,
      customer_name: customer.name,
      customer_phone: customer.phone,
      items,
      subtotal,
      tax_amount: taxAmount,
      total,
      delivery_address: {
        line1: `${randomInt(1, 500)} ${randomItem(["MG Road", "Park Street", "Brigade Road", "Anna Salai", "FC Road"])}`,
        city: randomItem(["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"]),
        pincode: `${randomInt(100000, 999999)}`,
      },
      delivery_notes: Math.random() > 0.5
        ? randomItem(["Ring the bell", "Leave at door", "Call before delivery", "No contact delivery"])
        : "",
      pickup_eta: new Date(Date.now() + randomInt(15, 40) * 60_000).toISOString(),
      delivery_partner_name: partner.name,
      delivery_partner_phone: partner.phone,
      platform_commission_pct: selectedPlatform === "zomato" ? 25 : 20,
    },
  };

  // If integration exists, send to our own webhook endpoint
  if (integration) {
    const webhookUrl = `/api/webhooks/aggregator?secret=${integration.webhook_secret}`;

    try {
      // Use internal fetch to hit our own webhook
      const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
      const fullUrl = baseUrl.startsWith("http")
        ? `${baseUrl}${webhookUrl}`
        : `http://${baseUrl}${webhookUrl}`;

      const webhookRes = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulatedPayload),
      });

      const webhookResult = await webhookRes.json();

      return NextResponse.json({
        simulated: true,
        platform: selectedPlatform,
        external_id: externalId,
        customer: customer.name,
        items_count: numItems,
        total,
        webhook_response: webhookResult,
      });
    } catch (err) {
      return NextResponse.json({
        simulated: true,
        platform: selectedPlatform,
        payload: simulatedPayload,
        error: "Could not call webhook — use the payload below to test manually",
        webhook_url: webhookUrl,
      });
    }
  }

  // No integration found — just return the payload for manual testing
  return NextResponse.json({
    simulated: true,
    platform: selectedPlatform,
    payload: simulatedPayload,
    note: "No active integration found. Set up an integration first, or use this payload to POST to /api/webhooks/aggregator manually.",
  });
}

// ---------------------------------------------------------------------------
// GET — List available simulation options
// ---------------------------------------------------------------------------
export async function GET() {
  return NextResponse.json({
    description: "Mock Order Simulator for Zomato & Swiggy",
    usage: "POST with { tenant_id, branch_id, platform?, event? }",
    platforms: ["zomato", "swiggy"],
    events: [
      "order.placed",
      "order.cancelled",
      "delivery.status_update",
    ],
    example: {
      tenant_id: "your-tenant-uuid",
      branch_id: "your-branch-uuid",
      platform: "zomato",
      event: "order.placed",
    },
  });
}
