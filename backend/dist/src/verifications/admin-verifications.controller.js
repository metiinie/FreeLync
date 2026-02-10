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
exports.AdminVerificationsController = void 0;
const common_1 = require("@nestjs/common");
const verifications_service_1 = require("./verifications.service");
const permission_guard_1 = require("../common/guards/permission.guard");
const audit_interceptor_1 = require("../common/interceptors/audit.interceptor");
const require_permissions_decorator_1 = require("../common/decorators/require-permissions.decorator");
const admin_context_decorator_1 = require("../common/decorators/admin-context.decorator");
const review_request_dto_1 = require("./dto/review-request.dto");
const client_1 = require("@prisma/client");
let AdminVerificationsController = class AdminVerificationsController {
    verificationsService;
    constructor(verificationsService) {
        this.verificationsService = verificationsService;
    }
    findAll(filters) {
        return this.verificationsService.findAllForAdmin(filters);
    }
    reviewRequest(id, dto, adminContext) {
        return this.verificationsService.reviewRequest(id, adminContext.userId, dto, adminContext);
    }
    reviewDocument(id, status, reason, adminContext) {
        return this.verificationsService.reviewDocument(id, status, adminContext.userId, reason);
    }
};
exports.AdminVerificationsController = AdminVerificationsController;
__decorate([
    (0, common_1.Get)('requests'),
    (0, require_permissions_decorator_1.RequirePermissions)('verifications.view'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminVerificationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('requests/:id/review'),
    (0, require_permissions_decorator_1.RequirePermissions)('verifications.review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_request_dto_1.ReviewRequestDto, Object]),
    __metadata("design:returntype", void 0)
], AdminVerificationsController.prototype, "reviewRequest", null);
__decorate([
    (0, common_1.Patch)('documents/:id/status'),
    (0, require_permissions_decorator_1.RequirePermissions)('verifications.review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('reason')),
    __param(3, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], AdminVerificationsController.prototype, "reviewDocument", null);
exports.AdminVerificationsController = AdminVerificationsController = __decorate([
    (0, common_1.Controller)('admin/verifications'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    __metadata("design:paramtypes", [verifications_service_1.VerificationsService])
], AdminVerificationsController);
//# sourceMappingURL=admin-verifications.controller.js.map