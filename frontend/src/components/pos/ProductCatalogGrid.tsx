import React, { useEffect, useRef, useState } from 'react';
import type { Product, CategoryDTO } from '../../api/inventoryApi';
import { Search, Camera, Plus, PackageX, Video, RefreshCw, AlertCircle, X } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ProductCatalogGridProps {
  products: Product[];
  categories: CategoryDTO[];
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
  onScanSuccess,
  onOpenScannerModal,
  isLoading,
}) => {
  const [isInlineCameraOpen, setIsInlineCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const inlineQrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
  };

  const stopInlineCamera = async () => {
    if (inlineQrCodeRef.current) {
      try {
        if (inlineQrCodeRef.current.isScanning) {
          await inlineQrCodeRef.current.stop();
        }
        inlineQrCodeRef.current.clear();
      } catch {}
      inlineQrCodeRef.current = null;
    }
  };

  const startInlineCamera = async (targetCameraId?: string) => {
    await stopInlineCamera();
    setScanError(null);
    setIsStartingCamera(true);
    try {
      const readerElem = document.getElementById('inline-reader');
      if (!readerElem) { setIsStartingCamera(false); return; }

      const html5QrCode = new Html5Qrcode('inline-reader');
      inlineQrCodeRef.current = html5QrCode;

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.max(220, Math.floor(minEdge * 0.85)),
            height: Math.max(140, Math.floor(minEdge * 0.5)),
          };
        },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      };

      const handleScan = (decodedText: string) => {
        const now = Date.now();
        if (lastScanTimeRef.current.code === decodedText && now - lastScanTimeRef.current.time < 1500) return;
        lastScanTimeRef.current = { code: decodedText, time: now };
        playBeep();
        onScanSuccess(decodedText);
      };

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const formatted = devices.map((d, i) => ({ id: d.id, label: d.label || `Kamera ${i + 1}` }));
          setCameraDevices(formatted);

          let chosenId = targetCameraId || selectedCameraId;
          if (!chosenId || !devices.some((d) => d.id === chosenId)) {
            const backCam = devices.find((d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
            );
            chosenId = backCam ? backCam.id : devices[devices.length - 1].id;
          }
          setSelectedCameraId(chosenId);
          await html5QrCode.start(chosenId, qrConfig, handleScan, () => {});
          setIsStartingCamera(false);
          return;
        }
      } catch {}

      try {
        await html5QrCode.start({ facingMode: 'environment' }, qrConfig, handleScan, () => {});
      } catch {
        await html5QrCode.start({ facingMode: 'user' }, qrConfig, handleScan, () => {});
      }
      setIsStartingCamera(false);
    } catch (e: any) {
      setScanError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
      setIsStartingCamera(false);
    }
  };

  const handleCameraChange = async (newId: string) => {
    setSelectedCameraId(newId);
    await startInlineCamera(newId);
  };

  useEffect(() => {
    if (isInlineCameraOpen) {
      const timer = setTimeout(() => startInlineCamera(), 200);
      return () => { clearTimeout(timer); stopInlineCamera(); };
    } else {
      stopInlineCamera();
      setScanError(null);
      setCameraDevices([]);
    }
  }, [isInlineCameraOpen]);

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

        {/* Toggle Inline Camera Button */}
        <button
          onClick={() => setIsInlineCameraOpen(!isInlineCameraOpen)}
          className={`flex items-center gap-2 px-3.5 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer border ${
            isInlineCameraOpen
              ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
              : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
          }`}
          title="Tampilkan / Sembunyikan Scanner Kamera Langsung"
        >
          {isInlineCameraOpen ? <X className="w-4 h-4" /> : <Video className="w-4 h-4 text-emerald-400" />}
          <span>{isInlineCameraOpen ? 'Tutup Kamera' : 'Kamera Live'}</span>
        </button>

        {/* Modal Scanner Fallback */}
        <button
          onClick={onOpenScannerModal}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer border border-slate-200"
          title="Buka Modal Scanner"
        >
          <Camera className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* Inline Camera Panel — matches ContinuousRestockModal layout */}
      {isInlineCameraOpen && (
        <div className="space-y-2 shrink-0">
          {/* Camera Selector */}
          {cameraDevices.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
              <Video className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none truncate cursor-pointer"
              >
                {cameraDevices.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Control Bar */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <span className="font-medium text-[11px]">Scan barang tanpa henti.</span>
            <button
              type="button"
              onClick={() => startInlineCamera(selectedCameraId)}
              className="text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Camera View */}
          {scanError ? (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex flex-col items-center gap-2 text-xs text-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>{scanError}</span>
              <button
                type="button"
                onClick={() => startInlineCamera(selectedCameraId)}
                className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs"
              >
                Coba Ulang
              </button>
            </div>
          ) : (
            <div className="w-full rounded-xl overflow-hidden border border-slate-300 relative bg-slate-900 min-h-[220px] flex items-center justify-center">
              {isStartingCamera && (
                <div className="absolute inset-0 z-10 bg-slate-900/80 flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>Menghubungkan Kamera...</span>
                </div>
              )}
              <div id="inline-reader" className="w-full h-full min-h-[220px]"></div>
            </div>
          )}
        </div>
      )}

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
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {cat.name}
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
