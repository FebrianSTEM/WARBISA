import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import type { ThemeMode } from '../store/useThemeStore';
import { Store, Upload, Trash2, Save, Phone, MapPin, Building, Printer, Clock, Globe, Sun, Moon, Sparkles } from 'lucide-react';
import { Toast } from '../components/common/Toast';
import type { ToastMessage } from '../components/common/Toast';
import { formatDateTimeInTimeZone } from '../utils/dateFormatter';

export const WarungSettingsPage: React.FC = () => {
  const { user, updateWarungProfile } = useAuthStore();
  const { themeMode, effectiveTheme, setThemeMode } = useThemeStore();

  const [warungName, setWarungName] = useState<string>(user?.warungName || 'WARBISA');
  const [logoUrl, setLogoUrl] = useState<string>(user?.warungLogoUrl || '');
  const [address, setAddress] = useState<string>(user?.warungAddress || '');
  const [phone, setPhone] = useState<string>(user?.warungPhone || '');
  const [timeZone, setTimeZone] = useState<string>(user?.timeZone || 'Asia/Jakarta');
  const [selectedThemeMode, setSelectedThemeMode] = useState<ThemeMode>(themeMode);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Ukuran foto logo maksimal 2MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
        setToast({
          id: Date.now().toString(),
          type: 'success',
          message: 'Foto logo warung berhasil diunggah. Klik Simpan Perubahan.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setToast({
      id: Date.now().toString(),
      type: 'info',
      message: 'Logo kustom dihapus (Kembali menggunakan ikon standar).',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warungName.trim()) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Nama warung tidak boleh kosong.',
      });
      return;
    }

    try {
      setIsSaving(true);
      setThemeMode(selectedThemeMode);
      await updateWarungProfile({
        warungName: warungName.trim(),
        warungLogoUrl: logoUrl || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        timeZone,
        themeMode: selectedThemeMode,
      });

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Profil, Zona Waktu & Tema Tampilan Warung berhasil diperbarui!',
      });
    } catch {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Gagal memperbarui profil warung.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building className="w-7 h-7 text-emerald-600" />
          <span>Pengaturan Warung & Logo Kustom</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Atur nama warung, unggah foto logo toko, serta alamat & kontak yang akan tercetak pada struk kasir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Form Settings (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Logo Upload Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Logo Kustom Warung / Toko</label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                {/* Logo Preview */}
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Warung" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Store className="w-8 h-8 text-emerald-600 mb-1" />
                      <span className="text-[9px] font-bold text-slate-400">Standard Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Upload foto logo toko Anda (JPG, PNG, WebP — Max 2MB).
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <label className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Logo Baru</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Logo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Nama Warung */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">Nama Warung / Toko *</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={warungName}
                  onChange={(e) => setWarungName(e.target.value)}
                  placeholder="Contoh: Warung Berkah Jaya"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Alamat Warung */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">Alamat Lengkap Toko (Untuk Struk)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Raya Pasar Baru No. 88, Jakarta"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Nomor Telepon / WA */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">Nomor Telepon / WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Zona Waktu Warung (Timezone) */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-800 block flex items-center justify-between">
                <span>Zona Waktu Operasional Toko (Timezone) *</span>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  UTC+7 (WIB) Default
                </span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                >
                  <option value="Asia/Jakarta">🇮🇩 Asia/Jakarta — WIB (Waktu Indonesia Barat: UTC+07:00)</option>
                  <option value="Asia/Makassar">🇮🇩 Asia/Makassar — WITA (Waktu Indonesia Tengah: UTC+08:00)</option>
                  <option value="Asia/Jayapura">🇮🇩 Asia/Jayapura — WIT (Waktu Indonesia Timur: UTC+09:00)</option>
                  <option value="UTC">🌐 UTC — Coordinated Universal Time (UTC+00:00)</option>
                </select>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] font-semibold text-emerald-900 flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Waktu Live Warung Sekarang: <strong>{formatDateTimeInTimeZone(new Date(), timeZone)}</strong>
                </span>
              </div>
            </div>

            {/* Mode Tema Tampilan & Dark Mode Auto 6 PM */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Tema Tampilan & Dark Mode Otomatis *
                </label>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                  {effectiveTheme === 'dark' ? <Moon className="w-3 h-3 text-emerald-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                  <span>{effectiveTheme === 'dark' ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1: Normal Light Mode */}
                <div
                  onClick={() => {
                    setSelectedThemeMode('light');
                    setThemeMode('light');
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    selectedThemeMode === 'light'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm dark:bg-emerald-950/40 dark:border-emerald-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <input
                      type="radio"
                      name="themeMode"
                      checked={selectedThemeMode === 'light'}
                      onChange={() => {
                        setSelectedThemeMode('light');
                        setThemeMode('light');
                      }}
                      className="accent-emerald-600"
                    />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">Normal / Terang</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tampilan terang sepanjang hari.</p>
                  </div>
                </div>

                {/* Option 2: Dark Mode */}
                <div
                  onClick={() => {
                    setSelectedThemeMode('dark');
                    setThemeMode('dark');
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    selectedThemeMode === 'dark'
                      ? 'border-emerald-600 bg-slate-900 text-white shadow-sm dark:border-emerald-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <input
                      type="radio"
                      name="themeMode"
                      checked={selectedThemeMode === 'dark'}
                      onChange={() => {
                        setSelectedThemeMode('dark');
                        setThemeMode('dark');
                      }}
                      className="accent-emerald-600"
                    />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">Gelap / Dark Mode</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tampilan gelap kontras tinggi.</p>
                  </div>
                </div>

                {/* Option 3: Auto Clock Mode (Switches at 6 PM / 18:00) */}
                <div
                  onClick={() => {
                    setSelectedThemeMode('auto');
                    setThemeMode('auto');
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    selectedThemeMode === 'auto'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm dark:bg-emerald-950/40 dark:border-emerald-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <input
                      type="radio"
                      name="themeMode"
                      checked={selectedThemeMode === 'auto'}
                      onChange={() => {
                        setSelectedThemeMode('auto');
                        setThemeMode('auto');
                      }}
                      className="accent-emerald-600"
                    />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">Otomatis Jam (6 PM)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Berubah ke Mode Gelap setelah jam 18:00 WIB.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan Perubahan...' : 'Simpan Profil Warung & Logo'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Live Receipt Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Preview Struk Transaksi Digital</span>
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Live Preview</span>
          </div>

          {/* Receipt Mock Paper */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 font-sans text-xs">
            <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center overflow-hidden shadow-xs mb-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-7 h-7 text-emerald-600" />
                )}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                {warungName.trim() || 'NAMA WARUNG ANDA'}
              </h3>
              {address && <p className="text-[11px] text-slate-500 font-medium">{address}</p>}
              {phone && <p className="text-[10px] text-slate-400">Telp: {phone}</p>}
              <p className="text-[11px] text-slate-400 pt-1">No. Nota: <span className="font-bold text-slate-700">INV-889910</span></p>
            </div>

            <div className="space-y-1 text-slate-600 border-b border-dashed border-slate-300 pb-2 text-[11px]">
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="font-bold text-slate-800">{user?.fullName || 'Kasir Utama'}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold text-emerald-700 uppercase">Cash</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <div>
                  <p className="font-bold text-slate-800">Minyak Goreng Bimoli 1L</p>
                  <p className="text-slate-400 text-[10px]">1 x Rp 18.500</p>
                </div>
                <span className="font-bold text-slate-800">Rp 18.500</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold text-xs">
                <span>Total Belanja</span>
                <span>Rp 18.500</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Kembalian</span>
                <span>Rp 1.500</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-400 font-semibold">
              *** Terima Kasih Telah Berbelanja di {warungName.trim() || 'NAMA WARUNG ANDA'} ***
            </div>
          </div>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
