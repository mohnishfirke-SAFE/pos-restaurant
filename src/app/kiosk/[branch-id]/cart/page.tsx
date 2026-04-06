"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/utils/currency";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";

const mockCart = [
  { id: "1", name: "Butter Chicken", price: 420, quantity: 2 },
  { id: "2", name: "Butter Naan", price: 60, quantity: 4 },
  { id: "3", name: "Mango Lassi", price: 120, quantity: 2 },
];

export default function KioskCartPage() {
  const { "branch-id": branchId } = useParams();
  const router = useRouter();

  const subtotal = mockCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + gst;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <div className="flex items-center gap-4 border-b border-zinc-800 px-6 py-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-5 w-5" />Back
        </Button>
        <h1 className="text-xl font-bold">Your Cart</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-lg space-y-4">
          {mockCart.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-zinc-400">{formatINR(item.price)} each</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Minus className="h-4 w-4" /></Button>
                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
                </div>
                <span className="w-24 text-right font-semibold">{formatINR(item.price * item.quantity)}</span>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-zinc-500" /></Button>
              </div>
            </div>
          ))}

          <Separator className="bg-zinc-800" />

          <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">GST (5%)</span>
              <span>{formatINR(gst)}</span>
            </div>
            <Separator className="bg-zinc-800" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="mx-auto max-w-lg">
          <Button className="w-full h-14 text-lg rounded-xl" onClick={() => router.push(`/kiosk/${branchId}/checkout`)}>
            Proceed to Payment - {formatINR(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
