"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const admin_session_service_1 = require("../common/services/admin-session.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    adminSessionService;
    constructor(usersService, jwtService, adminSessionService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.adminSessionService = adminSessionService;
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findOneByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            email: registerDto.email,
            password: hashedPassword,
            full_name: registerDto.full_name,
            phone: registerDto.phone,
            role: registerDto.role,
            verified: false,
        });
        const { password, ...result } = user;
        return {
            user: result,
            token: await this.generateToken(user.id, user.email, user.role),
        };
    }
    async login(loginDto, ipAddress = 'unknown', userAgent = 'unknown') {
        const user = await this.usersService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { password, ...result } = user;
        const token = await this.generateToken(user.id, user.email, user.role);
        let adminSessionToken;
        let adminRefreshToken;
        const adminRoles = ['admin', 'super_admin', 'finance_admin', 'support_admin', 'compliance_admin'];
        if (adminRoles.includes(user.role)) {
            const session = await this.adminSessionService.createSession({
                userId: user.id,
                ipAddress,
                userAgent
            });
            adminSessionToken = session.token;
            adminRefreshToken = session.refresh_token || undefined;
        }
        return {
            user: result,
            token,
            adminSessionToken,
            adminRefreshToken,
        };
    }
    async adminLogin(loginDto, ipAddress, userAgent) {
        const user = await this.usersService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const adminRoles = ['admin', 'super_admin', 'finance_admin', 'support_admin', 'compliance_admin'];
        if (!adminRoles.includes(user.role)) {
            throw new common_1.ForbiddenException('Not authorized for admin access');
        }
        const session = await this.adminSessionService.createSession({
            userId: user.id,
            ipAddress,
            userAgent
        });
        const { password, ...result } = user;
        return {
            user: result,
            token: session.token,
            refreshToken: session.refresh_token
        };
    }
    async generateToken(userId, email, role) {
        const payload = { sub: userId, email, role };
        return this.jwtService.signAsync(payload);
    }
    async getProfile(userId) {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        const { password, ...result } = user;
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        admin_session_service_1.AdminSessionService])
], AuthService);
//# sourceMappingURL=auth.service.js.map