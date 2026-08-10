import { axiosClient } from './axiosClient';

export interface CheckoutItemRequest {
  productId: string;
  quantity: number;
}

export interface CheckoutRequest {
  customerName?: string;
  paymentMethod: 'Cash' | 'QRIS' | 'Transfer';
  paidAmount: number;
  items: CheckoutItemRequest[];
}

export interface TransactionItemResponse {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  costPriceAtSale: number;
  sellingPriceAtSale: number;
  subtotal: number;
}

export interface TransactionReceiptResponse {
  id: string;
  invoiceNo: string;
  warungId: string;
  userId: string;
  userName: string;
  customerName: string;
  paymentMethod: 'Cash' | 'QRIS' | 'Transfer';
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  midtransSnapToken?: string;
  midtransOrderId?: string;
  settledAt?: string;
  createdAt: string;
  items: TransactionItemResponse[];
}

export const posApi = {
  checkout: async (data: CheckoutRequest): Promise<TransactionReceiptResponse> => {
    const response = await axiosClient.post<TransactionReceiptResponse>('/transactions', data);
    return response.data;
  },

  getReceipt: async (transactionId: string): Promise<TransactionReceiptResponse> => {
    const response = await axiosClient.get<TransactionReceiptResponse>(`/transactions/${transactionId}`);
    return response.data;
  },
};

