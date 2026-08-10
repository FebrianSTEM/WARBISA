import { axiosClient } from './axiosClient';

export interface CategoryDTO {
  id: string;
  warungId: string;
  name: string;
}

export interface Product {
  id: string;
  warungId: string;
  categoryId?: string;
  categoryName?: string;
  sku: string;
  barcode?: string;
  name: string;
  unit: string; // Pcs, Kg, Pack, Botol, etc.
  costPrice: number; // HPP
  sellingPrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateProductRequest {
  categoryId?: string;
  sku: string;
  barcode?: string;
  name: string;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity?: number;
  minStockThreshold?: number;
}

export interface UpdateProductRequest {
  categoryId?: string;
  sku: string;
  barcode?: string;
  name: string;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  minStockThreshold?: number;
}

export interface RestockProductRequest {
  quantity: number;
  notes?: string;
}

export interface AdjustStockRequest {
  quantityChange: number;
  notes?: string;
}

export const inventoryApi = {
  getProducts: async (search?: string, categoryId?: string): Promise<Product[]> => {
    const response = await axiosClient.get<Product[]>('/products', {
      params: { search, categoryId },
    });
    return response.data;
  },

  getProductBySkuOrBarcode: async (sku: string): Promise<Product | null> => {
    const response = await axiosClient.get<Product>(`/products/scan/${encodeURIComponent(sku)}`);
    return response.data;
  },

  createProduct: async (data: CreateProductRequest): Promise<Product> => {
    const response = await axiosClient.post<Product>('/products', data);
    return response.data;
  },

  updateProduct: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const response = await axiosClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  getLowStockProducts: async (): Promise<Product[]> => {
    const response = await axiosClient.get<Product[]>('/products/low-stock');
    return response.data;
  },

  restockProduct: async (id: string, data: RestockProductRequest): Promise<Product> => {
    const response = await axiosClient.post<Product>(`/products/${id}/restock`, data);
    return response.data;
  },

  adjustStock: async (id: string, data: AdjustStockRequest): Promise<Product> => {
    const response = await axiosClient.post<Product>(`/products/${id}/adjust`, data);
    return response.data;
  },

  getCategories: async (): Promise<CategoryDTO[]> => {
    const response = await axiosClient.get<CategoryDTO[]>('/categories');
    return response.data;
  },

  createCategory: async (name: string): Promise<CategoryDTO> => {
    const response = await axiosClient.post<CategoryDTO>('/categories', { name });
    return response.data;
  },

  updateCategory: async (id: string, name: string): Promise<CategoryDTO> => {
    const response = await axiosClient.put<CategoryDTO>(`/categories/${id}`, { name });
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await axiosClient.delete(`/categories/${id}`);
  },
};

