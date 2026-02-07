import { api, endpoints } from './api';
import { User, UpdateUserData } from '../types';

export class UsersService {
  // Get user by ID
  static async getUserById(id: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const response = await api.get(endpoints.users.detail(id));
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, data: null, message: error.message || 'Failed to fetch user' };
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    // Requires backend endpoint filtering by email
    try {
      const response = await api.get(endpoints.users.list, { params: { email } });
      const user = response.data?.[0]; // Assuming list returns array
      return { success: true, data: user || null };
    } catch (error: any) {
      return { success: false, data: null, message: error.message };
    }
  }

  // Update user profile
  static async updateUser(
    id: string,
    updates: UpdateUserData
  ): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const response = await api.patch(endpoints.users.update(id), updates);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, data: null, message: error.message };
    }
  }

  // Get all users (admin only)
  static async getAllUsers(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 },
    filters: { role?: string; verified?: boolean; is_active?: boolean } = {}
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    try {
      const response = await api.get(endpoints.users.list, { params: { ...pagination, ...filters } });
      return {
        success: true,
        data: response.data || [],
        total: (response.data || []).length // Need total count in response headers ideally
      };
    } catch (error: any) {
      return { success: false, data: [], total: 0, message: error.message };
    }
  }

  // Verify user
  static async verifyUser(id: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    return this.updateUser(id, { verified: true } as any);
  }

  // Suspend user
  static async suspendUser(id: string, reason?: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    return this.updateUser(id, { is_active: false } as any);
  }

  // Activate user
  static async activateUser(id: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    return this.updateUser(id, { is_active: true } as any);
  }

  // Update user role
  static async updateUserRole(
    id: string,
    role: 'buyer' | 'seller' | 'admin'
  ): Promise<{ success: boolean; data: User | null; message?: string }> {
    return this.updateUser(id, { role } as any);
  }

  // Update user rating
  static async updateUserRating(
    id: string,
    rating: { average: number; count: number }
  ): Promise<{ success: boolean; data: User | null; message?: string }> {
    return this.updateUser(id, { rating } as any);
  }

  // Update user preferences
  static async updateUserPreferences(
    id: string,
    preferences: User['preferences']
  ): Promise<{ success: boolean; data: User | null; message?: string }> {
    return this.updateUser(id, { preferences } as any);
  }

  // Get user statistics
  static async getUserStats(): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error: any) {
      return { success: false, data: null, message: error.message };
    }
  }

  // Search users
  static async searchUsers(
    searchTerm: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    try {
      const response = await api.get(endpoints.users.list, { params: { ...pagination, search: searchTerm } });
      return { success: true, data: response.data, total: response.data.length };
    } catch (error: any) {
      return { success: false, data: [], total: 0, message: error.message };
    }
  }

  // Get users by role
  static async getUsersByRole(
    role: 'buyer' | 'seller' | 'admin',
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    return this.getAllUsers(pagination, { role });
  }

  // Get pending verification users
  static async getPendingVerificationUsers(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    return this.getAllUsers(pagination, { verified: false, is_active: true });
  }

  // Get suspended users
  static async getSuspendedUsers(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    return this.getAllUsers(pagination, { is_active: false });
  }
}