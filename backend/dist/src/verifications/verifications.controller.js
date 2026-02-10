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
exports.VerificationsController = void 0;
const common_1 = require("@nestjs/common");
const verifications_service_1 = require("./verifications.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_request_dto_1 = require("./dto/create-request.dto");
const submit_document_dto_1 = require("./dto/submit-document.dto");
let VerificationsController = class VerificationsController {
    verificationsService;
    constructor(verificationsService) {
        this.verificationsService = verificationsService;
    }
    createRequest(req, dto) {
        return this.verificationsService.createRequest(req.user.id, dto);
    }
    getMyRequests(req) {
        return this.verificationsService.getMyRequests(req.user.id);
    }
    submitDocument(req, requestId, dto) {
        return this.verificationsService.submitDocument(req.user.id, requestId, dto);
    }
    getDocumentTypes() {
        return this.verificationsService.getDocumentTypes();
    }
};
exports.VerificationsController = VerificationsController;
__decorate([
    (0, common_1.Post)('requests'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_request_dto_1.CreateVerificationRequestDto]),
    __metadata("design:returntype", void 0)
], VerificationsController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VerificationsController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Post)('requests/:id/documents'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_document_dto_1.SubmitDocumentDto]),
    __metadata("design:returntype", void 0)
], VerificationsController.prototype, "submitDocument", null);
__decorate([
    (0, common_1.Get)('document-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VerificationsController.prototype, "getDocumentTypes", null);
exports.VerificationsController = VerificationsController = __decorate([
    (0, common_1.Controller)('verifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [verifications_service_1.VerificationsService])
], VerificationsController);
//# sourceMappingURL=verifications.controller.js.map