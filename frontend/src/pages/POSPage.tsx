import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import type { Product, CategoryDTO } from '../api/inventoryApi';
import { posApi } from '../api/posApi';
import type { TransactionReceiptResponse } from '../api/posApi';
import { useCartStore } from '../store/useCartStore';
import { ProductCatalogGrid } from '../components/pos/ProductCatalogGrid';
import { CartDrawer } from '../components/pos/CartDrawer';
import { CameraScannerModal } from '../components/pos/CameraScannerModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { Toast } from '../components/common/Toast';
import type { ToastMessage } from '../components/common/Toast';

// Mock initial data if backend API is not running
const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', warungId: 'w1', sku: 'SKU-1001', barcode: '8991234567890', name: 'Minyak Goreng Bimoli 1L', categoryName: 'Sembako', unit: 'Pcs', costPrice: 16000, sellingPrice: 18500, stockQuantity: 24, minStockThreshold: 5, isActive: true },
  { id: 'p2', warungId: 'w1', sku: 'SKU-1002', barcode: '8999999111111', name: 'Beras Pandan Wangi 5kg', categoryName: 'Sembako', unit: 'Pack', costPrice: 65000, sellingPrice: 72000, stockQuantity: 8, minStockThreshold: 3, isActive: true },
  { id: 'p3', warungId: 'w1', sku: 'SKU-1003', barcode: '8998888222222', name: 'Gula Pasir Gulaku 1kg', categoryName: 'Sembako', unit: 'Pcs', costPrice: 14000, sellingPrice: 16000, stockQuantity: 3, minStockThreshold: 5, isActive: true },
  { id: 'p4', warungId: 'w1', sku: 'SKU-1004', barcode: '8997777333333', name: 'Kopi Kapal Api Special 165g', categoryName: 'Minuman', unit: 'Pcs', costPrice: 11000, sellingPrice: 13500, stockQuantity: 15, minStockThreshold: 4, isActive: true },
  { id: 'p5', warungId: 'w1', sku: 'SKU-1005', barcode: '8996666444444', name: 'Indomie Goreng Original 85g', categoryName: 'Makanan', unit: 'Pcs', costPrice: 2800, sellingPrice: 3500, stockQuantity: 120, minStockThreshold: 20, isActive: true },
  { id: 'p6', warungId: 'w1', sku: 'SKU-1006', barcode: '8995555555555', name: 'Teh Celup Sariwangi Isi 25', categoryName: 'Minuman', unit: 'Box', costPrice: 5500, sellingPrice: 7000, stockQuantity: 2, minStockThreshold: 5, isActive: true },
];

export const POSPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceiptResponse | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { items, customerName, paymentMethod, paidAmount, addItem, getTotalAmount, getChangeAmount, clearCart } =
    useCartStore();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryApi.getProducts(searchQuery, selectedCategory || undefined);
      setProducts(data);

      const cats = await inventoryApi.getCategories();
      if (cats && cats.length > 0) setCategories(cats);
    } catch {
      let filtered = MOCK_PRODUCTS;
      if (selectedCategory) {
        filtered = filtered.filter((p) => p.categoryId === selectedCategory || (!p.categoryId && p.categoryName === categories.find(c => c.id === selectedCategory)?.name));
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.includes(q))
        );
      }
      setProducts(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    const success = addItem(product, 1);
    if (success) {
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `${product.name} ditambahkan ke keranjang`,
      });
    } else {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: `Stok ${product.name} tidak mencukupi`,
      });
    }
  };

  const handleScanSuccess = async (scannedCode: string) => {
    setSearchQuery(scannedCode);
    try {
      const product = await inventoryApi.getProductBySkuOrBarcode(scannedCode);
      if (product) {
        handleAddToCart(product);
      } else {
        const match = products.find((p) => p.barcode === scannedCode || p.sku === scannedCode);
        if (match) {
          handleAddToCart(match);
        } else {
          setToast({
            id: Date.now().toString(),
            type: 'error',
            message: `Produk dengan SKU/Barcode "${scannedCode}" tidak ditemukan`,
          });
        }
      }
    } catch {
      const match = products.find((p) => p.barcode === scannedCode || p.sku === scannedCode);
      if (match) {
        handleAddToCart(match);
      } else {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          message: `Produk "${scannedCode}" tidak ditemukan di database.`,
        });
      }
    }
  };

  // Hardware Barcode Scanner Gun Key Listener (Point & Shoot)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        const inputElem = target as HTMLInputElement;
        if (inputElem.placeholder && inputElem.placeholder.includes('Nama Pelanggan')) {
          return;
        }
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 120) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleScanSuccess(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [products]);

  const handleCheckout = async () => {
    if (items.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const total = getTotalAmount();
      const change = getChangeAmount();

      const checkoutData = {
        customerName,
        paymentMethod,
        paidAmount: paymentMethod === 'Cash' ? paidAmount : total,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      let responseReceipt: TransactionReceiptResponse;

      try {
        responseReceipt = await posApi.checkout(checkoutData);
      } catch {
        responseReceipt = {
          id: `tx-${Date.now()}`,
          invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
          warungId: 'w1',
          userId: 'u1',
          userName: 'Kasir Utama',
          customerName: customerName || 'Pelanggan Umum',
          paymentMethod,
          paymentStatus: paymentMethod === 'Cash' ? 'Settled' : 'Pending',
          totalAmount: total,
          paidAmount: paymentMethod === 'Cash' ? paidAmount : total,
          changeAmount: paymentMethod === 'Cash' ? change : 0,
          createdAt: new Date().toISOString(),
          items: items.map((i) => ({
            id: i.productId,
            productId: i.productId,
            productName: i.name,
            sku: i.sku,
            quantity: i.quantity,
            costPriceAtSale: i.unitPrice * 0.8,
            sellingPriceAtSale: i.unitPrice,
            subtotal: i.subtotal,
          })),
        };
      }

      setProducts((prev) =>
        prev.map((p) => {
          const cartMatch = items.find((ci) => ci.productId === p.id);
          if (cartMatch) {
            const newStock = Math.max(0, p.stockQuantity - cartMatch.quantity);
            return {
              ...p,
              stockQuantity: newStock,
            };
          }
          return p;
        })
      );

      setReceipt(responseReceipt);
      setIsReceiptOpen(true);
      clearCart();
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Gagal memproses checkout transaksi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 overflow-hidden">
      {/* Panel Kiri: Grid Produk & Search (8/12 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 h-full">
        <ProductCatalogGrid
          products={products}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={handleAddToCart}
          onScanSuccess={handleScanSuccess}
          onOpenScannerModal={() => setIsScannerOpen(true)}
          isLoading={isLoading}
        />
      </div>

      {/* Panel Kanan: Cart Drawer & Pay Action (4/12 cols) */}
      <div className="lg:col-span-5 xl:col-span-4 h-full">
        <CartDrawer onCheckout={handleCheckout} isSubmitting={isSubmitting} />
      </div>

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receipt}
      />

      {/* Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
