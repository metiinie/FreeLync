import { Logger } from '@nestjs/common';
import {
    PaymentAdapter,
    PaymentInitializationResult,
    PaymentStatus,
    PayoutExecutionResult,
} from '../interfaces/payment-adapter.interface';

export class MockPaymentAdapter implements PaymentAdapter { // In-memory mock
    private readonly logger = new Logger(MockPaymentAdapter.name);

    async initializePayment(params: {
        amount: number;
        currency: string;
        email: string;
        callbackUrl: string;
        reference: string;
        metadata?: any;
    }): Promise<PaymentInitializationResult> {
        this.logger.log(`Initialized Mock Payment for ${params.email}: ${params.amount} ${params.currency} (Ref: ${params.reference})`);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (params.metadata?.force_fail) {
            throw new Error("Mock Payment Initialization Failed (Forced)");
        }

        return {
            transactionId: `mock_tx_${Date.now()}`,
            checkoutUrl: `http://localhost:3000/mock-checkout?ref=${params.reference}&amt=${params.amount}`,
            reference: params.reference,
            currency: params.currency,
            amount: params.amount,
            metadata: params.metadata,
        };
    }

    async verifyPayment(reference: string): Promise<{
        status: PaymentStatus;
        gatewayReference: string;
        amount?: number;
        currency?: string;
    }> {
        this.logger.log(`Verifying Mock Payment Ref: ${reference}`);

        // Simulate lookup delay
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Simple deterministic logic based on reference suffix?
        // Or check params in metadata if we had state.
        // For now, assume success unless ref contains 'fail'.
        if (reference.includes('fail')) {
            return {
                status: PaymentStatus.FAILED,
                gatewayReference: `mock_gp_${reference}`
            };
        }

        return {
            status: PaymentStatus.SUCCESS,
            gatewayReference: `mock_gp_${reference}`,
            amount: 100, // Ideally track this
            currency: 'ETB',
        };
    }

    async executePayout(params: {
        amount: number;
        currency: string;
        recipientDetails: any; // bank info, phone, etc.
        reference: string;
        metadata?: any;
    }): Promise<PayoutExecutionResult> {
        this.logger.log(`Executing Mock Payout (Withdrawal): ${params.amount} ${params.currency} to ${JSON.stringify(params.recipientDetails)} (Ref: ${params.reference})`);

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (params.metadata?.force_payout_fail_temporarily) {
            // Simulate internal transient error to test retry logic
            throw new Error("Mock Payout Gateway Transient Error");
        }

        if (params.metadata?.force_payout_reject) {
            // Simulate permanent rejection (invalid account number)
            // Usually returns successful "execution" but with status FAILED? Or throws?
            // Adapter should ideally return status FAILED.
            return {
                payoutId: `mock_po_fail_${Date.now()}`,
                status: PaymentStatus.FAILED,
                providerReference: `prov_fail_${params.reference}`,
                rawResponse: { error: "Invalid Account" }
            };
        }

        return {
            payoutId: `mock_po_${Date.now()}`, // ID returned by provider
            status: PaymentStatus.SUCCESS, // Or PENDING if async
            providerReference: `prov_${params.reference}`,
            rawResponse: { success: true }
        };
    }
}
