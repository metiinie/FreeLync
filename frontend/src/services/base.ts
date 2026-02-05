import { api } from './api';

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: unknown;
}

export abstract class BaseService {
  protected static success<T>(data: T, message?: string): ServiceResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  protected static error(message: string, error?: unknown): ServiceResponse {
    return {
      success: false,
      message,
      error,
    };
  }

  protected static handleError(error: unknown, context: string): ServiceResponse {
    console.error(`Error in ${context}:`, error);

    let message = 'An unexpected error occurred';

    // Axios error handling
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      message = axiosError.response?.data?.message || axiosError.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as any).message);
    } else if (typeof error === 'string') {
      message = error;
    }

    return {
      success: false,
      message,
      error,
    };
  }

  protected static async executeQuery<T>(
    queryFn: () => Promise<T>,
    context: string
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await queryFn();
      return this.success(data);
    } catch (error) {
      return this.handleError(error, context) as ServiceResponse<T>;
    }
  }

  // Helper method now simply checks if we have a token or checks explicit role if provided
  protected static async isAdmin(): Promise<boolean> {
    try {
      const response = await api.get('/auth/profile');
      return response.data?.role === 'admin';
    } catch {
      return false;
    }
  }
}