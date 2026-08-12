import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  Store,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  PackageCheck,
  Receipt,
} from 'lucide-react';
import { Toast } from '../components/common/Toast';
import type { ToastMessage } from '../components/common/Toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [warungName, setWarungName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim() || !warungName.trim()) {
      setFormError('Silakan lengkapi semua kolom yang wajib diisi (*).');
      return;
    }

    if (password.length < 6) {
      setFormError('Password minimal harus 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok dengan password.');
      return;
    }

    const success = await register({
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
      roleId: 1, // 1 = Owner / Admin
      warungName: warungName.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    if (success) {
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Pendaftaran Warung & Akun Admin berhasil! Silakan login.',
      });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 overflow-hidden font-sans relative">
      {/* Soft Ambient Background Radial Lights */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Left Panel: Hero Showcase with Store Illustration Background (5/12 Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 p-8 xl:p-12 text-white flex-col justify-between relative overflow-hidden border-r border-slate-200/80 bg-slate-950">
        {/* Background Store Illustration Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/store_hero_bg.png" alt="Store Interior" className="w-full h-full object-cover opacity-35 filter brightness-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-emerald-950/70 backdrop-blur-[2px]" />
        </div>

        {/* Top Brand Header */}
        <div className="space-y-4 z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem POS Terintegrasi</span>
          </div>

          <div className="flex items-center gap-3.5 pt-1">
            <div className="w-13 h-13 rounded-2xl overflow-hidden shadow-xl shadow-slate-950/50 border border-emerald-400/40 ring-4 ring-emerald-500/20 shrink-0 bg-slate-900">
              <img src="/waserbi_logo.png" alt="WASERBI Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">WARBISA POS</h1>
              <p className="text-xs text-emerald-300 font-medium">Platform Kasir & Management Toko</p>
            </div>
          </div>
        </div>

        {/* Middle Interactive Mock Store Terminal Card */}
        <div className="space-y-4 my-6 z-10 relative">
          {/* Live Mock Stats Floating Glass Card */}
          <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/20 space-y-4 shadow-2xl relative overflow-hidden group hover:bg-slate-900/90 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Toko Siap Operasi</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                Gratis
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Setup Instant</span>
                </div>
                <p className="text-sm font-black text-white">2 Menit</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <PackageCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Katalog Produk</span>
                </div>
                <p className="text-sm font-black text-white">Unlimited SKU</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/10">
              <span className="flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi Terminal Ready</span>
              </span>
              <span className="text-emerald-400 font-bold">PDF/Excel Export</span>
            </div>
          </div>

          {/* Capability Tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-center space-y-1 hover:bg-slate-900/90 transition-colors">
              <ShoppingCart className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-[11px] font-bold text-slate-200">POS Kasir</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-center space-y-1 hover:bg-slate-900/90 transition-colors">
              <BarChart3 className="w-5 h-5 text-teal-400 mx-auto" />
              <p className="text-[11px] font-bold text-slate-200">Laporan Omset</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-center space-y-1 hover:bg-slate-900/90 transition-colors">
              <ShieldCheck className="w-5 h-5 text-amber-400 mx-auto" />
              <p className="text-[11px] font-bold text-slate-200">Audit Stok</p>
            </div>
          </div>
        </div>

        {/* Bottom Version Status */}
        <div className="pt-4 border-t border-white/15 flex items-center justify-between z-10 relative text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">WASERBI Store Engine</span>
          </div>
          <span className="font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-600/40 shadow-xs">
            v1.2
          </span>
        </div>
      </div>

      {/* Right Panel: Bright Registration Form Canvas (7/12 Desktop) */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative bg-slate-50 overflow-y-auto">
        {/* Navigation Auth Switcher Pill */}
        <div className="w-full max-w-xl mb-4 flex items-center justify-center z-10">
          <div className="bg-slate-200/80 p-1 rounded-2xl border border-slate-300 flex items-center gap-1 w-full max-w-xs shadow-inner">
            <Link
              to="/login"
              className="flex-1 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 text-center transition-all cursor-pointer"
            >
              🔑 Masuk
            </Link>
            <button
              type="button"
              className="flex-1 py-2 text-xs font-extrabold text-slate-900 bg-white rounded-xl shadow-xs text-center transition-all cursor-default"
            >
              📝 Daftar Toko
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden text-center space-y-2 mb-4 pt-2 z-10">
          <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto shadow-lg border border-slate-200 bg-white">
            <img src="/waserbi_logo.png" alt="WASERBI Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">WARBISA POS</h1>
          <p className="text-xs text-slate-500 font-medium">Registrasi Akun Admin & Toko Baru</p>
        </div>

        {/* Registration Form Card Container */}
        <div className="w-full max-w-xl bg-white rounded-[2rem] border border-slate-200/90 shadow-2xl shadow-slate-300/40 p-6 sm:p-9 space-y-6 relative overflow-hidden my-auto z-10 animate-auth-slide-right">
          {/* Header */}
          <div className="space-y-1.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Registrasi Toko Baru</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Buat Akun Toko Baru</h2>
            <p className="text-xs text-slate-500 font-medium">
              Lengkapi informasi akun Admin dan data warung Anda untuk memulai.
            </p>
          </div>

          {(formError || error) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2.5 animate-fade-in">
              <span className="text-rose-600 text-sm">⚠️</span>
              <span>{formError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Pemilik */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nama Lengkap Owner *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Username Login *</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin_budi"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Email Aktif *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@warung.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Nama Warung */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nama Warung / Toko *</label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={warungName}
                    onChange={(e) => setWarungName(e.target.value)}
                    placeholder="Warung Berkah Jaya"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Konfirmasi Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Telepon */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">No. Telepon / WA (Opsional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Alamat */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Alamat Warung (Opsional)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Merdeka No. 12"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer mt-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Pendaftaran...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daftarkan Warung & Akun Baru</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="pt-3 text-center text-xs font-semibold text-slate-600 border-t border-slate-100">
            Sudah memiliki akun toko?{' '}
            <Link to="/login" className="text-emerald-700 hover:text-emerald-800 font-bold underline inline-flex items-center gap-1 cursor-pointer">
              <span>Masuk (Login) Di Sini</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default RegisterPage;


