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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("@nestjs/config");
let PaymentService = class PaymentService {
    prisma;
    configService;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async initializeChapaPayment(data) {
        const CHAPA_SECRET_KEY = this.configService.get('CHAPA_SECRET_KEY');
        const response = await axios_1.default.post('https://api.chapa.co/v1/transaction/initialize', {
            amount: data.amount,
            currency: data.currency,
            email: data.buyerEmail,
            first_name: data.buyerName,
            phone_number: data.buyerPhone,
            tx_ref: `tx-${Date.now()}`,
            callback_url: 'https://example.com/callback',
            return_url: 'https://example.com/return',
            customization: {
                title: 'Payment',
                description: 'Payment for validation',
            },
        }, {
            headers: {
                Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
            },
        });
        return response.data;
    }
    async verifyChapaPayment(txRef) {
        const CHAPA_SECRET_KEY = this.configService.get('CHAPA_SECRET_KEY');
        const response = await axios_1.default.get(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
            headers: {
                Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
            },
        });
        return response.data;
    }
    async initializeTelebirrPayment(data) {
        return { success: true, message: "Telebirr initialized (mock)", checkoutUrl: "http://telebirr.mock" };
    }
    async initializeBibitPayment(data) {
        return { success: true, message: "Bibit initialized (mock)", checkoutUrl: "http://bibit.mock" };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map