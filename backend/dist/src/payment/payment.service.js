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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const chapa_payment_adapter_1 = require("./adapters/chapa.payment.adapter");
const mock_payment_adapter_1 = require("./adapters/mock.payment.adapter");
let PaymentService = PaymentService_1 = class PaymentService {
    configService;
    logger = new common_1.Logger(PaymentService_1.name);
    adapters = new Map();
    defaultProvider;
    constructor(configService) {
        this.configService = configService;
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        this.adapters.set('chapa', new chapa_payment_adapter_1.ChapaPaymentAdapter(configService));
        this.adapters.set('mock', new mock_payment_adapter_1.MockPaymentAdapter());
        this.defaultProvider = this.configService.get('DEFAULT_PAYMENT_PROVIDER') || (isProduction ? 'chapa' : 'mock');
        this.logger.log(`PaymentService initialized with default provider: ${this.defaultProvider}`);
    }
    getAdapter(providerName) {
        const provider = providerName || this.defaultProvider;
        const adapter = this.adapters.get(provider);
        if (!adapter) {
            this.logger.warn(`Provider ${provider} not found, falling back to mock`);
            return this.adapters.get('mock');
        }
        return adapter;
    }
    async initializePayment(params) {
        return this.getAdapter().initializePayment(params);
    }
    async verifyPayment(reference) {
        return this.getAdapter().verifyPayment(reference);
    }
    async executePayout(params) {
        return this.getAdapter().executePayout(params);
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map