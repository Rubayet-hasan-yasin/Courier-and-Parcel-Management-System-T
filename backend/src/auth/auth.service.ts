import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto): Promise<User> {
        try {
            const user = await this.userService.create(registerDto);
            return user;
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new Error('Error during registration');
        }
    }

    async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const token = this.jwtService.sign(payload);

        const { password, ...userWithoutPassword } = user;

        return {
            access_token: token,
            user: userWithoutPassword,
        };
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userService.findByEmail(email);

        if (!user) {
            return null;
        }

        const isPasswordValid = await this.userService.validatePassword(
            user,
            password,
        );

        if (!isPasswordValid) {
            return null;
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        return user;
    }
}
