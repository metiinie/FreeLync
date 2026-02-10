"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChapaPaymentAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChapaPaymentAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const payment_adapter_interface_1 = require("../interfaces/payment-adapter.interface");
let ChapaPaymentAdapter = ChapaPaymentAdapter_1 = class ChapaPaymentAdapter {
    configService;
    logger = new common_1.Logger(ChapaPaymentAdapter_1.name);
    chapaSecretKey;
    baseUrl = 'https://api.chapa.co/v1';
    constructor(configService) {
        this.configService = configService;
        this.chapaSecretKey = this.configService.get('CHAPA_SECRET_KEY') || 'mock_key_for_dev';
    }
    async initializePayment(params) {
        try {
            this.logger.log(`Initializing Chapa Payment: ${params.amount} ${params.currency} [${params.reference}]`);
            const response = await axios_1.default.post(`${this.baseUrl}/transaction/initialize`, {
                amount: params.amount,
                currency: params.currency,
                email: params.email,
                first_name: params.metadata?.firstName,
                last_name: params.metadata?.lastName,
                phone_number: params.phoneNumber,
                tx_ref: params.reference,
                callback_url: params.callbackUrl,
                return_url: params.metadata?.returnUrl || 'https://freelync.com/payment/success',
                customization: {
                    title: 'FreeLync Payment',
                    description: params.metadata?.description || 'Transaction',
                },
            }, {
                headers: {
                    Authorization: `Bearer ${this.chapaSecretKey}`,
                },
            });
            if (response.data.status !== 'success') {
                throw new Error('Chapa initialization failed: ' + response.data.message);
            }
            return {
                transactionId: params.reference,
                checkoutUrl: response.data.data.checkout_url,
                reference: params.reference,
                amount: params.amount,
                currency: params.currency,
                metadata: response.data.data,
            };
        }
        catch (error) {
            this.logger.error('Chapa Initialization Error', error.message);
            throw error;
        }
    }
    async verifyPayment(reference) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${this.chapaSecretKey}`,
                },
            });
            if (response.data.status === 'success') {
                const data = response.data.data;
                return {
                    status: payment_adapter_interface_1.PaymentStatus.SUCCESS,
                    gatewayReference: data.reference || reference,
                    amount: parseFloat(data.amount),
                    currency: data.currency
                };
            }
            return {
                status: payment_adapter_interface_1.PaymentStatus.FAILED,
                gatewayReference: reference
            };
        }
        catch (error) {
            this.logger.error('Chapa Verification Error', error.message);
            if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                return { status: payment_adapter_interface_1.PaymentStatus.FAILED, gatewayReference: reference };
            }
            throw error;
        }
    }
    async executePayout(params) {
        this.logger.log(`Executing Chapa Payout: ${params.amount} -> ${JSON.stringify(params.recipientDetails)}`);
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/transfers`, {
                account_name: params.recipientDetails.account_name,
                account_number: params.recipientDetails.account_number,
                amount: params.amount,
                currency: params.currency,
                reference: params.reference,
                bank_code: params.recipientDetails.bank_code,
            }, { headers: { Authorization: `Bearer ${this.chapaSecretKey}` } });
            if (response.data.status === 'success') {
                return {
                    payoutId: response.data.data.id || params.reference,
                    providerReference: response.data.data.reference || params.reference,
                    status: payment_adapter_interface_1.PaymentStatus.PENDING,
                    rawResponse: response.data
                };
            }
            else {
                return {
                    payoutId: `failed_${Date.now()}`,
                    providerReference: params.reference,
                    status: payment_adapter_interface_1.PaymentStatus.FAILED,
                    rawResponse: response.data
                };
            }
        }
        catch (error) {
            this.logger.error('Chapa Payout Error', error.message);
            throw error;
        }
    }
};
exports.ChapaPaymentAdapter = ChapaPaymentAdapter;
exports.ChapaPaymentAdapter = ChapaPaymentAdapter = ChapaPaymentAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ChapaPaymentAdapter);
//# sourceMappingURL=chapa.payment.adapter.js.map