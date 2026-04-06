"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/currency";
import { CreditCard, Smartphone, Banknote, Loader2 } from "lucide-react";

export default function KioskCheckoutPage() {
  const { "branch-id": branchId } = useParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const total = 1386;

  function handlePay() {
    setProcessing(true);
    setTimeout(() => {
      router.push(`/kiosk/${branchId}/confirmation`);
    }, 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Payment</h1>
          <p className="mt-2 text-xl text-zinc-400">Total: {formatINR(total)}</p>
        </div>

        <div className="grid gap-3">
          {[
            { id: "upi", label: "UPI / QR Code", icon: Smartphone, desc: "Pay using PhonePe, GPay, Paytm" },
            { id: "card", label: "Card", icon: CreditCard, desc: "Credit or Debit card" },
            { id: "cash", label: "Pay at Counter", icon: Banknote, desc: "Collect a token number" },
          ].map((method) => {
            const Icon = method.icon;
            return (
              <Card
                key={method.id}
                className={`cursor-pointer transition ${selectedMethod === method.id ? "border-primary bg-zinc-800" : "border-zinc-800 bg-zinc-900"}`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{method.label}</p>
                    <p className="text-sm text-zinc-400">{method.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedMethod === "upi" && (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader><CardTitle className="text-center text-sm text-zinc-400">Scan QR to pay</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-white text-black">
                <span className="text-center text-sm font-medium">UPI QR Code<br />Placeholder</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full h-14 text-lg rounded-xl"
          disabled={!selectedMethod || processing}
          onClick={handlePay}
        >
          {processing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</> : `Pay ${formatINR(total)}`}
        </Button>
      </div>
    </div>
  );
}
