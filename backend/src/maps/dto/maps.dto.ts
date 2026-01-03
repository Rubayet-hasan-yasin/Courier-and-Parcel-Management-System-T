import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsLatitude, IsLongitude, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for coordinate validation
 */
export class CoordinateDto {
    @ApiProperty({ example: 23.8103, description: 'Latitude coordinate' })
    @IsNumber()
    @IsLatitude()
    lat: number;

    @ApiProperty({ example: 90.4125, description: 'Longitude coordinate' })
    @IsNumber()
    @IsLongitude()
    lng: number;
}

/**
 * DTO for optimize route request
 */
export class OptimizeRouteDto {
    @ApiProperty({ description: 'Starting point (agent current location)', type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    origin: CoordinateDto;

    @ApiProperty({
        description: 'Array of delivery waypoints',
        type: [CoordinateDto],
        example: [
            { lat: 23.7805, lng: 90.4149 },
            { lat: 23.7515, lng: 90.3756 }
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CoordinateDto)
    waypoints: CoordinateDto[];

    @ApiPropertyOptional({ description: 'Final destination (optional)', type: CoordinateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => CoordinateDto)
    destination?: CoordinateDto;
}

/**
 * DTO for geocode request
 */
export class GeocodeAddressDto {
    @ApiProperty({ example: 'Dhaka, Bangladesh', description: 'Address to geocode' })
    address: string;
}

/**
 * DTO for distance calculation request
 */
export class CalculateDistanceDto {
    @ApiProperty({ description: 'Origin point', type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    origin: CoordinateDto;

    @ApiProperty({ description: 'Destination point', type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    destination: CoordinateDto;
}
