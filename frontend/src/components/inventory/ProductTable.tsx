import React, { useEffect, useState } from 'react';
import type { Product } from '../../api/inventoryApi';
import { Badge } from '../common/Badge';
import { Edit, Trash2, ArrowUpDown, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAdjustStock: (product: Product) => void;
  isLoading: boolean;
  defaultPageSize?: number;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onAdjustStock,
  isLoading,
  defaultPageSize = 10,
}) => {
  const { user } = useAuthStore();
  const isOwner = user?.roleName === 'Owner';

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [products.length, pageSize]);

  const totalPages = Math.ceil(products.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedProducts = products.slice(startIndex, startIndex + pageSize);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="font-bold text-slate-700">Belum ada produk terdaftar</p>
        <p className="text-xs text-slate-400 mt-1">Tambahkan produk baru untuk memulai pengelolaan stok.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">SKU / Barcode</th>
              <th className="py-3.5 px-4">Nama Produk</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4">Satuan</th>
              {isOwner && <th className="py-3.5 px-4 text-right">Harga Modal (HPP)</th>}
              <th className="py-3.5 px-4 text-right">Harga Jual</th>
              <th className="py-3.5 px-4 text-center">Stok</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
            {paginatedProducts.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{product.sku}</div>
                    <div className="text-xs text-slate-400 font-mono">{product.barcode}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{product.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                      {product.categoryName || 'Umum'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{product.unit}</td>
                  {isOwner && (
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                      {formatCurrency(product.costPrice)}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-700">
                    {formatCurrency(product.sellingPrice)}
                  </td>
                  <td className="py-3 px-4 text-center font-bold tabular-nums">
                    <span className={product.stockQuantity <= product.minStockThreshold ? 'text-rose-600' : 'text-slate-800'}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isOutOfStock ? (
                      <Badge variant="danger">Habis</Badge>
                    ) : product.stockQuantity <= product.minStockThreshold ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">Tersedia</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onAdjustStock(product)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title="Adjust / Restock Stok"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Stok</span>
                    </button>
                    {isOwner && (
                      <>
                        <button
                          onClick={() => onEdit(product)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                          title="Edit Produk"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 border-t border-slate-200 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>item per halaman</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="hidden sm:inline">
            Menampilkan <strong className="text-slate-800">{startIndex + 1}</strong> -{' '}
            <strong className="text-slate-800">{Math.min(startIndex + pageSize, products.length)}</strong> dari{' '}
            <strong className="text-slate-800">{products.length}</strong> produk
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          <span className="px-3 py-1 font-bold text-slate-800">
            {safeCurrentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
