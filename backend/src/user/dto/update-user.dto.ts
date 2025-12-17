import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO for updating user information
 * Password and role updates are excluded (handled separately)
 */
export class UpdateUserDto extends PartialType(
    OmitType(CreateUserDto, ['password', 'email', 'role'] as const),
) { }

import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
    @ApiProperty({
        description: 'New role for the user',
        enum: UserRole,
        example: UserRole.DELIVERY_AGENT,
    })
    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;
}
