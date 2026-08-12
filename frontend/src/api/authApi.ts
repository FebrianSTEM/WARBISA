import { axiosClient } from './axiosClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  roleId?: number;
  warungName: string;
  address?: string;
  phone?: string;
}

export interface UserDTO {
  id: string;
  warungId: string;
  warungName?: string;
  warungLogoUrl?: string;
  warungAddress?: string;
  warungPhone?: string;
  timeZone?: string;
  themeMode?: 'light' | 'dark' | 'auto';
  roleId: number;
  roleName: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  user: UserDTO;
}

export interface MenuItem {
  id: string;
  title: string;
  path: string;
  iconName: string;
  roles: string[];
}

export interface UpdateWarungProfileRequest {
  warungName: string;
  warungLogoUrl?: string;
  address?: string;
  phone?: string;
  timeZone?: string;
  themeMode?: 'light' | 'dark' | 'auto';
}

export const authApi = {
  login: async (credentials: { usernameOrEmail: string; password: string }): Promise<LoginResponse> => {
    const response = await axiosClient.post<LoginResponse>('/auth/login', {
      username: credentials.usernameOrEmail,
      password: credentials.password,
    });
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<UserDTO> => {
    const response = await axiosClient.post<UserDTO>('/auth/register', {
      ...data,
      roleId: data.roleId || 1, // Default 1 = Owner / Admin
    });
    return response.data;
  },

  getMenus: async (): Promise<MenuItem[]> => {
    const response = await axiosClient.get<MenuItem[]>('/auth/menus');
    return response.data;
  },

  getCurrentUser: async (): Promise<UserDTO> => {
    const response = await axiosClient.get<UserDTO>('/auth/me');
    return response.data;
  },

  updateWarungProfile: async (data: UpdateWarungProfileRequest): Promise<UserDTO> => {
    const response = await axiosClient.put<UserDTO>('/auth/warung', data);
    return response.data;
  },
};
