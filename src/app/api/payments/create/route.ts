import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  // In production, create a Razorpay order here
  // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
  // const order = await razorpay.orders.create({ amount: body.amount * 100, currency: 'INR' });

  const mockOrder = {
    id: `order_${Date.now()}`,
    amount: body.amount * 100,
    currency: "INR",
    status: "created",
  };

  return NextResponse.json(mockOrder);
}
