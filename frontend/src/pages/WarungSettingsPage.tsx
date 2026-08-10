import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Store, Upload, Trash2, Save, Phone, MapPin, Building, Printer } from 'lucide-react';
import { Toast } from '../components/common/Toast';
import type { ToastMessage } from '../components/common/Toast';

export const WarungSettingsPage: React.FC = () => {
  const { user, updateWarungProfile } = useAuthStore();

  const [warungName, setWarungName] = useState<string>(user?.warungName || 'WARBISA');
  const [logoUrl, setLogoUrl] = useState<string>(user?.warungLogoUrl || '');
  const [address, setAddress] = useState<string>(user?.warungAddress || '');
  const [phone, setPhone] = useState<string>(user?.warungPhone || '');

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
      await updateWarungProfile({
        warungName: warungName.trim(),
        warungLogoUrl: logoUrl || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Profil Nama & Logo Warung berhasil diperbarui!',
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
