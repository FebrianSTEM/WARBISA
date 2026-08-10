import React from 'react';
import { usePOSTerminal } from '../hooks/usePOSTerminal';
import { ProductCatalogGrid } from '../components/pos/ProductCatalogGrid';
import { CartDrawer } from '../components/pos/CartDrawer';
import { CameraScannerModal } from '../components/pos/CameraScannerModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { Toast } from '../components/common/Toast';

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
