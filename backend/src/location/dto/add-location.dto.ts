import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTO for adding a location update
 */
export class AddLocationDto {
    @ApiProperty({
        description: 'Latitude coordinate',
        example: 23.8103,
    })
    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @ApiProperty({
        description: 'Longitude coordinate',
        example: 90.4125,
    })
    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @ApiProperty({
        description: 'Address or location name (optional)',
        example: 'Mirpur-10 Circle, Dhaka',
        required: false,
    })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({
        description: 'Additional notes (optional)',
        example: 'Waiting at checkpoint',
        required: false,
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
