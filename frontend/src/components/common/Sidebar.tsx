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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  ShoppingCart: ShoppingCart,
  Package: Package,
  AlertTriangle: AlertTriangle,
  BarChart3: BarChart3,
  LayoutDashboard: LayoutDashboard,
  Settings: Settings,
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
    { id: '4', title: 'Pengaturan Warung', path: '/settings', iconName: 'Settings', roles: ['Owner', 'Staff'] },
  ];

  const activeMenus = menus && menus.length > 0 ? menus : defaultMenus;

  if (!isOpen) return null;

  return (
    <aside className="fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between shrink-0 shadow-lg md:shadow-none transition-all duration-300 animate-in slide-in-from-left-4">
      <div className="space-y-1">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Menu Utama
        </p>
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <IconComponent className="w-5 h-5 shrink-0" />
              <span>{menu.title}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">WASERBI v1.0</p>
        <p className="mt-0.5">Dual-Pane POS & Realtime Stock Ledger</p>
      </div>
    </aside>
  );
};
