import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  PackageCheck,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !usernameOrEmail.trim() || !password.trim()) return;

    const success = await login(usernameOrEmail, password);
    if (success) {
      const user = useAuthStore.getState().user;
      if (user?.roleName === 'Owner') {
        navigate('/dashboard');
      } else {
        navigate('/pos');
      }
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 overflow-hidden font-sans relative">
      {/* Soft Ambient Radial Lights (Light Theme) */}
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
              <p className="text-xs text-emerald-300 font-medium">Sistem Kasir & Ledger Stok Warung</p>
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
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Live Terminal POS</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                Online Sync
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Omset Hari Ini</span>
                </div>
                <p className="text-sm font-black text-white">Rp 1.450.000</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <PackageCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Stok SKU Safe</span>
                </div>
                <p className="text-sm font-black text-white">142 Produk</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/10">
              <span className="flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total 18 Transaksi</span>
              </span>
              <span className="text-emerald-400 font-bold">Untung Bersih +24%</span>
            </div>
          </div>

          {/* Capability Tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-center space-y-1 hover:bg-slate-900/90 transition-colors">
              <ShoppingCart className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-[11px] font-bold text-slate-200">Kasir Cepat</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-center space-y-1 hover:bg-slate-900/90 transition-colors">
              <BarChart3 className="w-5 h-5 text-teal-400 mx-auto" />
              <p className="text-[11px] font-bold text-slate-200">HPP Profit</p>
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

      {/* Right Panel: Bright Form Canvas (7/12 Desktop) */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative bg-slate-50">
        {/* Navigation Auth Switcher Pill */}
        <div className="w-full max-w-md mb-6 flex items-center justify-center z-10">
          <div className="bg-slate-200/80 p-1 rounded-2xl border border-slate-300 flex items-center gap-1 w-full max-w-xs shadow-inner">
            <button
              type="button"
              className="flex-1 py-2 text-xs font-extrabold text-slate-900 bg-white rounded-xl shadow-xs text-center transition-all cursor-default"
            >
              🔑 Masuk
            </button>
            <Link
              to="/register"
              className="flex-1 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 text-center transition-all cursor-pointer"
            >
              📝 Daftar Toko
            </Link>
          </div>
        </div>

        {/* Mobile Logo Header */}
        <div className="lg:hidden text-center space-y-2 mb-6 z-10">
          <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto shadow-lg border border-slate-200 bg-white">
            <img src="/waserbi_logo.png" alt="WASERBI Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">WARBISA POS</h1>
          <p className="text-xs text-slate-500 font-medium">Sistem Kasir & Inventaris Toko</p>
        </div>

        {/* Main Form Container Card */}
        <div className="w-full max-w-md bg-white rounded-[2rem] border border-slate-200/90 shadow-2xl shadow-slate-300/40 p-7 sm:p-9 space-y-6 relative overflow-hidden z-10">
          {/* Header */}
          <div className="space-y-1.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Portal Masuk Warung</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-xs text-slate-500 font-medium">
              Masukkan username dan password Anda untuk masuk ke sistem.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Controls */}
          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Username atau Email *
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Masukkan username / email"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Action Links */}
          <div className="text-center pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              Belum punya akun toko?{' '}
              <Link
                to="/register"
                className="text-emerald-700 hover:text-emerald-800 font-bold underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Daftar Toko Baru</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              WARBISA POS v1.2 — Kasir & Ledger Realtime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;





