import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

/**
 * DTO for creating a new user
 * Used by admin to create users or during self-registration
 */
export class CreateUserDto {
    @ApiProperty({
        description: 'Full name of the user',
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
        description: 'User role',
        enum: UserRole,
        example: UserRole.CUSTOMER,
        required: false,
        default: UserRole.CUSTOMER,
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
