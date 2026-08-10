import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import type { Product, CreateProductRequest } from '../../api/inventoryApi';
import { Modal } from '../common/Modal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductRequest) => Promise<void>;
  initialData?: Partial<Product> | null;
  categories: string[];
}

interface ProductFormState extends CreateProductRequest {
  categoryName?: string;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
}) => {
  const [availableCategories, setAvailableCategories] = useState<string[]>(categories);
  const [formData, setFormData] = useState<ProductFormState>({
    sku: '',
    barcode: '',
    name: '',
    categoryName: 'Sembako',
    unit: 'Pcs',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minStockThreshold: 5,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      let activeCats = categories;
      try {
        const fetched = await inventoryApi.getCategories();
        if (fetched && fetched.length > 0) {
          activeCats = fetched.map((c) => c.name);
        }
      } catch {}
      setAvailableCategories(activeCats);

      if (initialData) {
        setFormData({
          categoryId: initialData.categoryId,
          sku: initialData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: initialData.barcode || '',
          name: initialData.name || '',
          categoryName: initialData.categoryName || activeCats[0] || 'Sembako',
          unit: initialData.unit || 'Pcs',
          costPrice: initialData.costPrice || 0,
          sellingPrice: initialData.sellingPrice || 0,
          stockQuantity: initialData.stockQuantity !== undefined ? initialData.stockQuantity : 10,
          minStockThreshold: initialData.minStockThreshold !== undefined ? initialData.minStockThreshold : 5,
        });
      } else {
        setFormData({
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          name: '',
          categoryName: activeCats[0] || 'Sembako',
          unit: 'Pcs',
          costPrice: 0,
          sellingPrice: 0,
          stockQuantity: 10,
          minStockThreshold: 5,
        });
      }
    };

    if (isOpen) {
      loadCategories();
    }
    setError(null);
  }, [initialData, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama produk tidak boleh kosong.');
      return;
    }
    if (formData.costPrice < 0) {
      setError('Harga modal (HPP) tidak boleh kurang dari 0.');
      return;
    }
    if (formData.sellingPrice <= 0) {
      setError('Harga jual harus lebih dari 0.');
      return;
    }
    if (formData.sellingPrice < formData.costPrice) {
      setError('Harga jual tidak boleh lebih kecil dari harga modal (HPP).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal menyimpan data produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreventNegativeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const formatCurrency = (val: number) => {
    if (!val) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Data Produk' : 'Tambah Produk Baru'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Kode SKU *</label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Barcode / EAN *</label>
            <input
              type="text"
              required
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Nama Produk *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Minyak Goreng Bimoli 1L"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Produk</label>
            <select
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {availableCategories.length === 0 && (
                <option value="" disabled>Belum ada kategori</option>
              )}
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Satuan</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Pcs">Pcs (Buah)</option>
              <option value="Kg">Kg (Kilogram)</option>
              <option value="Pack">Pack (Bungkus)</option>
              <option value="Botol">Botol</option>
              <option value="Liter">Liter</option>
              <option value="Dus">Dus / Karton</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 block">Harga Modal (HPP)</label>
              {formData.costPrice > 0 && (
                <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                  {formatCurrency(formData.costPrice)}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-slate-400 select-none pointer-events-none">
                Rp
              </span>
              <input
                type="number"
                min="0"
                value={formData.costPrice || ''}
                onChange={(e) => setFormData({ ...formData, costPrice: Math.max(0, Number(e.target.value)) })}
                onKeyDown={handlePreventNegativeKey}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 block">Harga Jual *</label>
              {formData.sellingPrice > 0 && (
                <span className="text-[10px] font-extrabold text-emerald-700 tabular-nums">
                  {formatCurrency(formData.sellingPrice)}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-emerald-600/70 select-none pointer-events-none">
                Rp
              </span>
              <input
                type="number"
                min="0"
                required
                value={formData.sellingPrice || ''}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Math.max(0, Number(e.target.value)) })}
                onKeyDown={handlePreventNegativeKey}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-emerald-700 tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Stok Awal</label>
            <input
              type="number"
              min="0"
              value={formData.stockQuantity || ''}
              onChange={(e) => setFormData({ ...formData, stockQuantity: Math.max(0, Number(e.target.value)) })}
              onKeyDown={handlePreventNegativeKey}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Threshold Low Stock</label>
            <input
              type="number"
              min="1"
              value={formData.minStockThreshold || ''}
              onChange={(e) => setFormData({ ...formData, minStockThreshold: Math.max(1, Number(e.target.value)) })}
              onKeyDown={handlePreventNegativeKey}
              onFocus={(e) => e.target.select()}
              placeholder="5"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
