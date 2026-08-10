import { create } from 'zustand';
import { authApi } from '../api/authApi';
import type { UserDTO, MenuItem, RegisterRequest, UpdateWarungProfileRequest } from '../api/authApi';

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  menus: MenuItem[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  updateWarungProfile: (data: UpdateWarungProfileRequest) => Promise<void>;
  logout: () => void;
  fetchMenus: () => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('warbisa_user') || 'null'),
  token: localStorage.getItem('warbisa_token'),
  menus: JSON.parse(localStorage.getItem('warbisa_menus') || '[]'),
  isAuthenticated: !!localStorage.getItem('warbisa_token'),
  isLoading: false,
  error: null,

  login: async (usernameOrEmail, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ usernameOrEmail, password });
      localStorage.setItem('warbisa_token', response.token);
      localStorage.setItem('warbisa_user', JSON.stringify(response.user));

      set({
        token: response.token,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      await get().fetchMenus();
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Login gagal. Periksa username dan password.';
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(data);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Pendaftaran gagal. Username atau Email sudah terdaftar.';
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  updateWarungProfile: async (data: UpdateWarungProfileRequest) => {
    try {
      let updatedUser: UserDTO;
      try {
        updatedUser = await authApi.updateWarungProfile(data);
      } catch {
        const current = get().user;
        if (!current) return;
        updatedUser = {
          ...current,
          warungName: data.warungName,
          warungLogoUrl: data.warungLogoUrl,
          warungAddress: data.address,
          warungPhone: data.phone,
        };
      }
      localStorage.setItem('warbisa_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (err: any) {
      console.error('Update Warung Error:', err);
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('warbisa_token');
    localStorage.removeItem('warbisa_user');
    localStorage.removeItem('warbisa_menus');
    set({
      user: null,
      token: null,
      menus: [],
      isAuthenticated: false,
      error: null,
    });
  },

  fetchMenus: async () => {
    try {
      const menus = await authApi.getMenus();
      localStorage.setItem('warbisa_menus', JSON.stringify(menus));
      set({ menus });
    } catch {
      const user = get().user;
      const defaultMenus: MenuItem[] = [
        { id: '1', title: 'POS Kasir', path: '/pos', iconName: 'ShoppingCart', roles: ['Owner', 'Staff'] },
        { id: '2', title: 'Manajemen Produk', path: '/inventory', iconName: 'Package', roles: ['Owner', 'Staff'] },
        { id: '3', title: 'Low Stock Alert', path: '/low-stock', iconName: 'AlertTriangle', roles: ['Owner', 'Staff'] },
      ];

      if (user?.roleName === 'Owner') {
        defaultMenus.unshift({ id: '0', title: 'Dashboard Omset', path: '/dashboard', iconName: 'BarChart3', roles: ['Owner'] });
      }

      defaultMenus.push({ id: '4', title: 'Pengaturan Warung', path: '/settings', iconName: 'Settings', roles: ['Owner', 'Staff'] });

      set({ menus: defaultMenus });
    }
  },

  initializeAuth: () => {
    const token = localStorage.getItem('warbisa_token');
    const userStr = localStorage.getItem('warbisa_user');
    const menusStr = localStorage.getItem('warbisa_menus');

    if (token && userStr) {
      set({
        token,
        user: JSON.parse(userStr),
        menus: menusStr ? JSON.parse(menusStr) : [],
        isAuthenticated: true,
      });
    }
  },
}));
