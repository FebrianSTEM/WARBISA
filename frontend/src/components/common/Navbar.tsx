import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Badge } from './Badge';

interface NavbarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isSidebarOpen = true, onToggleSidebar }) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 h-16 px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all border border-slate-200 hover:border-emerald-200"
            title={isSidebarOpen ? 'Sembunyikan Menu Sidebar' : 'Tampilkan Menu Sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden border border-emerald-500">
            {user?.warungLogoUrl ? (
              <img src={user.warungLogoUrl} alt="Logo Toko" className="w-full h-full object-cover" />
            ) : (
              <img src="/waserbi_logo.png" alt="WASERBI Logo" className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight uppercase tracking-tight">
              {user?.warungName || 'WARBISA'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden xs:block">
              {user?.warungName ? 'Sistem Kasir & Inventaris Toko' : 'Warung Serba Bisa — POS & Inventaris'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">{user.fullName || user.username}</p>
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
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 hover:border-rose-200"
          title="Keluar dari Sistem"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
