import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
    PaymentAdapter,
    PaymentInitializationResult,
    PaymentStatus,
    PayoutExecutionResult,
} from '../interfaces/payment-adapter.interface';

@Injectable()
export class ChapaPaymentAdapter implements PaymentAdapter { // External Chapa API
    private readonly logger = new Logger(ChapaPaymentAdapter.name);
    private readonly chapaSecretKey: string;
    private readonly baseUrl = 'https://api.chapa.co/v1';

    constructor(private configService: ConfigService) {
        this.chapaSecretKey = this.configService.get<string>('CHAPA_SECRET_KEY') || 'mock_key_for_dev';
    }

    async initializePayment(params: {
        amount: number;
        currency: string;
        email: string;
        phoneNumber?: string;
        callbackUrl: string;
        reference: string;
        metadata?: any;
    }): Promise<PaymentInitializationResult> {
        try {
            this.logger.log(`Initializing Chapa Payment: ${params.amount} ${params.currency} [${params.reference}]`);

            const response = await axios.post(
                `${this.baseUrl}/transaction/initialize`,
                {
                    amount: params.amount,
                    currency: params.currency,
                    email: params.email,
                    first_name: params.metadata?.firstName, // Metadata usage
                    last_name: params.metadata?.lastName,
                    phone_number: params.phoneNumber,
                    tx_ref: params.reference,
                    callback_url: params.callbackUrl,
                    return_url: params.metadata?.returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/payment/success`,
                    customization: {
                        title: 'FreeLync Payment',
                        description: params.metadata?.description || 'Transaction',
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.chapaSecretKey}`,
                    },
                }
            );

            // Chapa returns { status: 'success', data: { checkout_url: '...' } }
            if (response.data.status !== 'success') {
                throw new Error('Chapa initialization failed: ' + response.data.message);
            }

            return {
                transactionId: params.reference, // Chapa uses tx_ref as ID
                checkoutUrl: response.data.data.checkout_url,
                reference: params.reference,
                amount: params.amount,
                currency: params.currency,
                metadata: response.data.data,
            };

        } catch (error) {
            this.logger.error('Chapa Initialization Error', error.message);
            throw error;
        }
    }

    async verifyPayment(reference: string): Promise<{
        status: PaymentStatus;
        gatewayReference: string;
        amount?: number;
        currency?: string;
    }> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.chapaSecretKey}`,
                    },
                }
            );

            if (response.data.status === 'success') {
                // Verify amount if returned
                const data = response.data.data;
                // data.status might be 'success'
                // data.currency
                return {
                    status: PaymentStatus.SUCCESS,
                    gatewayReference: data.reference || reference,
                    amount: parseFloat(data.amount),
                    currency: data.currency
                };
            }

            return {
                status: PaymentStatus.FAILED,
                gatewayReference: reference
            };

        } catch (error) {
            this.logger.error('Chapa Verification Error', error.message);
            // Distinguish between 404 (not found) and 500 (network)
            // If 404, payment failed or didn't exist.
            // If 500/timeout, status is unknown/PENDING.
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return { status: PaymentStatus.FAILED, gatewayReference: reference };
            }
            // Consider PENDING for timeouts?
            throw error;
        }
    }

    async executePayout(params: {
        amount: number;
        currency: string;
        recipientDetails: any; // { bank_code: '...', account_number: '...', account_name: '...' }
        reference: string;
        metadata?: any;
    }): Promise<PayoutExecutionResult> {
        // Chapa Transfer API (simulated implementation as specific docs vary)
        // Usually POST /transfers
        this.logger.log(`Executing Chapa Payout: ${params.amount} -> ${JSON.stringify(params.recipientDetails)}`);

        try {
            const response = await axios.post(
                `${this.baseUrl}/transfers`,
                {
                    account_name: params.recipientDetails.account_name,
                    account_number: params.recipientDetails.account_number,
                    amount: params.amount,
                    currency: params.currency,
                    reference: params.reference,
                    bank_code: params.recipientDetails.bank_code,
                },
                { headers: { Authorization: `Bearer ${this.chapaSecretKey}` } }
            );

            if (response.data.status === 'success') {
                return {
                    payoutId: response.data.data.id || params.reference,
                    providerReference: response.data.data.reference || params.reference,
                    status: PaymentStatus.PENDING, // Usually async
                    rawResponse: response.data
                };
            } else {
                return {
                    payoutId: `failed_${Date.now()}`,
                    providerReference: params.reference,
                    status: PaymentStatus.FAILED,
                    rawResponse: response.data
                };
            }
        } catch (error) {
            // If 400 bad request (invalid account), fail permanently.
            // If timeout, let retry logic handle.
            this.logger.error('Chapa Payout Error', error.message);
            throw error;
        }
    }

    // TODO: Implement webhook validation helper
}
