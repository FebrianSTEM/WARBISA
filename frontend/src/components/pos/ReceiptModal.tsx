import React from 'react';
import type { TransactionReceiptResponse } from '../../api/posApi';
import { Modal } from '../common/Modal';
import { Printer, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDateTimeInTimeZone } from '../../utils/dateFormatter';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: TransactionReceiptResponse | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receipt }) => {
  const { user } = useAuthStore();
  const warungDisplayName = user?.warungName || 'WARBISA';

  if (!receipt) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Transaksi Digital" maxWidth="md">
      <div className="space-y-4 font-sans print:p-0">
        <div className="text-center pb-3 border-b border-dashed border-slate-300">
          <div className="inline-flex p-2 bg-emerald-100 rounded-full text-emerald-700 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{warungDisplayName}</h2>
          <p className="text-xs text-slate-500 font-medium">Nota Pembayaran Resmi</p>
          <p className="text-xs text-slate-400 mt-1">No. Nota: <span className="font-bold text-slate-700">{receipt.invoiceNo}</span></p>
          <p className="text-[11px] text-slate-400">{formatDateTimeInTimeZone(receipt.createdAt)}</p>
        </div>

        <div className="text-xs space-y-1 text-slate-600 border-b border-dashed border-slate-300 pb-3">
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span className="font-bold text-slate-800">{receipt.userName}</span>
          </div>
          {receipt.customerName && (
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span className="font-bold text-slate-800">{receipt.customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Metode Bayar:</span>
            <span className="font-bold text-emerald-700 uppercase">{receipt.paymentMethod}</span>
          </div>
        </div>

        {/* Item list */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {receipt.items.map((item) => (
            <div key={item.id || item.productId} className="flex justify-between text-xs text-slate-800">
              <div>
                <p className="font-bold">{item.productName}</p>
                <p className="text-slate-500 text-[11px] tabular-nums">
                  {item.quantity} x {formatCurrency(item.sellingPriceAtSale || 0)}
                </p>
              </div>
              <span className="font-bold tabular-nums">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 text-xs text-slate-800">
          <div className="flex justify-between font-bold text-sm">
            <span>Total Belanja</span>
            <span className="tabular-nums text-slate-900">{formatCurrency(receipt.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Dibayar ({receipt.paymentMethod})</span>
            <span className="tabular-nums font-semibold">{formatCurrency(receipt.paidAmount)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>Kembalian</span>
            <span className="tabular-nums text-sm">{formatCurrency(receipt.changeAmount)}</span>
          </div>
        </div>

        <div className="text-center pt-2 text-[10px] text-slate-400 font-semibold">
          *** Terima Kasih Telah Berbelanja di {warungDisplayName} ***
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </Modal>
  );
};
