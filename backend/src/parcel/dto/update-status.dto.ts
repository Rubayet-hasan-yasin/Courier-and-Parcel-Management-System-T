import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ParcelStatus } from '../enums/parcel-status.enum';

/**
 * DTO for updating parcel status
 * Used by delivery agents and admins
 */
export class UpdateStatusDto {
    @ApiProperty({
        description: 'New status for the parcel',
        enum: ParcelStatus,
        example: ParcelStatus.IN_TRANSIT,
    })
    @IsEnum(ParcelStatus)
    @IsNotEmpty()
    status: ParcelStatus;

    @ApiProperty({
        description: 'Reason for failure (required if status is FAILED)',
        example: 'Customer not available',
        required: false,
    })
    @IsString()
    @IsOptional()
    failureReason?: string;
}
