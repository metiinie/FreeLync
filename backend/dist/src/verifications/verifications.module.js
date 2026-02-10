"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationsModule = void 0;
const common_1 = require("@nestjs/common");
const verifications_service_1 = require("./verifications.service");
const verifications_controller_1 = require("./verifications.controller");
const admin_verifications_controller_1 = require("./admin-verifications.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const notifications_module_1 = require("../notifications/notifications.module");
let VerificationsModule = class VerificationsModule {
};
exports.VerificationsModule = VerificationsModule;
exports.VerificationsModule = VerificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, notifications_module_1.NotificationsModule],
        controllers: [verifications_controller_1.VerificationsController, admin_verifications_controller_1.AdminVerificationsController],
        providers: [verifications_service_1.VerificationsService],
        exports: [verifications_service_1.VerificationsService],
    })
], VerificationsModule);
//# sourceMappingURL=verifications.module.js.map