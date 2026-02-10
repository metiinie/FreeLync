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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOneByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findOneById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async create(data) {
        return this.prisma.user.create({
            data,
        });
    }
    async update(id, data) {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
    async findAll(options) {
        const { page, limit, search, role, verified, is_active } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (role)
            where.role = role;
        if (verified !== undefined)
            where.verified = verified;
        if (is_active !== undefined)
            where.is_active = is_active;
        if (search) {
            where.OR = [
                { full_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    phone: true,
                    role: true,
                    verified: true,
                    avatar_url: true,
                    is_active: true,
                    created_at: true,
                }
            }),
            this.prisma.user.count({ where }),
        ]);
        return { data, total, success: true };
    }
    async getStats() {
        const [total, verified, active] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { verified: true } }),
            this.prisma.user.count({ where: { is_active: true } }),
        ]);
        return {
            success: true,
            data: { total, verified, active }
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map