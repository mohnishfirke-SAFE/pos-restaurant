import { create } from "zustand";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: { id: string; name: string; price: number }[];
  notes: string;
  gstRate: number;
}

interface POSState {
  orderType: "dine_in" | "takeaway" | "delivery";
  tableId: string | null;
  customerId: string | null;
  cartItems: CartItem[];
  discountAmount: number;
  discountId: string | null;
  setOrderType: (type: "dine_in" | "takeaway" | "delivery") => void;
  setTableId: (id: string | null) => void;
  setCustomerId: (id: string | null) => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  applyDiscount: (amount: number, discountId: string | null) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTaxBreakdown: () => { cgst: number; sgst: number; total: number };
  getTotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  orderType: "dine_in",
  tableId: null,
  customerId: null,
  cartItems: [],
  discountAmount: 0,
  discountId: null,

  setOrderType: (type) => set({ orderType: type }),
  setTableId: (id) => set({ tableId: id }),
  setCustomerId: (id) => set({ customerId: id }),

  addItem: (item) =>
    set((state) => {
      const existing = state.cartItems.find(
        (ci) =>
          ci.menuItemId === item.menuItemId &&
          JSON.stringify(ci.modifiers) === JSON.stringify(item.modifiers)
      );
      if (existing) {
        return {
          cartItems: state.cartItems.map((ci) =>
            ci.id === existing.id
              ? { ...ci, quantity: ci.quantity + item.quantity }
              : ci
          ),
        };
      }
      return {
        cartItems: [
          ...state.cartItems,
          { ...item, id: crypto.randomUUID() },
        ],
      };
    }),

  removeItem: (id) =>
    set((state) => ({
      cartItems: state.cartItems.filter((ci) => ci.id !== id),
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      cartItems:
        quantity <= 0
          ? state.cartItems.filter((ci) => ci.id !== id)
          : state.cartItems.map((ci) =>
              ci.id === id ? { ...ci, quantity } : ci
            ),
    })),

  updateNotes: (id, notes) =>
    set((state) => ({
      cartItems: state.cartItems.map((ci) =>
        ci.id === id ? { ...ci, notes } : ci
      ),
    })),

  applyDiscount: (amount, discountId) => set({ discountAmount: amount, discountId }),

  clearCart: () =>
    set({
      cartItems: [],
      tableId: null,
      customerId: null,
      discountAmount: 0,
      discountId: null,
    }),

  getSubtotal: () => {
    const { cartItems } = get();
    return cartItems.reduce((sum, item) => {
      const modifierTotal = item.modifiers.reduce((m, mod) => m + mod.price, 0);
      return sum + (item.price + modifierTotal) * item.quantity;
    }, 0);
  },

  getTaxBreakdown: () => {
    const { cartItems } = get();
    let totalCgst = 0;
    let totalSgst = 0;
    cartItems.forEach((item) => {
      const itemTotal = (item.price + item.modifiers.reduce((m, mod) => m + mod.price, 0)) * item.quantity;
      const tax = (itemTotal * item.gstRate) / 100;
      totalCgst += tax / 2;
      totalSgst += tax / 2;
    });
    return {
      cgst: Math.round(totalCgst * 100) / 100,
      sgst: Math.round(totalSgst * 100) / 100,
      total: Math.round((totalCgst + totalSgst) * 100) / 100,
    };
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const { total: tax } = get().getTaxBreakdown();
    const { discountAmount } = get();
    return Math.round((subtotal + tax - discountAmount) * 100) / 100;
  },
}));
