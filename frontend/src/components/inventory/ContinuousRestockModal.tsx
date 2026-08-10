import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, AlertCircle, RefreshCw, Video, PackagePlus, CheckCircle2, History, Keyboard, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { Product } from '../../api/inventoryApi';

interface RestockLogItem {
  id: string;
  productName: string;
  sku: string;
  unit: string;
  addedQty: number;
  newStock: number;
  timestamp: string;
}

interface ContinuousRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRestockItem: (productId: string, qty: number) => Promise<void>;
  onRegisterNewProduct: (scannedCode: string) => void;
}

export const ContinuousRestockModal: React.FC<ContinuousRestockModalProps> = ({
  isOpen,
  onClose,
  products,
  onRestockItem,
  onRegisterNewProduct,
}) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const [scanError, setScanError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');

  // Batch Step selector (+1, +5, +10, +24)
  const [restockStep, setRestockStep] = useState<number>(1);

  // Restock Logs
  const [restockLogs, setRestockLogs] = useState<RestockLogItem[]>([]);
  const [lastScannedProduct, setLastScannedProduct] = useState<string | null>(null);

  const lastScanTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Camera Devices & Selection State
  const [cameraDevices, setCameraDevices] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const isSecureContext =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping camera:', e);
      }
      html5QrCodeRef.current = null;
    }
  };

  const handleProcessBarcode = async (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) return;

    playBeep();

    const match = products.find((p) => p.barcode === code || p.sku === code);
    if (match) {
      await onRestockItem(match.id, restockStep);
      const newStockTotal = match.stockQuantity + restockStep;

      const newLog: RestockLogItem = {
        id: Date.now().toString(),
        productName: match.name,
        sku: match.sku,
        unit: match.unit,
        addedQty: restockStep,
        newStock: newStockTotal,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setRestockLogs((prev) => [newLog, ...prev]);
      setLastScannedProduct(`✓ ${match.name} +${restockStep} ${match.unit} (Stok: ${newStockTotal})`);
    } else {
      setLastScannedProduct(`⚠️ Barcode "${code}" belum terdaftar. Silakan registrasi.`);
      if (window.confirm(`Barcode "${code}" belum terdaftar. Apakah Anda ingin mendaftarkan produk baru?`)) {
        stopCamera();
        onClose();
        onRegisterNewProduct(code);
      }
    }
  };

  const startLiveCamera = async (targetCameraId?: string) => {
    await stopCamera();
    setScanError(null);
    setIsStartingCamera(true);

    try {
      const readerElem = document.getElementById('restock-reader');
      if (!readerElem) {
        setIsStartingCamera(false);
        return;
      }

      const html5QrCode = new Html5Qrcode('restock-reader');
      html5QrCodeRef.current = html5QrCode;

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
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      };

      const handleSuccess = (decodedText: string) => {
        const now = Date.now();
        if (
          lastScanTimeRef.current.code === decodedText &&
          now - lastScanTimeRef.current.time < 1500
        ) {
          return;
        }
        lastScanTimeRef.current = { code: decodedText, time: now };
        handleProcessBarcode(decodedText);
      };

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const formattedDevices = devices.map((d, index) => ({
            id: d.id,
            label: d.label || `Kamera ${index + 1}`,
          }));
          setCameraDevices(formattedDevices);

          let chosenId = targetCameraId || selectedCameraId;

          if (!chosenId || !devices.some((d) => d.id === chosenId)) {
            const backCam = devices.find((d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
            );
            if (backCam) {
              chosenId = backCam.id;
            } else if (devices.length > 1) {
              chosenId = devices[devices.length - 1].id;
            } else {
              chosenId = devices[0].id;
            }
          }

          setSelectedCameraId(chosenId);
          await html5QrCode.start(chosenId, qrConfig, handleSuccess, () => {});
          setIsStartingCamera(false);
          return;
        }
      } catch (err) {
        console.warn('getCameras failed:', err);
      }

      try {
        await html5QrCode.start({ facingMode: 'environment' }, qrConfig, handleSuccess, () => {});
        setIsStartingCamera(false);
        return;
      } catch {
        await html5QrCode.start({ facingMode: 'user' }, qrConfig, handleSuccess, () => {});
        setIsStartingCamera(false);
      }
    } catch (err: any) {
      setIsStartingCamera(false);
      if (err?.name === 'NotAllowedError') {
        setScanError('Izin kamera ditolak. Silakan izinkan kamera pada browser Anda.');
      } else {
        setScanError(err?.message || 'Gagal mengaktifkan kamera live.');
      }
    }
  };

  const handleCameraChange = (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    startLiveCamera(newCameraId);
  };

  useEffect(() => {
    if (isOpen) {
      setScanError(null);
      setManualCode('');
      setLastScannedProduct(null);

      if (!isSecureContext && activeTab === 'camera') {
        setScanError('Akses kamera live diblokir karena koneksi HTTP.');
        return;
      }

      if (activeTab === 'camera') {
        const timer = setTimeout(() => {
          startLiveCamera();
        }, 200);
        return () => {
          clearTimeout(timer);
          stopCamera();
        };
      } else {
        stopCamera();
      }
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab, isSecureContext]);

  // Hardware Barcode Scanner Gun Key Listener inside modal
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 120) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleProcessBarcode(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, products, restockStep]);

  const totalAddedQty = restockLogs.reduce((acc, l) => acc + l.addedQty, 0);

  const handleClose = async () => {
    await stopCamera();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mode Restock Kontinu (Scan Barang Masuk Supplier)" maxWidth="lg">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Side: Camera Scanner (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          {/* Step Selector (+1, +5, +10, +24) */}
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Kuantitas Restock Per-Scan:</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 5, 10, 24].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setRestockStep(step)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    restockStep === step
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  +{step} {step === 24 ? 'Box' : 'Pcs'}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-1.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'camera'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera Live</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-1.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Input Manual</span>
            </button>
          </div>

          {/* Camera Tab View */}
          {activeTab === 'camera' && (
            <div className="space-y-2">
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

              <div className="flex items-center justify-between text-xs text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span className="font-medium text-[11px]">Scan barang dari supplier secara kontinu.</span>
                <button
                  type="button"
                  onClick={() => startLiveCamera(selectedCameraId)}
                  className="text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {scanError ? (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex flex-col items-center gap-2 text-xs text-center">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>{scanError}</span>
                  <button
                    type="button"
                    onClick={() => startLiveCamera(selectedCameraId)}
                    className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                  >
                    Coba Ulang
                  </button>
                </div>
              ) : (
                <div className="w-full rounded-xl overflow-hidden border border-slate-300 relative bg-slate-900 min-h-[200px] flex items-center justify-center">
                  {isStartingCamera && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Menghubungkan Kamera...</span>
                    </div>
                  )}
                  <div id="restock-reader" className="w-full h-full min-h-[200px]"></div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessBarcode(manualCode);
                setManualCode('');
              }}
              className="space-y-2 pt-1"
            >
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ketik kode barcode / SKU produk..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                + Tambah Restock ({restockStep})
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Live Restock Activity Log (5 cols) */}
        <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between h-full space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                <History className="w-4 h-4 text-emerald-600" />
                <span>Log Restock Barang Masuk</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full tabular-nums">
                +{totalAddedQty} Pcs
              </span>
            </div>

            {/* Flash Alert */}
            {lastScannedProduct && (
              <div className="mt-2 p-2 bg-emerald-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">{lastScannedProduct}</span>
              </div>
            )}

            {/* Activity Logs */}
            <div className="mt-3 max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
              {restockLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <PackagePlus className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-[1.5]" />
                  <p className="font-semibold text-slate-500">Belum ada restock barang</p>
                  <p className="text-[10px] mt-0.5">Arahkan barcode barang supplier ke kamera</p>
                </div>
              ) : (
                restockLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-slate-800 truncate text-[11px]">{log.productName}</p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {log.timestamp} • SKU: {log.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-700 text-xs tabular-nums block">
                        +{log.addedQty} {log.unit}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block">
                        Stok: {log.newStock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Selesai Restock Kontinu</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
