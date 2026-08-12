import React from 'react';
import { useCartStore } from '../../store/useCartStore';
import { ShoppingBag, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  onCheckout: () => void;
  isSubmitting: boolean;
  onCloseMobile?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout, isSubmitting, onCloseMobile }) => {
  const {
    items,
    customerName,
    paymentMethod,
    paidAmount,
    updateQuantity,
    removeItem,
    clearCart,
    setCustomerName,
    setPaymentMethod,
    setPaidAmount,
    getTotalAmount,
    getChangeAmount,
  } = useCartStore();

  const totalAmount = getTotalAmount();
  const changeAmount = getChangeAmount();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const quickNominals = [
    totalAmount,
    10000,
    20000,
    50000,
    100000,
  ].filter((v, i, self) => v > 0 && self.indexOf(v) === i);

  const isValidCheckout =
    items.length > 0 &&
    (paymentMethod !== 'Cash' || paidAmount >= totalAmount);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between overflow-hidden">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-900 text-base">Keranjang Kasir</h2>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {items.length} item
          </span>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 font-semibold hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Kosongkan
            </button>
          )}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Tutup Keranjang"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8">
            <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Keranjang masih kosong</p>
            <p className="text-xs mt-1">Klik barang di katalog untuk menambahkan</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-200 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-semibold text-slate-500">SKU: {item.sku}</p>
                <h4 className="text-sm font-bold text-slate-800 truncate">{item.name}</h4>
                <p className="text-xs font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(item.unitPrice)} / {item.unit}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer active:bg-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-800 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer active:bg-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right w-20">
                  <p className="text-xs font-extrabold text-slate-900 tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment & Action Drawer Bottom */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
        {/* Customer Name Optional */}
        <div>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama Pelanggan (opsional)"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Payment Method Tabs */}
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMethod('Cash')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentMethod === 'Cash'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tunai</span>
            </button>
            <button
              onClick={() => setPaymentMethod('QRIS')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentMethod === 'QRIS'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS</span>
            </button>
            <button
              onClick={() => setPaymentMethod('Transfer')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentMethod === 'Transfer'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        {/* Cash Payment Details */}
        {paymentMethod === 'Cash' && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-600">Uang Diterima (Rp)</label>
              <input
                type="number"
                min="0"
                value={paidAmount || ''}
                onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-36 text-right px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Quick Nominal Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {quickNominals.map((nom) => (
                <button
                  key={nom}
                  onClick={() => setPaidAmount(nom)}
                  className="px-2 py-1 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-[10px] font-bold text-slate-700 tabular-nums shrink-0 cursor-pointer"
                >
                  {nom === totalAmount ? 'Uang Pas' : formatCurrency(nom)}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/80">
              <span className="font-semibold text-slate-600">Kembalian:</span>
              <span
                className={`font-extrabold tabular-nums ${
                  paidAmount < totalAmount && paidAmount > 0
                    ? 'text-rose-600'
                    : 'text-emerald-700 text-sm'
                }`}
              >
                {paidAmount < totalAmount && paidAmount > 0
                  ? `Kurang ${formatCurrency(totalAmount - paidAmount)}`
                  : formatCurrency(changeAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Total Summary & Checkout Button */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">Total Belanja</span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <button
            onClick={onCheckout}
            disabled={!isValidCheckout || isSubmitting}
            className={`w-full py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
              isValidCheckout && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99]'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{isSubmitting ? 'Memproses Transaksi...' : 'Bayar & Selesaikan'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
