import React, { useEffect, useState } from 'react';
import { useCashierStore } from '../store/useCashierStore';
import { AddCashierModal } from '../components/cashier/AddCashierModal';
import { Toast } from '../components/common/Toast';
import type { ToastMessage } from '../components/common/Toast';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import type { CashierUser } from '../api/cashierApi';

export const CashierManagementPage: React.FC = () => {
  const {
    cashiers,
    isLoading,
    fetchCashiers,
    addCashier,
    toggleCashierStatus,
    deleteCashier,
    resetPassword,
  } = useCashierStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Reset Password State
  const [resetModalCashier, setResetModalCashier] = useState<CashierUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Delete Confirmation State
  const [deleteModalCashier, setDeleteModalCashier] = useState<CashierUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetchCashiers();
  }, [fetchCashiers]);

  const filteredCashiers = cashiers.filter((cashier) => {
    const matchesSearch =
      cashier.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cashier.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cashier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cashier.phone && cashier.phone.includes(searchQuery));

    if (!matchesSearch) return false;

    if (filterStatus === 'active') return cashier.isActive;
    if (filterStatus === 'inactive') return !cashier.isActive;

    return true;
  });

  const totalCashiers = cashiers.length;
  const activeCashiers = cashiers.filter((c) => c.isActive).length;
  const inactiveCashiers = cashiers.filter((c) => !c.isActive).length;
  const totalTransactions = cashiers.reduce(
    (acc, curr) => acc + (curr.totalTransactionsProcessed || 0),
    0
  );

  const handleToggleStatus = async (cashier: CashierUser) => {
    const nextStatus = !cashier.isActive;
    const success = await toggleCashierStatus(cashier.id);
    if (success) {
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Status kasir ${cashier.fullName} berhasil diubah menjadi ${
          nextStatus ? 'Aktif' : 'Nonaktif'
        }.`,
      });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalCashier || !newPassword.trim()) return;

    if (newPassword.length < 6) {
      setToast({
        id: Date.now().toString(),
        type: 'info',
        message: 'Password minimal harus 6 karakter.',
      });
      return;
    }

    setIsResetting(true);
    const success = await resetPassword(resetModalCashier.id, newPassword);
    setIsResetting(false);

    if (success) {
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Password kasir ${resetModalCashier.fullName} berhasil diperbarui!`,
      });
      setResetModalCashier(null);
      setNewPassword('');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteModalCashier) return;

    setIsDeleting(true);
    const success = await deleteCashier(deleteModalCashier.id);
    setIsDeleting(false);

    if (success) {
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Akun kasir ${deleteModalCashier.fullName} telah dihapus.`,
      });
      setDeleteModalCashier(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Manajemen Kasir & Staf Warung</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Kelola akun kasir, kontrol hak akses, reset password, dan pantau aktivitas transaksi staf.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Kasir Baru</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Staf Kasir</p>
            <p className="text-xl font-extrabold text-slate-900">{totalCashiers} Orang</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold border border-teal-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Kasir Aktif</p>
            <p className="text-xl font-extrabold text-emerald-600">{activeCashiers} Kasir</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-200">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Kasir Nonaktif</p>
            <p className="text-xl font-extrabold text-slate-600">{inactiveCashiers} Kasir</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Transaksi Staf</p>
            <p className="text-xl font-extrabold text-slate-900">{totalTransactions} Nota</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, username, email..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl border border-slate-300/60 text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({totalCashiers})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterStatus === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif ({activeCashiers})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterStatus === 'inactive'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nonaktif ({inactiveCashiers})
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Staf Kasir</th>
                <th className="py-3.5 px-4">Kontak & WA</th>
                <th className="py-3.5 px-4">Status Akses</th>
                <th className="py-3.5 px-4 text-center">Total Nota POS</th>
                <th className="py-3.5 px-4">Terakhir Aktif</th>
                <th className="py-3.5 px-6 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filteredCashiers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">Tidak Ada Kasir Ditemukan</p>
                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau tambah kasir baru.</p>
                  </td>
                </tr>
              ) : (
                filteredCashiers.map((cashier) => (
                  <tr key={cashier.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Staf Kasir Avatar & Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm border border-emerald-400/40 shrink-0">
                          {cashier.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{cashier.fullName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-slate-400 font-mono text-[11px]">@{cashier.username}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {cashier.roleName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px]">{cashier.email}</span>
                      </div>
                      {cashier.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px]">{cashier.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Status Akses */}
                    <td className="py-4 px-4">
                      {cashier.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    {/* Total Nota POS */}
                    <td className="py-4 px-4 text-center tabular-nums font-extrabold text-slate-900 text-sm">
                      {cashier.totalTransactionsProcessed || 0} Nota
                    </td>

                    {/* Terakhir Aktif */}
                    <td className="py-4 px-4 text-slate-500 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cashier.lastActive ? new Date(cashier.lastActive).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum Pernah'}</span>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(cashier)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            cashier.isActive
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={cashier.isActive ? 'Nonaktifkan Akses Kasir' : 'Aktifkan Akses Kasir'}
                        >
                          {cashier.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>

                        <button
                          onClick={() => setResetModalCashier(cashier)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl border border-amber-200 transition-all cursor-pointer"
                          title="Reset Password Kasir"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteModalCashier(cashier)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all cursor-pointer"
                          title="Hapus Akun Kasir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cashier Modal */}
      <AddCashierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (data) => {
          const success = await addCashier(data);
          if (success) {
            setToast({
              id: Date.now().toString(),
              type: 'success',
              message: `Kasir ${data.fullName} berhasil ditambahkan!`,
            });
          }
          return success;
        }}
        isLoading={isLoading}
      />

      {/* Reset Password Modal */}
      {resetModalCashier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Reset Password Kasir</h3>
                <p className="text-xs text-slate-500 font-medium">{resetModalCashier.fullName} (@{resetModalCashier.username})</p>
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Password Baru *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalCashier(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/20 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isResetting ? 'Memproses...' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalCashier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-slide-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">Hapus Akun Kasir?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Apakah Anda yakin ingin menghapus akun kasir <strong className="text-slate-800">{deleteModalCashier.fullName}</strong>? Kasir tidak akan dapat login lagi.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalCashier(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Kasir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default CashierManagementPage;
