import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { UserRole } from '../../user/enums/user-role.enum';

/**
 * DTO for user registration
 */
export class RegisterDto {
    @ApiProperty({
        description: 'Full name',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Email address (must be unique)',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Password (minimum 6 characters)',
        example: 'SecurePass123',
        minLength: 6,
    })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description: 'User role (defaults to customer)',
        enum: UserRole,
        example: UserRole.CUSTOMER,
        required: false,
    })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @ApiProperty({
        description: 'Phone number',
        example: '+8801234567890',
        required: false,
    })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({
        description: 'Full address',
        example: '123 Main Street, Dhaka, Bangladesh',
        required: false,
    })
    @IsString()
    @IsOptional()
    address?: string;
}
