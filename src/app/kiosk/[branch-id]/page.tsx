"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";

export default function KioskWelcomePage() {
  const { "branch-id": branchId } = useParams();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      <div className="text-center space-y-8">
        <UtensilsCrossed className="mx-auto h-20 w-20 text-primary" />
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Welcome</h1>
          <p className="mt-3 text-xl text-zinc-400">Place your order here</p>
        </div>
        <div className="flex gap-6">
          <Link href={`/kiosk/${branchId}/menu?type=dine_in`}>
            <Button size="lg" className="h-32 w-48 flex-col gap-3 text-lg rounded-2xl bg-white text-black hover:bg-zinc-200">
              <span className="text-3xl">🍽️</span>
              Dine In
            </Button>
          </Link>
          <Link href={`/kiosk/${branchId}/menu?type=takeaway`}>
            <Button size="lg" className="h-32 w-48 flex-col gap-3 text-lg rounded-2xl bg-white text-black hover:bg-zinc-200">
              <span className="text-3xl">🥡</span>
              Takeaway
            </Button>
          </Link>
        </div>
        <div className="flex gap-4 pt-8">
          <Button variant="ghost" className="text-zinc-500">English</Button>
          <Button variant="ghost" className="text-zinc-500">हिन्दी</Button>
        </div>
      </div>
    </div>
  );
}
