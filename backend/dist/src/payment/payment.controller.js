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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let PaymentController = class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async initializePayment(body) {
        const provider = body.provider;
        const adapter = this.paymentService.getAdapter(provider);
        return adapter.initializePayment({
            amount: body.amount,
            currency: body.currency,
            email: body.email,
            reference: body.reference || `tx-${Date.now()}`,
            callbackUrl: body.callbackUrl,
            metadata: body.metadata,
            phoneNumber: body.phoneNumber
        });
    }
    async verifyPayment(reference, provider) {
        const adapter = this.paymentService.getAdapter(provider);
        return adapter.verifyPayment(reference);
    }
    async initializeChapa(body) {
        return this.paymentService.getAdapter('chapa').initializePayment({
            amount: body.amount,
            currency: body.currency || 'ETB',
            email: body.email || body.buyerEmail,
            reference: body.tx_ref || `tx-${Date.now()}`,
            callbackUrl: body.callback_url,
            phoneNumber: body.phone_number || body.buyerPhone,
            metadata: body
        });
    }
    async verifyChapa(txRef) {
        return this.paymentService.getAdapter('chapa').verifyPayment(txRef);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('initialize'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "initializePayment", null);
__decorate([
    (0, common_1.Get)('verify/:reference'),
    __param(0, (0, common_1.Param)('reference')),
    __param(1, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('chapa/initialize'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "initializeChapa", null);
__decorate([
    (0, common_1.Get)('chapa/verify/:txRef'),
    __param(0, (0, common_1.Param)('txRef')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyChapa", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map