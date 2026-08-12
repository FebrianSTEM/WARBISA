import React, { useEffect, useState } from 'react';
import type { Product } from '../../api/inventoryApi';
import { Badge } from '../common/Badge';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, ChevronLeft, ChevronRight, PackagePlus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAdjustStock: (product: Product) => void;
  isLoading: boolean;
  defaultPageSize?: number;
  onAddNewProduct?: () => void;
}

type SortField = 'sku' | 'name' | 'categoryName' | 'costPrice' | 'sellingPrice' | 'stockQuantity';
type SortOrder = 'asc' | 'desc';

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onAdjustStock,
  isLoading,
  defaultPageSize = 10,
  onAddNewProduct,
}) => {
  const { user } = useAuthStore();
  const isOwner = user?.roleName === 'Owner';

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    setCurrentPage(1);
  }, [products.length, pageSize, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let valA: any = a[sortField] ?? '';
    let valB: any = b[sortField] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + pageSize);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const renderSortHeader = (label: string, field: SortField, align: 'left' | 'center' | 'right' = 'left') => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`py-3.5 px-4 cursor-pointer select-none group transition-colors hover:bg-slate-100/80 ${
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        }`}
      >
        <div className={`inline-flex items-center gap-1 font-bold ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
          <span>{label}</span>
          {isActive ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          )}
        </div>
      </th>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="font-bold text-slate-700">Belum ada produk terdaftar</p>
        <p className="text-xs text-slate-400 mt-1 mb-4">Tambahkan produk baru untuk memulai pengelolaan stok warung Anda.</p>
        {onAddNewProduct && isOwner && (
          <button
            onClick={onAddNewProduct}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Tambah Produk Baru Pertama</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Mobile Card List View (< md) */}
      <div className="md:hidden divide-y divide-slate-100">
        {paginatedProducts.map((product) => {
          const isOutOfStock = product.stockQuantity <= 0;
          return (
            <div key={product.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    SKU: {product.sku}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{product.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{product.categoryName || 'Umum'} • {product.unit}</p>
                </div>
                {isOutOfStock ? (
                  <Badge variant="danger">Habis</Badge>
                ) : product.stockQuantity <= product.minStockThreshold ? (
                  <Badge variant="warning">Low Stock</Badge>
                ) : (
                  <Badge variant="success">Tersedia</Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div>
                  {isOwner && (
                    <p className="text-[11px] text-slate-500">
                      HPP: <span className="tabular-nums font-semibold text-slate-700">{formatCurrency(product.costPrice)}</span>
                    </p>
                  )}
                  <p className="font-extrabold text-emerald-700 text-sm tabular-nums">
                    {formatCurrency(product.sellingPrice)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">
                    Stok: <span className={`font-bold tabular-nums ${product.stockQuantity <= product.minStockThreshold ? 'text-rose-600' : 'text-slate-800'}`}>{product.stockQuantity}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onAdjustStock(product)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Adjust Stok</span>
                </button>
                {isOwner && (
                  <>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider">
              {renderSortHeader('SKU / Barcode', 'sku')}
              {renderSortHeader('Nama Produk', 'name')}
              {renderSortHeader('Kategori', 'categoryName')}
              <th className="py-3.5 px-4 font-bold text-slate-500">Satuan</th>
              {isOwner && renderSortHeader('Harga Modal (HPP)', 'costPrice', 'right')}
              {renderSortHeader('Harga Jual', 'sellingPrice', 'right')}
              {renderSortHeader('Stok', 'stockQuantity', 'center')}
              <th className="py-3.5 px-4 text-center font-bold text-slate-500">Status</th>
              <th className="py-3.5 px-4 text-right font-bold text-slate-500">Aksi</th>
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
            <strong className="text-slate-800">{Math.min(startIndex + pageSize, sortedProducts.length)}</strong> dari{' '}
            <strong className="text-slate-800">{sortedProducts.length}</strong> produk
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

