import { api, endpoints } from './api';
import { Transaction } from '../types';

export class PaymentService {
  // Initialize Chapa payment
  static async initializeChapaPayment(
    transactionId: string,
    listingId: string,
    amount: number,
    currency: string,
    buyerEmail: string,
    buyerPhone: string,
    buyerName: string
  ): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    try {
      const response = await api.post('/payment/chapa/initialize', {
        transactionId, listingId, amount, currency, buyerEmail, buyerPhone, buyerName
      });
      return { success: true, checkoutUrl: response.data.data.checkout_url };
    } catch (error: any) {
      return { success: false, message: error.message || 'Payment init failed' };
    }
  }

  // Verify Chapa payment
  static async verifyChapaPayment(txRef: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await api.get(`/payment/chapa/verify/${txRef}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Handle Chapa webhook callback
  static async handleChapaWebhook(webhookData: any): Promise<{ success: boolean; message?: string }> {
    // Webhooks are handled by backend
    return { success: true };
  }

  // Initialize Telebirr payment
  static async initializeTelebirrPayment(
    transactionId: string,
    listingId: string,
    amount: number,
    currency: string,
    buyerPhone: string,
    buyerName: string
  ): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    try {
      const response = await api.post('/payment/telebirr/initialize', {
        transactionId, listingId, amount, currency, buyerPhone, buyerName
      });
      return { success: true, checkoutUrl: response.data.checkoutUrl };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Verify Telebirr payment
  static async verifyTelebirrPayment(transactionId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    return { success: false, message: 'Check backend logic' };
  }

  // Handle Telebirr webhook callback
  static async handleTelebirrWebhook(webhookData: any): Promise<{ success: boolean; message?: string }> {
    return { success: true };
  }

  // Initialize Bibit payment
  static async initializeBibitPayment(
    transactionId: string,
    listingId: string,
    amount: number,
    currency: string,
    buyerEmail: string,
    buyerPhone: string
  ): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    try {
      const response = await api.post('/payment/bibit/initialize', {
        transactionId, listingId, amount, currency, buyerEmail, buyerPhone
      });
      return { success: true, checkoutUrl: response.data.checkoutUrl };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Verify Bibit payment
  static async verifyBibitPayment(transactionId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    return { success: false, message: 'Check backend logic' };
  }

  // Handle Bibit webhook callback
  static async handleBibitWebhook(webhookData: any): Promise<{ success: boolean; message?: string }> {
    return { success: true };
  }

  // Generic payment initialization based on method
  static async initializePayment(
    method: 'chapa' | 'telebirr' | 'bibit',
    transactionId: string,
    listingId: string,
    amount: number,
    currency: string,
    buyerEmail: string,
    buyerPhone: string,
    buyerName: string
  ): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    switch (method) {
      case 'chapa':
        return this.initializeChapaPayment(
          transactionId,
          listingId,
          amount,
          currency,
          buyerEmail,
          buyerPhone,
          buyerName
        );
      case 'telebirr':
        return this.initializeTelebirrPayment(
          transactionId,
          listingId,
          amount,
          currency,
          buyerPhone,
          buyerName
        );
      case 'bibit':
        return this.initializeBibitPayment(
          transactionId,
          listingId,
          amount,
          currency,
          buyerEmail,
          buyerPhone
        );
      default:
        return {
          success: false,
          message: 'Invalid payment method',
        };
    }
  }

  // Get payment status
  static async getPaymentStatus(transactionId: string): Promise<{ success: boolean; status?: string; data?: any; message?: string }> {
    // TODO: Implement GET /payment/status/:id on backend
    return { success: false, message: 'Detailed status tracking moved to backend' };
  }
}
