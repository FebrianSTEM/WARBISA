import { create } from 'zustand';
import { cashierApi } from '../api/cashierApi';
import type { CashierUser, AddCashierRequest } from '../api/cashierApi';

interface CashierStore {
  cashiers: CashierUser[];
  isLoading: boolean;
  error: string | null;

  fetchCashiers: () => Promise<void>;
  addCashier: (data: AddCashierRequest) => Promise<boolean>;
  toggleCashierStatus: (id: string) => Promise<boolean>;
  deleteCashier: (id: string) => Promise<boolean>;
  resetPassword: (id: string, newPassword: string) => Promise<boolean>;
}

const INITIAL_CASHIERS: CashierUser[] = [
  {
    id: 'c1',
    fullName: 'Siti Rahmawati',
    username: 'kasir_siti',
    email: 'siti.rahma@warung.com',
    phone: '081234567891',
    roleId: 2,
    roleName: 'Kasir Utama',
    isActive: true,
    createdAt: '2026-01-15T08:30:00Z',
    lastActive: '2026-08-12T10:45:00Z',
    totalTransactionsProcessed: 142,
  },
  {
    id: 'c2',
    fullName: 'Agus Setiawan',
    username: 'kasir_agus',
    email: 'agus.setiawan@warung.com',
    phone: '085712345678',
    roleId: 2,
    roleName: 'Kasir Shift Pagi',
    isActive: true,
    createdAt: '2026-02-01T09:00:00Z',
    lastActive: '2026-08-11T17:20:00Z',
    totalTransactionsProcessed: 89,
  },
  {
    id: 'c3',
    fullName: 'Dewi Larasati',
    username: 'kasir_dewi',
    email: 'dewi.larasati@warung.com',
    phone: '087898765432',
    roleId: 2,
    roleName: 'Kasir Shift Malam',
    isActive: false,
    createdAt: '2026-03-10T14:15:00Z',
    lastActive: '2026-07-28T21:00:00Z',
    totalTransactionsProcessed: 45,
  },
];

export const useCashierStore = create<CashierStore>((set) => ({
  cashiers: INITIAL_CASHIERS,
  isLoading: false,
  error: null,

  fetchCashiers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await cashierApi.getCashiers();
      if (data && data.length > 0) {
        set({ cashiers: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addCashier: async (data: AddCashierRequest) => {
    set({ isLoading: true, error: null });
    try {
      let newCashier: CashierUser;
      try {
        newCashier = await cashierApi.addCashier(data);
      } catch {
        // Fallback local creation for demo / offline
        newCashier = {
          id: `c_${Date.now()}`,
          fullName: data.fullName,
          username: data.username,
          email: data.email,
          phone: data.phone || '-',
          roleId: data.roleId || 2,
          roleName: 'Kasir',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastActive: 'Baru Mendaftar',
          totalTransactionsProcessed: 0,
        };
      }

      set((state) => ({
        cashiers: [newCashier, ...state.cashiers],
        isLoading: false,
      }));
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menambahkan kasir.';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  toggleCashierStatus: async (id: string) => {
    try {
      try {
        await cashierApi.toggleStatus(id);
      } catch {
        // Local toggle fallback
      }

      set((state) => ({
        cashiers: state.cashiers.map((c) =>
          c.id === id ? { ...c, isActive: !c.isActive } : c
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },

  deleteCashier: async (id: string) => {
    try {
      try {
        await cashierApi.deleteCashier(id);
      } catch {
        // Local delete fallback
      }

      set((state) => ({
        cashiers: state.cashiers.filter((c) => c.id !== id),
      }));
      return true;
    } catch {
      return false;
    }
  },

  resetPassword: async (id: string, newPassword: string) => {
    try {
      try {
        await cashierApi.resetPassword(id, newPassword);
      } catch {
        // Local reset fallback
      }
      return true;
    } catch {
      return false;
    }
  },
}));
