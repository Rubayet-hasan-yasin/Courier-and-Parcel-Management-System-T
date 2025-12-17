import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { ParcelSize } from '../enums/parcel-size.enum';
import { ParcelType } from '../enums/parcel-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * DTO for creating a new parcel booking
 */
export class CreateParcelDto {
    @ApiProperty({
        description: 'Pickup address',
        example: '123 Main Street, Dhaka 1205',
    })
    @IsString()
    @IsNotEmpty()
    pickupAddress: string;

    @ApiProperty({
        description: 'Pickup latitude (optional)',
        example: 23.8103,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    pickupLatitude?: number;

    @ApiProperty({
        description: 'Pickup longitude (optional)',
        example: 90.4125,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    pickupLongitude?: number;

    @ApiProperty({
        description: 'Delivery address',
        example: '456 Park Avenue, Chittagong 4100',
    })
    @IsString()
    @IsNotEmpty()
    deliveryAddress: string;

    @ApiProperty({
        description: 'Delivery latitude (optional)',
        example: 22.3569,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    deliveryLatitude?: number;

    @ApiProperty({
        description: 'Delivery longitude (optional)',
        example: 91.7832,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    deliveryLongitude?: number;

    @ApiProperty({
        description: 'Parcel size',
        enum: ParcelSize,
        example: ParcelSize.MEDIUM,
    })
    @IsEnum(ParcelSize)
    @IsNotEmpty()
    parcelSize: ParcelSize;

    @ApiProperty({
        description: 'Parcel type/category',
        enum: ParcelType,
        example: ParcelType.PACKAGE,
    })
    @IsEnum(ParcelType)
    @IsNotEmpty()
    parcelType: ParcelType;

    @ApiProperty({
        description: 'Parcel description (optional)',
        example: 'Electronics - Mobile Phone',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Weight in kg (optional)',
        example: 2.5,
        required: false,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    weight?: number;

    @ApiProperty({
        description: 'Payment method',
        enum: PaymentMethod,
        example: PaymentMethod.COD,
    })
    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    paymentMethod: PaymentMethod;

    @ApiProperty({
        description: 'COD amount (required if payment method is COD)',
        example: 5000,
        required: false,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    codAmount?: number;

    @ApiProperty({
        description: 'Delivery charge',
        example: 150,
        required: false,
        default: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    deliveryCharge?: number;
}
