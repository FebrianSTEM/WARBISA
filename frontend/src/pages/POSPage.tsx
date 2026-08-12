import React, { useState } from 'react';
import { usePOSTerminal } from '../hooks/usePOSTerminal';
import { useCartStore } from '../store/useCartStore';
import { ProductCatalogGrid } from '../components/pos/ProductCatalogGrid';
import { CartDrawer } from '../components/pos/CartDrawer';
import { CameraScannerModal } from '../components/pos/CameraScannerModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { Toast } from '../components/common/Toast';
import { ShoppingBag, ChevronUp } from 'lucide-react';

export const POSPage: React.FC = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isLoading,
    isScannerOpen,
    setIsScannerOpen,
    toast,
    setToast,
    receipt,
    isReceiptOpen,
    setIsReceiptOpen,
    isSubmitting,
    handleAddToCart,
    handleScanSuccess,
    handleCheckout,
  } = usePOSTerminal();

  const { items, getTotalAmount } = useCartStore();
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const totalAmount = getTotalAmount();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-12 gap-6 p-1 overflow-hidden relative">
      {/* Panel Kiri: Grid Produk & Search (8/12 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 h-full overflow-hidden pb-16 lg:pb-0">
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

      {/* Desktop Panel Kanan: Cart Drawer (4/12 cols) */}
      <div className="hidden lg:block lg:col-span-5 xl:col-span-4 h-full">
        <CartDrawer onCheckout={handleCheckout} isSubmitting={isSubmitting} />
      </div>

      {/* Mobile Floating Cart Summary Bar */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between transition-transform active:scale-[0.98] border border-slate-700 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold relative">
              <ShoppingBag className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {items.length}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-slate-400">Ringkasan Kasir</p>
              <p className="text-sm font-extrabold tabular-nums text-emerald-400">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
            <span>Buka Keranjang</span>
            <ChevronUp className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Mobile Slide-Up Cart Bottom Sheet */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="bg-white rounded-t-3xl max-h-[85vh] h-[85vh] z-10 overflow-hidden shadow-2xl flex flex-col animate-slide-up">
            <CartDrawer
              onCheckout={() => {
                handleCheckout();
                setIsMobileCartOpen(false);
              }}
              isSubmitting={isSubmitting}
              onCloseMobile={() => setIsMobileCartOpen(false)}
            />
          </div>
        </div>
      )}

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

export default POSPage;

