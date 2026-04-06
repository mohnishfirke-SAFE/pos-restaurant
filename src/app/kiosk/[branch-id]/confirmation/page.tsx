"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function KioskConfirmationPage() {
  const { "branch-id": branchId } = useParams();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <div className="text-center space-y-6">
        <CheckCircle2 className="mx-auto h-24 w-24 text-green-500" />
        <div>
          <h1 className="text-4xl font-bold">Order Placed!</h1>
          <p className="mt-2 text-xl text-zinc-400">Thank you for your order</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-6">
          <p className="text-sm text-zinc-400">Your Order Number</p>
          <p className="text-5xl font-bold text-primary mt-2">ORD-042</p>
        </div>
        <div className="space-y-2">
          <p className="text-zinc-400">Estimated preparation time</p>
          <p className="text-2xl font-semibold">15-20 minutes</p>
        </div>
        <Button
          size="lg"
          className="h-14 rounded-xl text-lg mt-8"
          onClick={() => router.push(`/kiosk/${branchId}`)}
        >
          Place Another Order
        </Button>
      </div>
    </div>
  );
}
