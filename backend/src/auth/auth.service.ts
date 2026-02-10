import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AdminSessionService } from '../common/services/admin-session.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private adminSessionService: AdminSessionService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findOneByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const user = await this.usersService.create({
            email: registerDto.email,
            password: hashedPassword,
            full_name: registerDto.full_name,
            phone: registerDto.phone,
            role: registerDto.role as any,
            verified: false,
        });

        // Use spread syntax to exclude password
        const { password, ...result } = user;
        return {
            user: result,
            token: await this.generateToken(user.id, user.email, user.role),
        };
    }

    async login(loginDto: LoginDto, ipAddress: string = 'unknown', userAgent: string = 'unknown') {
        const user = await this.usersService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const { password, ...result } = user;
        const token = await this.generateToken(user.id, user.email, user.role);

        let adminSessionToken: string | undefined;
        let adminRefreshToken: string | undefined;

        // If user has admin privileges, create an Admin Session
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

    async adminLogin(loginDto: LoginDto, ipAddress: string, userAgent: string) {
        // reuse login logic OR duplicate validation to get user object
        const user = await this.usersService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            // Log failed attempt via generic service or just throw
            // ideally we'd log this in audit logs too, but for now just throw
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if admin
        const adminRoles = ['admin', 'super_admin', 'finance_admin', 'support_admin', 'compliance_admin'];
        if (!adminRoles.includes(user.role)) {
            throw new ForbiddenException('Not authorized for admin access');
        }

        // specific check for blocked/locked accounts should be here too (omitted for brevity but recommended)

        // Create Admin Session
        const session = await this.adminSessionService.createSession({
            userId: user.id,
            ipAddress,
            userAgent
        });

        const { password, ...result } = user;
        return {
            user: result,
            token: session.token, // This is the session token, not JWT
            refreshToken: session.refresh_token
        };
    }

    private async generateToken(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };
        return this.jwtService.signAsync(payload);
    }

    async getProfile(userId: string) {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new UnauthorizedException();
        }
        const { password, ...result } = user;
        return result;
    }
}
