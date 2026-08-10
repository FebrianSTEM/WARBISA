import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, AlertCircle, Upload, ShieldAlert, Info, HelpCircle, Keyboard, Check, RefreshCw, Video, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useCartStore } from '../../store/useCartStore';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string) => void;
  autoCloseOnScan?: boolean;
}

const resizeImage = (file: File, maxDim: number, applyFilter = false): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      if (applyFilter) {
        ctx.filter = 'contrast(160%) brightness(105%) grayscale(100%)';
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  autoCloseOnScan = false,
}) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [scanError, setScanError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'file' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showGuideline, setShowGuideline] = useState(false);

  const lastScanTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Cart store for live cart status preview
  const { items, getTotalAmount } = useCartStore();
  const totalAmount = getTotalAmount();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Camera Devices & Selection State
  const [cameraDevices, setCameraDevices] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const isSecureContext =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

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

  const startLiveCamera = async (targetCameraId?: string) => {
    await stopCamera();
    setScanError(null);
    setIsStartingCamera(true);

    try {
      const readerElem = document.getElementById('reader');
      if (!readerElem) {
        setIsStartingCamera(false);
        return;
      }

      const html5QrCode = new Html5Qrcode('reader');
      html5QrCodeRef.current = html5QrCode;

      const qrConfig = {
        fps: 15,
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
        if (now - lastScanTimeRef.current.time < 1200) {
          // 1.2s scan cooldown delay after scan succeed or failed
          return;
        }
        lastScanTimeRef.current = { code: decodedText, time: now };
        setLastScannedCode(decodedText);
        playBeep();
        onScanSuccess(decodedText);

        if (autoCloseOnScan) {
          stopCamera();
          onClose();
        }
      };

      // 1. Try getCameras list first
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
        console.warn('getCameras failed, attempting facingMode constraints:', err);
      }

      // 2. Fallback: facingMode environment
      try {
        await html5QrCode.start({ facingMode: 'environment' }, qrConfig, handleSuccess, () => {});
        setIsStartingCamera(false);
        return;
      } catch {
        // 3. Fallback: facingMode user
        await html5QrCode.start({ facingMode: 'user' }, qrConfig, handleSuccess, () => {});
        setIsStartingCamera(false);
      }
    } catch (err: any) {
      setIsStartingCamera(false);
      console.error('Camera start error:', err);

      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        setScanError('Izin akses kamera ditolak. Silakan izinkan kamera pada browser Anda.');
      } else if (err?.name === 'NotReadableError' || err?.message?.includes('in use')) {
        setScanError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.');
      } else if (err?.name === 'NotFoundError') {
        setScanError('Perangkat kamera tidak ditemukan.');
      } else {
        setScanError(
          err?.message ||
            'Gagal mengaktifkan kamera live. Gunakan tab "Upload Foto" atau "Input Manual".'
        );
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
      setLastScannedCode(null);

      if (!isSecureContext && activeTab === 'camera') {
        setScanError(
          'Akses kamera live diblokir oleh browser karena koneksi HTTP. Gunakan tab "Upload Foto" atau "Input Manual" di bawah ini.'
        );
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      setScanError(null);

      const tempId = 'html5-file-reader-temp';
      let tempElement = document.getElementById(tempId);
      if (!tempElement) {
        tempElement = document.createElement('div');
        tempElement.id = tempId;
        tempElement.style.display = 'none';
        document.body.appendChild(tempElement);
      }

      const html5QrCode = new Html5Qrcode(tempId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      let decodedText: string | null = null;

      try {
        decodedText = await html5QrCode.scanFile(file, false);
      } catch {
        try {
          const resized = await resizeImage(file, 1000, false);
          decodedText = await html5QrCode.scanFile(resized, false);
        } catch {
          const filtered = await resizeImage(file, 800, true);
          decodedText = await html5QrCode.scanFile(filtered, false);
        }
      }

      html5QrCode.clear();

      if (decodedText) {
        playBeep();
        setLastScannedCode(decodedText);
        onScanSuccess(decodedText);
        if (autoCloseOnScan) {
          onClose();
        }
      } else {
        throw new Error('Barcode tidak terdeteksi.');
      }
    } catch {
      setScanError(
        'Barcode tidak terdeteksi dari foto ini. Gunakan tab "Input Manual" jika barcode pada produk fisik sulit terbaca.'
      );
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeep();
    setLastScannedCode(manualCode.trim());
    onScanSuccess(manualCode.trim());
    setManualCode('');
    if (autoCloseOnScan) {
      onClose();
    }
  };

  const handleClose = async () => {
    await stopCamera();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scanner Barcode Kasir (Scan Kontinu)" maxWidth="lg">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Side: Camera Scanner View (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          {/* Security Banner */}
          {!isSecureContext && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Koneksi Non-Secure (HTTP)</p>
                <p className="text-[11px]">
                  Browser membatasi kamera live pada domain HTTP. Gunakan tab Upload Foto atau Input Manual.
                </p>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-emerald-700 font-bold underline hover:text-emerald-800 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showHelp ? 'Sembunyikan Solusi' : 'Solusi Kamera Live'}
                </button>
              </div>
            </div>
          )}

          {showHelp && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
              <p className="font-bold text-slate-900 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600" /> Solusi Akses Kamera:
              </p>
              <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                <li>Gunakan tab "Upload Foto" atau "Input Manual".</li>
                <li>Akses via <code className="bg-slate-200 px-1 font-mono rounded">localhost:5173</code>.</li>
                <li>Atur flag Chrome: <code className="bg-slate-200 px-1 font-mono rounded">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>.</li>
              </ol>
            </div>
          )}

          {/* Tabs */}
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
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-1.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'file'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Foto</span>
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

          {/* Camera Scan Content */}
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
                <span className="font-medium text-[11px]">Scan barang tanpa henti (kamera bersih full screen).</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGuideline(!showGuideline)}
                    className={`font-bold transition-colors text-[11px] px-2 py-0.5 rounded cursor-pointer ${
                      showGuideline
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    {showGuideline ? 'Sembunyikan Frame' : 'Frame Bantuan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startLiveCamera(selectedCameraId)}
                    className="text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {scanError ? (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex flex-col items-center gap-2 text-xs text-center">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>{scanError}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startLiveCamera(selectedCameraId)}
                      className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                    >
                      Coba Ulang
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('file')}
                      className="px-2.5 py-1 bg-slate-800 text-white font-bold rounded-lg text-xs"
                    >
                      Upload Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-xl overflow-hidden border border-slate-300 relative bg-slate-900 min-h-[200px] flex items-center justify-center">
                  {isStartingCamera && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Menghubungkan Kamera...</span>
                    </div>
                  )}
                  {showGuideline && (
                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                      <div className="w-52 h-32 border border-emerald-400/30 rounded-2xl relative flex items-center justify-center">
                        {/* Corner brackets */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400 rounded-br-lg"></div>
                        {/* Center laser guide line */}
                        <div className="w-full border-t border-dashed border-emerald-400/40"></div>
                        <span className="absolute -bottom-6 text-[10px] font-bold text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Arahkan Barcode ke Sini
                        </span>
                      </div>
                    </div>
                  )}
                  <div id="reader" className="w-full h-full min-h-[200px]"></div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-3 pt-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={isProcessingFile}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl flex flex-col items-center justify-center gap-1.5 text-emerald-700 transition-all cursor-pointer"
              >
                <Upload className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-xs">
                  {isProcessingFile ? 'Membaca Barcode...' : 'Pilih Foto / Jepret Kamera HP'}
                </span>
              </button>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-2 pt-1">
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ketik kode barcode / EAN..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                + Masukkan ke Keranjang
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Live Cart Drawer & Scanned Feed Summary (5 cols) */}
        <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between h-full space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Keranjang Belanja Real-Time</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full tabular-nums">
                {items.length} Item
              </span>
            </div>

            {/* Last Scanned Flash Alert */}
            {lastScannedCode && (
              <div className="mt-2 p-2 bg-emerald-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">Scan Terdeteksi: {lastScannedCode}</span>
              </div>
            )}

            {/* Cart Items List Preview */}
            <div className="mt-3 max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-[1.5]" />
                  <p className="font-semibold text-slate-500">Keranjang masih kosong</p>
                  <p className="text-[10px] mt-0.5">Arahkan barcode barang ke kamera</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-slate-800 truncate text-[11px]">{item.name}</p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {item.quantity}x @ {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-extrabold text-emerald-700 text-xs tabular-nums">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Total Summary & Finish Action */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Total Belanja:</span>
              <span className="font-extrabold text-base text-slate-900 tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Selesai Scan & Ke Pembayaran</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
