import { api, endpoints } from './api';
import { User, RegisterFormData, LoginFormData, UpdateUserData } from '../types';
import { BaseService } from './base';

export class AuthService extends BaseService {
  static async signUp(data: RegisterFormData): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      // Extract only the fields the backend expects, excluding confirm_password and agree_terms
      const { email, password, full_name, role, phone } = data;
      const payload = { email, password, full_name, role, phone };

      const response = await api.post(endpoints.auth.register, payload);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      return this.success(response.data.user, 'Registration successful!');
    } catch (error: any) {
      return this.handleError(error, 'signUp');
    }
  }

  static async signIn(data: LoginFormData): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      // Extract only email and password, excluding remember
      const { email, password } = data;
      const payload = { email, password };

      const response = await api.post(endpoints.auth.login, payload);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      return this.success(response.data.user, 'Login successful!');
    } catch (error: any) {
      return this.handleError(error, 'signIn');
    }
  }

  static async signOut(): Promise<{ success: boolean; message?: string }> {
    try {
      localStorage.removeItem('token');
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Logout failed'
      };
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!localStorage.getItem('token')) return null;

      const response = await api.get(endpoints.auth.profile);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  static async updateProfile(userId: string, data: UpdateUserData): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      // Use the users endpoint to update profile
      const response = await api.patch(endpoints.users.update(userId), data);
      return this.success(response.data, 'Profile updated successfully');
    } catch (error: any) {
      return this.handleError(error, 'updateProfile');
    }
  }

  static async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    // To be implemented in backend
    return { success: false, message: 'Password reset not yet implemented in backend' };
  }

  static async verifyEmail(token: string): Promise<{ success: boolean; message?: string }> {
    // To be implemented in backend
    return { success: false, message: 'Email verification not yet implemented in backend' };
  }

  // Helper handling errors compatible with BaseService
  protected static handleError(error: any, context: string) {
    console.error(`Error in ${context}:`, error);
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return {
      success: false,
      message,
      error
    };
  }
}
