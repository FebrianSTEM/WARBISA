import React from 'react';
import type { Product } from '../../api/inventoryApi';
import { Search, Camera, Plus, PackageX } from 'lucide-react';
import { Badge } from '../common/Badge';

interface ProductCatalogGridProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: Product) => void;
  onScanSuccess: (scannedCode: string) => void;
  onOpenScannerModal: () => void;
  isLoading: boolean;
}

export const ProductCatalogGrid: React.FC<ProductCatalogGridProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddToCart,
  onOpenScannerModal,
  isLoading,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Search & Barcode Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari produk (Nama / SKU / Barcode)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-xs"
          />
        </div>

        {/* Unified Scan Barcode Button (Matches Inventory Management Page Design) */}
        <button
          onClick={onOpenScannerModal}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          title="Scan Barcode Produk untuk Cari / Masukkan ke Keranjang"
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Scan Barcode</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
        <button
          onClick={() => onSelectCategory('')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedCategory === ''
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Produk
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-6 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-white rounded-2xl border border-dashed border-slate-300">
            <PackageX className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-slate-700 font-bold">Produk Tidak Ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">
              Coba kata kunci pencarian atau kategori yang berbeda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && onAddToCart(product)}
                  className={`bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                    isOutOfStock ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
                  }`}
                >
                  {product.stockQuantity <= product.minStockThreshold && !isOutOfStock && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="warning">Stok Tipis</Badge>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      SKU: {product.sku}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 line-clamp-2 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Stok: <span className="font-bold text-slate-800 tabular-nums">{product.stockQuantity} {product.unit}</span>
                      </p>
                      <p className="text-base font-extrabold text-emerald-700 tabular-nums mt-0.5">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400'
                          : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                      }`}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
