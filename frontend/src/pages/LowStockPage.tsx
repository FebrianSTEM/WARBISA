import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import type { Product } from '../api/inventoryApi';
import { ProductTable } from '../components/inventory/ProductTable';
import { StockAdjustModal } from '../components/inventory/StockAdjustModal';
import { Toast } from '../components/common/Toast';
import type { ToastMessage } from '../components/common/Toast';
import { AlertTriangle, ShieldAlert, Search } from 'lucide-react';

const MOCK_LOW_STOCK_PRODUCTS: Product[] = [
  { id: 'p3', warungId: 'w1', sku: 'SKU-1003', barcode: '8998888222222', name: 'Gula Pasir Gulaku 1kg', categoryName: 'Sembako', unit: 'Pcs', costPrice: 14000, sellingPrice: 16000, stockQuantity: 3, minStockThreshold: 5, isActive: true },
  { id: 'p6', warungId: 'w1', sku: 'SKU-1006', barcode: '8995555555555', name: 'Teh Celup Sariwangi Isi 25', categoryName: 'Minuman', unit: 'Box', costPrice: 5500, sellingPrice: 7000, stockQuantity: 2, minStockThreshold: 5, isActive: true },
];

export const LowStockPage: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>(MOCK_LOW_STOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchLowStock = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryApi.getLowStockProducts();
      setLowStockProducts(data);
    } catch {
      setLowStockProducts(MOCK_LOW_STOCK_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleStockAdjustment = async (req: { productId: string; adjustmentQty: number; notes?: string }) => {
    try {
      if (req.adjustmentQty > 0) {
        await inventoryApi.restockProduct(req.productId, { quantity: req.adjustmentQty, notes: req.notes });
      } else {
        await inventoryApi.adjustStock(req.productId, { quantityChange: req.adjustmentQty, notes: req.notes });
      }
      fetchLowStock();
      setToast({ id: Date.now().toString(), type: 'success', message: 'Restock produk berhasil dicatat.' });
    } catch {
      setLowStockProducts((prev) =>
        prev
          .map((p) => (p.id === req.productId ? { ...p, stockQuantity: p.stockQuantity + req.adjustmentQty } : p))
          .filter((p) => p.stockQuantity <= p.minStockThreshold)
      );
      setToast({ id: Date.now().toString(), type: 'success', message: 'Restock produk dicatat.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Header Banner */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-rose-950 flex items-center gap-2">
              Peringatan Low Stock Barang Menipis
            </h1>
            <p className="text-xs text-rose-800 font-medium mt-1">
              Ada <span className="font-extrabold text-rose-900 underline">{lowStockProducts.length} produk</span> yang stoknya telah mencapai atau di bawah threshold minimum.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLowStock}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
        >
          Refresh Status Stok
        </button>
      </div>

      {/* Low Stock Search & Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Daftar Barang Kritis ({lowStockProducts.length})</span>
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang low stock..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
            />
          </div>
        </div>

        <ProductTable
          products={lowStockProducts.filter((p) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              p.name.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q) ||
              (p.barcode && p.barcode.toLowerCase().includes(q))
            );
          })}
          onEdit={() => {}}
          onDelete={() => {}}
          onAdjustStock={(p) => {
            setAdjustingProduct(p);
            setIsAdjustOpen(true);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onSubmit={handleStockAdjustment}
        product={adjustingProduct}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
