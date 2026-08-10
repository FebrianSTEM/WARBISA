import React, { useState } from 'react';
import type { Product } from '../../api/inventoryApi';
import { Modal } from '../common/Modal';
import { Plus, Minus } from 'lucide-react';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { productId: string; adjustmentQty: number; notes?: string }) => Promise<void>;
  product: Product | null;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
}) => {
  if (!product) return null;

  const [inputQty, setInputQty] = useState<number>(0);
  const [mutationType, setMutationType] = useState<'RESTOCK' | 'CORRECTION' | 'DAMAGE' | 'EXPIRED'>('RESTOCK');
  const [correctionDirection, setCorrectionDirection] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate actual adjustmentQty (positive for RESTOCK/ADD, negative for DAMAGE/EXPIRED/SUBTRACT)
  let calculatedQty = 0;
  if (mutationType === 'RESTOCK') {
    calculatedQty = Math.abs(inputQty);
  } else if (mutationType === 'DAMAGE' || mutationType === 'EXPIRED') {
    calculatedQty = -Math.abs(inputQty);
  } else if (mutationType === 'CORRECTION') {
    calculatedQty = correctionDirection === 'ADD' ? Math.abs(inputQty) : -Math.abs(inputQty);
  }

  const resultingStock = product.stockQuantity + calculatedQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQty || inputQty <= 0) {
      setError('Jumlah kuantitas harus lebih besar dari 0.');
      return;
    }

    if (resultingStock < 0) {
      setError('Stok akhir tidak boleh kurang dari 0 (stok fisik tidak mencukupi).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        productId: product.id,
        adjustmentQty: calculatedQty,
        notes,
      });
      onClose();
      setInputQty(0);
      setNotes('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal menyesuaikan stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleQtyChange = (val: string) => {
    const num = Math.max(0, Number(val));
    setInputQty(num);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjustment / Restock Stok" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 font-medium">Produk:</p>
          <p className="font-bold text-slate-900 text-sm">{product.name}</p>
          <p className="text-xs text-slate-600 mt-1">
            Stok Saat Ini:{' '}
            <span className="font-bold text-slate-900 tabular-nums">
              {product.stockQuantity} {product.unit}
            </span>
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Tipe Mutasi Stok</label>
          <select
            value={mutationType}
            onChange={(e) => {
              setMutationType(e.target.value as any);
              setError(null);
            }}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="RESTOCK">Restock (Tambah Stok Supplier)</option>
            <option value="CORRECTION">Koreksi Stok (Penyesuaian Fisik)</option>
            <option value="DAMAGE">Barang Rusak / Pecah (Kurangi Stok)</option>
            <option value="EXPIRED">Barang Kedaluwarsa (Kurangi Stok)</option>
          </select>
        </div>

        {mutationType === 'CORRECTION' && (
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Arah Penyesuaian Koreksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCorrectionDirection('ADD')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  correctionDirection === 'ADD'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Stok (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setCorrectionDirection('SUBTRACT')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  correctionDirection === 'SUBTRACT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Kurangi Stok (-)</span>
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            {mutationType === 'RESTOCK'
              ? 'Jumlah Restock (Tambah Stok)'
              : mutationType === 'DAMAGE'
              ? 'Jumlah Barang Rusak / Pecah'
              : mutationType === 'EXPIRED'
              ? 'Jumlah Barang Kedaluwarsa'
              : 'Jumlah Penyesuaian Koreksi'}
          </label>
          <input
            type="number"
            required
            value={inputQty || ''}
            onChange={(e) => handleQtyChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.select()}
            placeholder="Contoh: 10"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">Estimasi Stok Akhir:</span>
          <span
            className={`font-extrabold text-sm tabular-nums ${
              resultingStock < 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {resultingStock} {product.unit}
          </span>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Catatan / Alasan Mutasi</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Catatan penyesuaian (opsional)..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || resultingStock < 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs disabled:bg-slate-300 cursor-pointer"
          >
            {isSubmitting ? 'Memproses...' : 'Simpan Mutasi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
