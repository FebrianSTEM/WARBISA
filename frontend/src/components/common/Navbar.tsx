import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Store, LogOut, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Badge } from './Badge';

interface NavbarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isSidebarOpen = true, onToggleSidebar }) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-30 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all duration-200 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-2xl transition-all duration-200 border border-slate-200/60 hover:border-emerald-200 shrink-0 cursor-pointer active:scale-95"
            title={isSidebarOpen ? 'Sembunyikan Menu Sidebar' : 'Tampilkan Menu Sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/70 flex items-center justify-center text-emerald-700 font-bold shadow-xs overflow-hidden shrink-0">
            {user?.warungLogoUrl ? (
              <img src={user.warungLogoUrl} alt="Logo Toko" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight tracking-tight flex items-center gap-2">
              <span>{user?.warungName || 'WASERBI'}</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden xs:block">
              {user?.warungName ? 'Sistem Kasir & Inventaris Toko' : 'Warung Serba Bisa — POS & Inventaris'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <div className="flex items-center gap-2.5 sm:gap-3 bg-slate-50/80 hover:bg-slate-100/70 px-3 py-1.5 rounded-2xl border border-slate-200/60 transition-all">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200/60">
              <User className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {user.fullName || user.username}
              </p>
              <div className="mt-0.5">
                <Badge variant={user.roleName === 'Owner' ? 'success' : 'info'}>
                  {user.roleName}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 rounded-2xl transition-all duration-200 border border-slate-200/60 hover:border-rose-200 cursor-pointer active:scale-95"
          title="Keluar dari Sistem"
        >
          <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-600" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
