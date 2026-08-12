import { axiosClient } from './axiosClient';

export interface CashierUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  lastActive?: string;
  totalTransactionsProcessed?: number;
}

export interface AddCashierRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  roleId?: number;
}

export const cashierApi = {
  getCashiers: async (): Promise<CashierUser[]> => {
    try {
      const response = await axiosClient.get<CashierUser[]>('/cashiers');
      return response.data;
    } catch {
      // Fallback response handled in store
      return [];
    }
  },

  addCashier: async (data: AddCashierRequest): Promise<CashierUser> => {
    const response = await axiosClient.post<CashierUser>('/cashiers', data);
    return response.data;
  },

  toggleStatus: async (id: string): Promise<CashierUser> => {
    const response = await axiosClient.patch<CashierUser>(`/cashiers/${id}/toggle-status`);
    return response.data;
  },

  deleteCashier: async (id: string): Promise<void> => {
    await axiosClient.delete(`/cashiers/${id}`);
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await axiosClient.post(`/cashiers/${id}/reset-password`, { newPassword });
  },
};
