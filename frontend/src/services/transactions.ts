import { api, endpoints } from './api';
import { Transaction, CreateTransactionData } from '../types';

export class TransactionsService {
  // Calculate commission (2%)
  static calculateCommission(amount: number): { amount: number; rate: number } {
    const rate = 0.02; // 2%
    return {
      amount: amount * rate,
      rate,
    };
  }

  // Create a new transaction
  static async createTransaction(
    transactionData: CreateTransactionData
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      const response = await api.post(endpoints.transactions.create, transactionData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create transaction',
      };
    }
  }

  // Get transaction by ID
  static async getTransactionById(id: string): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      const response = await api.get(endpoints.transactions.detail(id));
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch transaction',
      };
    }
  }

  // Get user's transactions
  static async getUserTransactions(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Transaction[]; total: number; message?: string }> {
    try {
      const response = await api.get(endpoints.transactions.list, {
        params: { ...pagination, userId } // Helper to filter by user in backend
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        message: error.message || 'Failed to fetch user transactions',
      };
    }
  }

  // Get transactions by status
  static async getTransactionsByStatus(
    status: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Transaction[]; total: number; message?: string }> {
    try {
      const response = await api.get(endpoints.transactions.list, {
        params: { ...pagination, status }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        message: error.message || 'Failed to fetch transactions',
      };
    }
  }

  // Update transaction status
  static async updateTransactionStatus(
    id: string,
    status: string,
    adminId?: string
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      const response = await api.patch(endpoints.transactions.updateStatus(id), { status, adminId });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to update transaction status',
      };
    }
  }

  // Release escrow funds
  static async releaseEscrow(
    transactionId: string,
    adminId: string
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    // Map to update status for now or dedicated endpoint
    return this.updateTransactionStatus(transactionId, 'released', adminId);
  }

  // Refund transaction
  static async refundTransaction(
    transactionId: string,
    adminId: string,
    reason?: string
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    // Map to update status
    return this.updateTransactionStatus(transactionId, 'refunded', adminId);
  }

  // Get transaction statistics
  static async getTransactionStats(): Promise<{ success: boolean; data: any; message?: string }> {
    // Needs backend endpoint
    return { success: false, data: null, message: "Stats Not Implemented" };
  }

  // Get pending escrow transactions
  static async getPendingEscrowTransactions(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Transaction[]; total: number; message?: string }> {
    return this.getTransactionsByStatus('escrowed', pagination);
  }

  // Get transactions requiring admin action
  static async getTransactionsRequiringAction(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Transaction[]; total: number; message?: string }> {
    // Needs advanced filtering in backend
    return this.getTransactionsByStatus('pending', pagination);
  }

  // Mark transaction as disputed
  static async disputeTransaction(
    transactionId: string,
    reason: string,
    userId: string
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    return this.updateTransactionStatus(transactionId, 'disputed');
  }
}