import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../store/useCartStore';
import type { Product } from '../api/inventoryApi';

const sampleProduct: Product = {
  id: 'prod-1',
  warungId: 'w1',
  sku: 'SKU-001',
  barcode: '899000111222',
  name: 'Beras Super 5kg',
  categoryName: 'Sembako',
  unit: 'Pack',
  costPrice: 60000,
  sellingPrice: 70000,
  stockQuantity: 10,
  minStockThreshold: 2,
  isActive: true,
};

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should add product to cart', () => {
    const success = useCartStore.getState().addItem(sampleProduct, 2);
    expect(success).toBe(true);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prod-1');
    expect(items[0].quantity).toBe(2);
    expect(items[0].subtotal).toBe(140000);
  });

  it('should prevent adding quantity exceeding available stock', () => {
    const success = useCartStore.getState().addItem(sampleProduct, 15);
    expect(success).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('should calculate total amount and cash change amount correctly', () => {
    useCartStore.getState().addItem(sampleProduct, 2);
    useCartStore.getState().setPaymentMethod('Cash');
    useCartStore.getState().setPaidAmount(150000);

    expect(useCartStore.getState().getTotalAmount()).toBe(140000);
    expect(useCartStore.getState().getChangeAmount()).toBe(10000);
  });

  it('should remove item when quantity is updated to 0', () => {
    useCartStore.getState().addItem(sampleProduct, 1);
    useCartStore.getState().updateQuantity('prod-1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
