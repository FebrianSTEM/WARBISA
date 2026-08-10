import { create } from 'zustand';
import type { Product } from '../api/inventoryApi';

export interface CartItem {
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  paymentMethod: 'Cash' | 'QRIS' | 'Transfer';
  paidAmount: number;

  addItem: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomerName: (name: string) => void;
  setPaymentMethod: (method: 'Cash' | 'QRIS' | 'Transfer') => void;
  setPaidAmount: (amount: number) => void;
  getTotalAmount: () => number;
  getChangeAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  paymentMethod: 'Cash',
  paidAmount: 0,

  addItem: (product, quantity = 1) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.productId === product.id);

    if (existingIndex > -1) {
      const existingItem = items[existingIndex];
      const newQty = existingItem.quantity + quantity;

      if (newQty > product.stockQuantity) {
        return false;
      }

      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        subtotal: newQty * existingItem.unitPrice,
      };

      set({ items: updatedItems });
    } else {
      if (quantity > product.stockQuantity) {
        return false;
      }

      const newItem: CartItem = {
        productId: product.id,
        sku: product.sku,
        barcode: product.barcode || '',
        name: product.name,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        quantity: quantity,
        stockQuantity: product.stockQuantity,
        subtotal: quantity * product.sellingPrice,
      };

      set({ items: [...items, newItem] });
    }

    return true;
  },

  updateQuantity: (productId, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const updatedItems = items.map((item) => {
      if (item.productId === productId) {
        const validQty = Math.min(quantity, item.stockQuantity);
        return {
          ...item,
          quantity: validQty,
          subtotal: validQty * item.unitPrice,
        };
      }
      return item;
    });

    set({ items: updatedItems });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.productId !== productId) });
  },

  clearCart: () => {
    set({
      items: [],
      customerName: '',
      paymentMethod: 'Cash',
      paidAmount: 0,
    });
  },

  setCustomerName: (customerName) => set({ customerName }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setPaidAmount: (paidAmount) => set({ paidAmount }),

  getTotalAmount: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getChangeAmount: () => {
    const total = get().getTotalAmount();
    const paid = get().paidAmount;
    return Math.max(0, paid - total);
  },
}));
