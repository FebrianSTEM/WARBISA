import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import type { Product, CreateProductRequest } from '../api/inventoryApi';
import { ProductTable } from '../components/inventory/ProductTable';
import { ProductFormModal } from '../components/inventory/ProductFormModal';
import { StockAdjustModal } from '../components/inventory/StockAdjustModal';
import { CameraScannerModal } from '../components/pos/CameraScannerModal';
import { Toast } from '../components/common/Toast';
import type { ToastMessage } from '../components/common/Toast';
import { ContinuousRestockModal } from '../components/inventory/ContinuousRestockModal';
import { CategoryManagementModal } from '../components/inventory/CategoryManagementModal';
import { Plus, Search, Filter, Package, Camera, PackagePlus, Tag } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Initial Mock Data if offline
const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', warungId: 'w1', sku: 'SKU-1001', barcode: '8991234567890', name: 'Minyak Goreng Bimoli 1L', categoryName: 'Sembako', unit: 'Pcs', costPrice: 16000, sellingPrice: 18500, stockQuantity: 24, minStockThreshold: 5, isActive: true },
  { id: 'p2', warungId: 'w1', sku: 'SKU-1002', barcode: '8999999111111', name: 'Beras Pandan Wangi 5kg', categoryName: 'Sembako', unit: 'Pack', costPrice: 65000, sellingPrice: 72000, stockQuantity: 8, minStockThreshold: 3, isActive: true },
  { id: 'p3', warungId: 'w1', sku: 'SKU-1003', barcode: '8998888222222', name: 'Gula Pasir Gulaku 1kg', categoryName: 'Sembako', unit: 'Pcs', costPrice: 14000, sellingPrice: 16000, stockQuantity: 3, minStockThreshold: 5, isActive: true },
  { id: 'p4', warungId: 'w1', sku: 'SKU-1004', barcode: '8997777333333', name: 'Kopi Kapal Api Special 165g', categoryName: 'Minuman', unit: 'Pcs', costPrice: 11000, sellingPrice: 13500, stockQuantity: 15, minStockThreshold: 4, isActive: true },
  { id: 'p5', warungId: 'w1', sku: 'SKU-1005', barcode: '8996666444444', name: 'Indomie Goreng Original 85g', categoryName: 'Makanan', unit: 'Pcs', costPrice: 2800, sellingPrice: 3500, stockQuantity: 120, minStockThreshold: 20, isActive: true },
];

export const InventoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const isOwner = user?.roleName === 'Owner';

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(['Sembako', 'Minuman', 'Makanan']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const [isContinuousRestockOpen, setIsContinuousRestockOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryApi.getProducts(searchQuery, selectedCategory || undefined);
      setProducts(data);
      const cats = await inventoryApi.getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats.map((c) => c.name));
      }
    } catch {
      let filtered = MOCK_PRODUCTS;
      if (selectedCategory) {
        filtered = filtered.filter((p) => p.categoryName === selectedCategory);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.includes(q))
        );
      }
      setProducts(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  const handleScanSuccess = async (scannedCode: string) => {
    try {
      let match = await inventoryApi.getProductBySkuOrBarcode(scannedCode);
      if (!match) {
        match = products.find((p) => p.barcode === scannedCode || p.sku === scannedCode) || null;
      }

      if (match) {
        setSearchQuery(scannedCode);
        setAdjustingProduct(match);
        setIsAdjustOpen(true);
        setToast({
          id: Date.now().toString(),
          type: 'success',
          message: `Produk "${match.name}" ditemukan. Silakan masukkan jumlah restock stok.`,
        });
      } else {
        // Not found anywhere -> auto-open registration modal prefilled with scanned barcode
        setSearchQuery('');
        setEditingProduct({
          barcode: scannedCode,
          sku: `SKU-${scannedCode.slice(-4)}`,
          name: '',
          unit: 'Pcs',
          costPrice: 0,
          sellingPrice: 0,
          stockQuantity: 10,
          minStockThreshold: 5,
        });
        setIsFormOpen(true);
        setToast({
          id: Date.now().toString(),
          type: 'info',
          message: `Barcode "${scannedCode}" belum terdaftar. Silakan lengkapi data produk baru.`,
        });
      }
    } catch {
      const localMatch = products.find((p) => p.barcode === scannedCode || p.sku === scannedCode);
      if (localMatch) {
        setSearchQuery(scannedCode);
        setAdjustingProduct(localMatch);
        setIsAdjustOpen(true);
        setToast({
          id: Date.now().toString(),
          type: 'success',
          message: `Produk "${localMatch.name}" ditemukan. Silakan masukkan jumlah restock stok.`,
        });
      } else {
        setSearchQuery('');
        setEditingProduct({
          barcode: scannedCode,
          sku: `SKU-${scannedCode.slice(-4)}`,
          name: '',
          unit: 'Pcs',
          costPrice: 0,
          sellingPrice: 0,
          stockQuantity: 10,
          minStockThreshold: 5,
        });
        setIsFormOpen(true);
        setToast({
          id: Date.now().toString(),
          type: 'info',
          message: `Barcode "${scannedCode}" belum terdaftar. Silakan lengkapi data produk baru.`,
        });
      }
    }
  };

  const handleCreateOrUpdate = async (data: CreateProductRequest) => {
    try {
      if (editingProduct && editingProduct.id) {
        await inventoryApi.updateProduct(editingProduct.id, data);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...data } : p))
        );
        setToast({ id: Date.now().toString(), type: 'success', message: 'Data produk berhasil diperbarui.' });
      } else {
        const newProduct: Product = {
          id: `p-${Date.now()}`,
          warungId: 'w1',
          ...data,
          unit: data.unit || 'Pcs',
          stockQuantity: data.stockQuantity || 0,
          minStockThreshold: data.minStockThreshold || 5,
          isActive: true,
        };
        try {
          const res = await inventoryApi.createProduct(data);
          setProducts((prev) => [res, ...prev]);
        } catch {
          setProducts((prev) => [newProduct, ...prev]);
        }
        setToast({ id: Date.now().toString(), type: 'success', message: 'Produk baru berhasil ditambahkan.' });
      }
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', message: err.message || 'Gagal menyimpan produk.' });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setToast({ id: Date.now().toString(), type: 'success', message: 'Produk berhasil dihapus.' });
  };

  const handleStockAdjustment = async (req: { productId: string; adjustmentQty: number; notes?: string }) => {
    try {
      if (req.adjustmentQty > 0) {
        await inventoryApi.restockProduct(req.productId, { quantity: req.adjustmentQty, notes: req.notes });
      } else {
        await inventoryApi.adjustStock(req.productId, { quantityChange: req.adjustmentQty, notes: req.notes });
      }
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === req.productId) {
            const newQty = p.stockQuantity + req.adjustmentQty;
            return {
              ...p,
              stockQuantity: newQty,
            };
          }
          return p;
        })
      );
      setToast({ id: Date.now().toString(), type: 'success', message: 'Mutasi stok berhasil dicatat ke Audit Ledger.' });
    } catch {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === req.productId) {
            const newQty = p.stockQuantity + req.adjustmentQty;
            return {
              ...p,
              stockQuantity: newQty,
            };
          }
          return p;
        })
      );
      setToast({ id: Date.now().toString(), type: 'success', message: 'Mutasi stok dicatat (Demo Mode).' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-600" />
            <span>Manajemen Produk & Stok</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Kelola data katalog produk, registrasi barcode cepat via kamera, HPP, harga jual, dan audit stok.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsContinuousRestockOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Scan Restock Barang Masuk Kontinu (Non-Stop)"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Scan Restock Kontinu</span>
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Scan Barcode Produk untuk Cari / Registrasi Baru"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Scan Barcode</span>
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                title="Kelola Daftar Kategori Produk"
              >
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Kelola Kategori</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SKU, Barcode, Nama Produk..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <ProductTable
        products={products}
        onEdit={(p) => {
          setEditingProduct(p);
          setIsFormOpen(true);
        }}
        onDelete={handleDelete}
        onAdjustStock={(p) => {
          setAdjustingProduct(p);
          setIsAdjustOpen(true);
        }}
        isLoading={isLoading}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingProduct}
        categories={categories}
      />

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onSubmit={handleStockAdjustment}
        product={adjustingProduct}
      />

      {/* Continuous Restock Scanner Modal */}
      <ContinuousRestockModal
        isOpen={isContinuousRestockOpen}
        onClose={() => setIsContinuousRestockOpen(false)}
        products={products}
        onRestockItem={async (productId, qty) => {
          await handleStockAdjustment({ productId, adjustmentQty: qty, notes: 'Restock Kontinu via Barcode' });
        }}
        onRegisterNewProduct={(scannedCode) => {
          setEditingProduct({
            barcode: scannedCode,
            sku: `SKU-${scannedCode.slice(-4)}`,
            name: '',
            unit: 'Pcs',
            costPrice: 0,
            sellingPrice: 0,
            stockQuantity: 10,
            minStockThreshold: 5,
          });
          setIsFormOpen(true);
        }}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChanged={async () => {
          try {
            const cats = await inventoryApi.getCategories();
            if (cats && cats.length > 0) {
              setCategories(cats.map((c) => c.name));
            }
          } catch {}
          fetchProducts();
        }}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
