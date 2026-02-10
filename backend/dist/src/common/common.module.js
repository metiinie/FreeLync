"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("./services/audit.service");
const permission_service_1 = require("./services/permission.service");
const admin_session_service_1 = require("./services/admin-session.service");
const event_dispatcher_service_1 = require("./services/event-dispatcher.service");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_module_1 = require("../notifications/notifications.module");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        providers: [
            audit_service_1.AuditService,
            permission_service_1.PermissionService,
            admin_session_service_1.AdminSessionService,
            event_dispatcher_service_1.EventDispatcherService,
            prisma_service_1.PrismaService,
        ],
        exports: [
            audit_service_1.AuditService,
            permission_service_1.PermissionService,
            admin_session_service_1.AdminSessionService,
            event_dispatcher_service_1.EventDispatcherService,
        ],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map