"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiriesModule = void 0;
const common_1 = require("@nestjs/common");
const inquiries_service_1 = require("./inquiries.service");
const inquiries_controller_1 = require("./inquiries.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let InquiriesModule = class InquiriesModule {
};
exports.InquiriesModule = InquiriesModule;
exports.InquiriesModule = InquiriesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [inquiries_controller_1.InquiriesController],
        providers: [inquiries_service_1.InquiriesService],
    })
], InquiriesModule);
//# sourceMappingURL=inquiries.module.js.map