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
exports.AdminDisputesController = void 0;
const common_1 = require("@nestjs/common");
const disputes_service_1 = require("./disputes.service");
const admin_context_decorator_1 = require("../common/decorators/admin-context.decorator");
const permission_guard_1 = require("../common/guards/permission.guard");
const audit_interceptor_1 = require("../common/interceptors/audit.interceptor");
const require_permissions_decorator_1 = require("../common/decorators/require-permissions.decorator");
const audited_decorator_1 = require("../common/decorators/audited.decorator");
let AdminDisputesController = class AdminDisputesController {
    disputesService;
    constructor(disputesService) {
        this.disputesService = disputesService;
    }
    async findAll(admin) {
        return this.disputesService.findAll(admin.userId, admin.role);
    }
    async findOne(id, admin) {
        return this.disputesService.findOne(id, admin.userId, admin.role);
    }
    async assignMember(id, admin) {
        return this.disputesService.assignMember(id, admin.userId, admin);
    }
    async resolve(id, dto, admin) {
        return this.disputesService.resolve(id, dto, admin);
    }
    async addMessage(id, dto, admin) {
        return this.disputesService.addMessage(id, dto, admin.userId, true);
    }
};
exports.AdminDisputesController = AdminDisputesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('disputes.view'),
    __param(0, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminDisputesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('disputes.view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminDisputesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    (0, require_permissions_decorator_1.RequirePermissions)('disputes.manage'),
    (0, audited_decorator_1.Audited)({
        action: 'disputes.assign',
        resourceType: 'Dispute',
        riskLevel: 'low',
        captureAfterState: true,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminDisputesController.prototype, "assignMember", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, require_permissions_decorator_1.RequirePermissions)('disputes.resolve'),
    (0, audited_decorator_1.Audited)({
        action: 'disputes.resolve',
        resourceType: 'Dispute',
        riskLevel: 'critical',
        captureBeforeState: true,
        captureAfterState: true,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function, Object]),
    __metadata("design:returntype", Promise)
], AdminDisputesController.prototype, "resolve", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, require_permissions_decorator_1.RequirePermissions)('disputes.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function, Object]),
    __metadata("design:returntype", Promise)
], AdminDisputesController.prototype, "addMessage", null);
exports.AdminDisputesController = AdminDisputesController = __decorate([
    (0, common_1.Controller)('admin/disputes'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    __metadata("design:paramtypes", [disputes_service_1.DisputesService])
], AdminDisputesController);
//# sourceMappingURL=admin-disputes.controller.js.map