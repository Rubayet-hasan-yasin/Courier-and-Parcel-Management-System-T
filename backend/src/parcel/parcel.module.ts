import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParcelService } from './parcel.service';
import { ParcelController } from './parcel.controller';
import { Parcel } from './entities/parcel.entity';

import { EventsModule } from '../events/events.module';
import { NotificationModule } from '../notification/notification.module';
import { MapsModule } from '../maps/maps.module';

@Module({
  imports: [TypeOrmModule.forFeature([Parcel]), EventsModule, NotificationModule, MapsModule],
  controllers: [ParcelController],
  providers: [ParcelService],
  exports: [ParcelService],
})
export class ParcelModule { }
