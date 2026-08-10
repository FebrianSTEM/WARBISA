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
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-2xl transition-all border border-slate-200 hover:border-emerald-200"
            title={isSidebarOpen ? 'Sembunyikan Menu Sidebar' : 'Tampilkan Menu Sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 font-bold shadow-xs overflow-hidden">
            {user?.warungLogoUrl ? (
              <img src={user.warungLogoUrl} alt="Logo Toko" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight tracking-tight">
              {user?.warungName || 'WASERBI'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden xs:block">
              {user?.warungName ? 'Sistem Kasir & Inventaris Toko' : 'Warung Serba Bisa — POS & Inventaris'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 border-r border-slate-200/80 pr-4">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              <User className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none">{user.fullName || user.username}</p>
              <div className="mt-1">
                <Badge variant={user.roleName === 'Owner' ? 'success' : 'info'}>
                  {user.roleName}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 rounded-2xl transition-all border border-slate-200/80 hover:border-rose-200"
          title="Keluar dari Sistem"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
