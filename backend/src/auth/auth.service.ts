import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
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

        const { password, ...result } = user;
        return {
            user: result,
            token: await this.generateToken(user.id, user.email, user.role),
        };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const { password, ...result } = user;
        return {
            user: result,
            token: await this.generateToken(user.id, user.email, user.role),
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
