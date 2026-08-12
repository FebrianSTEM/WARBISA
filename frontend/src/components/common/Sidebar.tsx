import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  Settings,
  Users,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  ShoppingCart: ShoppingCart,
  Package: Package,
  AlertTriangle: AlertTriangle,
  BarChart3: BarChart3,
  LayoutDashboard: LayoutDashboard,
  Settings: Settings,
  Users: Users,
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { menus, user } = useAuthStore();

  const defaultMenus = [
    ...(user?.roleName === 'Owner'
      ? [{ id: '0', title: 'Dashboard', path: '/dashboard', iconName: 'BarChart3', roles: ['Owner'] }]
      : []),
    { id: '1', title: 'POS Kasir', path: '/pos', iconName: 'ShoppingCart', roles: ['Owner', 'Staff'] },
    { id: '2', title: 'Manajemen Produk', path: '/inventory', iconName: 'Package', roles: ['Owner', 'Staff'] },
    { id: '3', title: 'Low Stock Alert', path: '/low-stock', iconName: 'AlertTriangle', roles: ['Owner', 'Staff'] },
    ...(user?.roleName === 'Owner'
      ? [{ id: '5', title: 'Manajemen Kasir', path: '/cashiers', iconName: 'Users', roles: ['Owner'] }]
      : []),
    { id: '4', title: 'Pengaturan Warung', path: '/settings', iconName: 'Settings', roles: ['Owner', 'Staff'] },
  ];

  const activeMenus = menus && menus.length > 0 ? menus : defaultMenus;

  return (
    <aside
      className={`fixed md:sticky top-16 z-30 bg-slate-50/80 backdrop-blur-xl border-r border-slate-200/70 h-[calc(100vh-64px)] flex flex-col justify-between shrink-0 shadow-xl md:shadow-none transition-all duration-300 ease-in-out ${
        isOpen
          ? 'w-64 p-4 opacity-100 translate-x-0'
          : 'w-0 p-0 opacity-0 -translate-x-full md:translate-x-0 border-none overflow-hidden pointer-events-none'
      }`}
    >
      <div className={`space-y-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="px-3 py-1 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Menu Utama
          </p>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 whitespace-nowrap">
            {user?.roleName || 'Kasir'}
          </span>
        </div>

        <nav className="space-y-1.5">
          {activeMenus.map((menu) => {
            const IconComponent = iconMap[menu.iconName] || ShoppingCart;

            return (
              <NavLink
                key={menu.id || menu.path}
                to={menu.path}
                onClick={() => {
                  if (window.innerWidth < 768 && onClose) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 translate-x-1'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <IconComponent
                        className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-700'
                        }`}
                      />
                      <span>{menu.title}</span>
                    </div>

                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-emerald-100/90 animate-pulse shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className={`p-3.5 bg-white/80 backdrop-blur-xs rounded-2xl border border-slate-200/60 shadow-2xs space-y-1 transition-opacity duration-200 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <p className="font-extrabold text-slate-800 text-xs">WASERBI POS</p>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">v1.2</span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">Sistem Kasir & Stock Ledger Realtime</p>
      </div>
    </aside>
  );
};
