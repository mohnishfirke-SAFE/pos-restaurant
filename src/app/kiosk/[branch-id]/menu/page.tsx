"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatINR } from "@/lib/utils/currency";
import { ShoppingCart, Plus, Minus, ArrowLeft } from "lucide-react";

interface KioskCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const mockCategories = ["Starters", "Mains", "Breads", "Rice", "Drinks", "Desserts"];
const mockItems = [
  { id: "1", name: "Paneer Tikka", price: 320, category: "Starters", isVeg: true, image: null },
  { id: "2", name: "Chicken 65", price: 350, category: "Starters", isVeg: false, image: null },
  { id: "3", name: "Butter Chicken", price: 420, category: "Mains", isVeg: false, image: null },
  { id: "4", name: "Dal Makhani", price: 280, category: "Mains", isVeg: true, image: null },
  { id: "5", name: "Palak Paneer", price: 300, category: "Mains", isVeg: true, image: null },
  { id: "6", name: "Chicken Biryani", price: 380, category: "Rice", isVeg: false, image: null },
  { id: "7", name: "Butter Naan", price: 60, category: "Breads", isVeg: true, image: null },
  { id: "8", name: "Garlic Naan", price: 80, category: "Breads", isVeg: true, image: null },
  { id: "9", name: "Mango Lassi", price: 120, category: "Drinks", isVeg: true, image: null },
  { id: "10", name: "Gulab Jamun", price: 150, category: "Desserts", isVeg: true, image: null },
];

export default function KioskMenuPage() {
  const { "branch-id": branchId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderType = searchParams.get("type") || "dine_in";
  const [activeCategory, setActiveCategory] = useState("Starters");
  const [cart, setCart] = useState<KioskCartItem[]>([]);

  const filteredItems = mockItems.filter((i) => i.category === activeCategory);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  function addToCart(item: typeof mockItems[0]) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) return prev.map((ci) => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev.map((ci) => ci.id === id ? { ...ci, quantity: Math.max(0, ci.quantity + delta) } : ci).filter((ci) => ci.quantity > 0)
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <Button variant="ghost" onClick={() => router.push(`/kiosk/${branchId}`)}>
          <ArrowLeft className="mr-2 h-5 w-5" />Back
        </Button>
        <h1 className="text-xl font-bold">Menu</h1>
        <Badge variant="secondary" className="text-sm">{orderType === "dine_in" ? "Dine In" : "Takeaway"}</Badge>
      </div>

      {/* Categories */}
      <ScrollArea className="border-b border-zinc-800">
        <div className="flex gap-2 px-6 py-3">
          {mockCategories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "secondary"}
              className="rounded-full whitespace-nowrap"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Items Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => {
            const inCart = cart.find((ci) => ci.id === item.id);
            return (
              <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600">
                <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-zinc-800 text-4xl">
                  {item.isVeg ? "🥬" : "🍗"}
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-zinc-400">{formatINR(item.price)}</p>
                  </div>
                  <Badge variant={item.isVeg ? "default" : "destructive"} className="text-[10px]">
                    {item.isVeg ? "VEG" : "NON-VEG"}
                  </Badge>
                </div>
                <div className="mt-3">
                  {inCart ? (
                    <div className="flex items-center justify-between rounded-lg bg-zinc-800 p-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQty(item.id, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold">{inCart.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQty(item.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full rounded-lg" onClick={() => addToCart(item)}>
                      <Plus className="mr-1 h-4 w-4" />Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Footer */}
      {cartCount > 0 && (
        <div className="border-t border-zinc-800 bg-zinc-900 px-6 py-4">
          <Button
            className="w-full h-14 text-lg rounded-xl"
            onClick={() => router.push(`/kiosk/${branchId}/cart?type=${orderType}`)}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            View Cart ({cartCount} items) - {formatINR(cartTotal)}
          </Button>
        </div>
      )}
    </div>
  );
}
