import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Parcel } from '../parcel/entities/parcel.entity';

/**
 * Analytics Module
 * Provides reporting and statistics for admin dashboard
 */
@Module({
  imports: [TypeOrmModule.forFeature([Parcel])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule { }
