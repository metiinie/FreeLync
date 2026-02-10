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
exports.AdminListingsController = void 0;
const common_1 = require("@nestjs/common");
const listings_service_1 = require("./listings.service");
const permission_guard_1 = require("../common/guards/permission.guard");
const audit_interceptor_1 = require("../common/interceptors/audit.interceptor");
const require_permissions_decorator_1 = require("../common/decorators/require-permissions.decorator");
const audited_decorator_1 = require("../common/decorators/audited.decorator");
const admin_context_decorator_1 = require("../common/decorators/admin-context.decorator");
let AdminListingsController = class AdminListingsController {
    listingsService;
    constructor(listingsService) {
        this.listingsService = listingsService;
    }
    async getAllListings(admin, query) {
        return this.listingsService.getAllListingsForAdmin(admin.userId, query);
    }
    async approveListing(id, dto, admin) {
        if (!dto.reason || dto.reason.length < 10) {
            throw new common_1.BadRequestException('Reason required for approval (min 10 characters)');
        }
        return this.listingsService.approveListing(id, {
            approvedBy: admin.userId,
            reason: dto.reason,
            notes: dto.notes,
        });
    }
    async rejectListing(id, dto, admin) {
        if (!dto.reason || dto.reason.length < 20) {
            throw new common_1.BadRequestException('Detailed reason required for rejection (min 20 characters)');
        }
        return this.listingsService.rejectListing(id, {
            rejectedBy: admin.userId,
            reason: dto.reason,
        });
    }
    async deleteListing(id, dto, admin) {
        if (!dto.reason || dto.reason.length < 30) {
            throw new common_1.BadRequestException('Detailed justification required for deletion (min 30 characters)');
        }
        return this.listingsService.deleteListingAsAdmin(id, {
            deletedBy: admin.userId,
            reason: dto.reason,
        });
    }
};
exports.AdminListingsController = AdminListingsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('listings.view'),
    __param(0, (0, admin_context_decorator_1.AdminContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminListingsController.prototype, "getAllListings", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, require_permissions_decorator_1.RequirePermissions)('listings.approve'),
    (0, audited_decorator_1.Audited)({
        action: 'listing.approve',
        resourceType: 'Listing',
        riskLevel: 'medium',
        captureBeforeState: true,
        captureAfterState: true,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminListingsController.prototype, "approveListing", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, require_permissions_decorator_1.RequirePermissions)('listings.reject'),
    (0, audited_decorator_1.Audited)({
        action: 'listing.reject',
        resourceType: 'Listing',
        riskLevel: 'medium',
        captureBeforeState: true,
        captureAfterState: true,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminListingsController.prototype, "rejectListing", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('listings.delete'),
    (0, audited_decorator_1.Audited)({
        action: 'listing.delete',
        resourceType: 'Listing',
        riskLevel: 'high',
        captureBeforeState: true,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, admin_context_decorator_1.AdminContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminListingsController.prototype, "deleteListing", null);
exports.AdminListingsController = AdminListingsController = __decorate([
    (0, common_1.Controller)('admin/listings'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    __metadata("design:paramtypes", [listings_service_1.ListingsService])
], AdminListingsController);
//# sourceMappingURL=admin-listings.controller.js.map