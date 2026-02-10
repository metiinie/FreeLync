"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPaymentAdapter = void 0;
const common_1 = require("@nestjs/common");
const payment_adapter_interface_1 = require("../interfaces/payment-adapter.interface");
class MockPaymentAdapter {
    logger = new common_1.Logger(MockPaymentAdapter.name);
    async initializePayment(params) {
        this.logger.log(`Initialized Mock Payment for ${params.email}: ${params.amount} ${params.currency} (Ref: ${params.reference})`);
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
    async verifyPayment(reference) {
        this.logger.log(`Verifying Mock Payment Ref: ${reference}`);
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (reference.includes('fail')) {
            return {
                status: payment_adapter_interface_1.PaymentStatus.FAILED,
                gatewayReference: `mock_gp_${reference}`
            };
        }
        return {
            status: payment_adapter_interface_1.PaymentStatus.SUCCESS,
            gatewayReference: `mock_gp_${reference}`,
            amount: 100,
            currency: 'ETB',
        };
    }
    async executePayout(params) {
        this.logger.log(`Executing Mock Payout (Withdrawal): ${params.amount} ${params.currency} to ${JSON.stringify(params.recipientDetails)} (Ref: ${params.reference})`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (params.metadata?.force_payout_fail_temporarily) {
            throw new Error("Mock Payout Gateway Transient Error");
        }
        if (params.metadata?.force_payout_reject) {
            return {
                payoutId: `mock_po_fail_${Date.now()}`,
                status: payment_adapter_interface_1.PaymentStatus.FAILED,
                providerReference: `prov_fail_${params.reference}`,
                rawResponse: { error: "Invalid Account" }
            };
        }
        return {
            payoutId: `mock_po_${Date.now()}`,
            status: payment_adapter_interface_1.PaymentStatus.SUCCESS,
            providerReference: `prov_${params.reference}`,
            rawResponse: { success: true }
        };
    }
}
exports.MockPaymentAdapter = MockPaymentAdapter;
//# sourceMappingURL=mock.payment.adapter.js.map