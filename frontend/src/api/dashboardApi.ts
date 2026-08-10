import { axiosClient } from './axiosClient';

export interface PaymentMethodBreakdown {
  method: string; // Cash, QRIS, Transfer
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface DashboardAnalyticsResponse {
  frequency: string; // 'daily', 'monthly', 'yearly'
  grossSales: number;
  netRevenue: number;
  totalTransactions: number;
  lowStockAlertCount: number;
  paymentMethods: PaymentMethodBreakdown[];
  topSellingProducts: TopSellingProduct[];
}

export const dashboardApi = {
  getAnalytics: async (frequency: 'daily' | 'monthly' | 'yearly' = 'daily'): Promise<DashboardAnalyticsResponse> => {
    const response = await axiosClient.get<DashboardAnalyticsResponse>('/dashboard/analytics', {
      params: { frequency },
    });
    return response.data;
  },
};

