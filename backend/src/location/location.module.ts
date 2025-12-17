import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Location } from './entities/location.entity';
import { ParcelModule } from '../parcel/parcel.module';

/**
 * Location Module
 * Handles GPS location tracking for parcels
 */
@Module({
  imports: [TypeOrmModule.forFeature([Location]), ParcelModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule { }
