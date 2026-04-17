"use client";

import { useState, useMemo } from "react";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Receipt,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils/currency";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onComplete: (method: "cash" | "card" | "upi") => void;
  loading?: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onComplete,
  loading = false,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<"cash" | "card" | "upi">("cash");
  const [amountTendered, setAmountTendered] = useState("");

  const changeDue = useMemo(() => {
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - total);
  }, [amountTendered, total]);

  const canComplete =
    (method !== "cash" || (parseFloat(amountTendered) || 0) >= total) &&
    !loading;

  function handleComplete() {
    onComplete(method);
    setMethod("cash");
    setAmountTendered("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Total due: <span className="font-bold">{formatINR(total)}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Payment method buttons */}
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { key: "cash", label: "Cash", icon: Banknote },
              { key: "card", label: "Card", icon: CreditCard },
              { key: "upi", label: "UPI", icon: Smartphone },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={method === key ? "default" : "outline"}
              className="flex h-20 flex-col gap-2"
              onClick={() => setMethod(key)}
            >
              <Icon className="!h-6 !w-6" />
              {label}
            </Button>
          ))}
        </div>

        {/* Cash-specific fields */}
        {method === "cash" && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount Tendered</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                min={0}
                step={0.01}
                autoFocus
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Change Due</span>
              <span className="text-lg font-bold text-green-600">
                {formatINR(changeDue)}
              </span>
            </div>
          </div>
        )}

        {method === "card" && (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            Waiting for card terminal...
          </div>
        )}

        {method === "upi" && (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            Scan QR or enter UPI reference after payment
          </div>
        )}

        <DialogFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={!canComplete}
            onClick={handleComplete}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Receipt className="mr-2 h-4 w-4" />
            )}
            Complete Payment &mdash; {formatINR(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
